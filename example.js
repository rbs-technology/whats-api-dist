const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const USER_STATES_FILE = path.join(__dirname, 'userStates.json');

function loadUserStates() {
    if (fs.existsSync(USER_STATES_FILE)) {
        const data = fs.readFileSync(USER_STATES_FILE, 'utf8');
        return JSON.parse(data);
    }
    return {};
}

function saveUserStates(states) {
    fs.writeFileSync(USER_STATES_FILE, JSON.stringify(states, null, 2), 'utf8');
}

let userStates = loadUserStates(); 

const MESSAGES = {
    INVALID_OPTION: 'Opção inválida. Tente novamente.',
    END_ATTENDANCE: 'Atendimento encerrado. Até breve!'
};

function obterPeriodo(userTimezone = 'America/Sao_Paulo') {
    const currentHour = moment().tz(userTimezone).hour();
    if (currentHour >= 5 && currentHour < 12) return 'bom dia';
    if (currentHour >= 12 && currentHour < 18) return 'boa tarde';
    return 'boa noite';
}

function voltarMenuAnterior(foneNumber) {
    const state = userStates[foneNumber];
    if (state && state.history.length > 1) {
        state.history.pop();
        state.currentMenu = state.history[state.history.length - 1];
        saveUserStates(userStates);
        return state.currentMenu;
    }
    return null;
}

async function exibirMenu(client, message, menuKey) {
    const foneNumber = message.from.split('@')[0];
    const contatoNome = message._data.notifyName ? ` ${message._data.notifyName}` : '';
    const periodo = obterPeriodo();

    if (!userStates[foneNumber]) {
        userStates[foneNumber] = { 
            currentMenu: 'principal', 
            history: ['principal'], 
            lastInteraction: Date.now(),
            humanizado: false,
            humanizadoAt: null
        };
        saveUserStates(userStates);

        // Mensagem de boas-vindas informando sobre "encerrar"
        const msgBoasVindas = `Olá${contatoNome}, ${periodo}!\nSeja bem-vindo ao atendimento automatizado da RBS Technology!\n\nVocê pode digitar "encerrar" a qualquer momento para encerrar o atendimento imediatamente.`;
        await client.sendMessage(message.from, msgBoasVindas);
    }

    const state = userStates[foneNumber];

    if (state.currentMenu !== menuKey) {
        state.history.push(menuKey);
        state.currentMenu = menuKey;
        saveUserStates(userStates);
    }

    const menu = menus[menuKey];
    if (menu && menu.text) {
        await client.sendMessage(message.from, menu.text);
    }
}

function atendimentoExpirado(state) {
    if (!state.lastInteraction) return false;
    const now = Date.now();
    const diff = now - state.lastInteraction;
    // 1 hora se atendimento (humanizado), senão 15 min
    const limite = state.humanizado ? 3600000 : 900000;
    return diff > limite;
}

async function encerrarAtendimento(client, message, foneNumber) {
    await client.sendMessage(message.from, MESSAGES.END_ATTENDANCE);
    delete userStates[foneNumber];
    saveUserStates(userStates);
}

function verificarViradaDia(state) {
    if (!state.humanizadoAt) return;
    const hoje = moment().format('YYYY-MM-DD');
    const diaHumanizado = moment(state.humanizadoAt).format('YYYY-MM-DD');
    if (hoje !== diaHumanizado) {
        state.humanizado = false;
        state.humanizadoAt = null;
        saveUserStates(userStates);
    }
}

// Definição dos menus, aliases e handlers
const menus = {
    principal: {
        text: '*Com qual setor deseja falar?*\n\n1 - Financeiro\n2 - RH',
        aliases: {
            '1': '1', 'financeiro': '1',
            '2': '2', 'rh': '2'
        },
        handlers: {
            '1': async (client, message) => {
                await exibirMenu(client, message, 'financeiro');
            },
            '2': async (client, message) => {
                await exibirMenu(client, message, 'rh');
            }
        }
    },
    financeiro: {
        text: 'Você está no setor Financeiro.\n\n1 - Opção Financeira A\n2 - Opção Financeira B',
        aliases: {
            '1': '1', 'opção financeira a': '1', 'financeira a': '1', 'opção a': '1',
            '2': '2', 'opção financeira b': '2', 'financeira b': '2', 'opção b': '2'
        },
        handlers: {
            '1': async (client, message) => {
                await client.sendMessage(message.from, 'Você escolheu a opção 1 do setor financeiro.');
                await exibirMenu(client, message, 'financeiro');
            },
            '2': async (client, message) => {
                await client.sendMessage(message.from, 'Você escolheu a opção 2 do setor financeiro.');
                await exibirMenu(client, message, 'financeiro');
            }
        }
    },
    rh: {
        text: 'Você está no setor de RH.\n\n1 - Opção RH A\n2 - Opção RH B',
        aliases: {
            '1': '1', 'opção rh a': '1', 'rh a': '1', 'a': '1',
            '2': '2', 'opção rh b': '2', 'rh b': '2', 'b': '2'
        },
        handlers: {
            '1': async (client, message) => {
                await client.sendMessage(message.from, 'Você escolheu a opção 1 do setor de RH.');
                await exibirMenu(client, message, 'rh');
            },
            '2': async (client, message) => {
                await client.sendMessage(message.from, 'Você escolheu a opção 2 do setor de RH.');
                await exibirMenu(client, message, 'rh');
            }
        }
    }
};

// Opções globais (0 e 9) - 0 = Voltar, 9 = Atendimento, "encerrar" para encerrar
const globalAliases = {
    '0': '0', 'voltar': '0',
    '9': '9', 'atendimento': '9',
    'encerrar': 'encerrar'
};

// Handlers globais
const globalHandlers = {
    '0': async (client, message, state, foneNumber) => {
        const menuAnterior = voltarMenuAnterior(foneNumber);
        if (menuAnterior) {
            await exibirMenu(client, message, menuAnterior);
        } else {
            await exibirMenu(client, message, 'principal');
        }
    },
    '9': async (client, message, state, foneNumber, chat) => {
        state.humanizado = true;
        state.humanizadoAt = Date.now();
        saveUserStates(userStates);
        await client.sendMessage(message.from, 'Você está agora em atendimento. Aguardando um atendente...');
        await chat.markUnread();
    },
    'encerrar': async (client, message, state, foneNumber) => {
        await encerrarAtendimento(client, message, foneNumber);
    }
};

// Acrescentando automaticamente "0 - Voltar\n9 - Atendimento" em todos os menus
for (const key in menus) {
    menus[key].text += '\n\n0 - Voltar\n9 - Atendimento';
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: puppeteer.executablePath(), // Garante que usa o navegador correto
        headless: true, // Executa o navegador sem interface gráfica
        timeout: 60000  // Aumenta o tempo de timeout
    }
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async message => {
    const foneNumber = message.from.split('@')[0];
    const chat = await message.getChat();
    let input = message.body.trim().toLowerCase();

    console.log(`Mensagem recebida de ${foneNumber} -> ${message.body}`);

    if (foneNumber !== '558586749017' && foneNumber !== '558592904063') {
        return; 
    }

    const state = userStates[foneNumber];

    // Primeira interação
    if (!state) {
        await exibirMenu(client, message, 'principal');
        return;
    }

    // Verifica se atendimento expirou
    if (atendimentoExpirado(state)) {
        await encerrarAtendimento(client, message, foneNumber);
        return;
    }

    state.lastInteraction = Date.now();
    saveUserStates(userStates);

    verificarViradaDia(state);

    // Se em atendimento, verifica se é "encerrar"
    if (state.humanizado) {
        const optionFromGlobal = globalAliases[input];
        if (optionFromGlobal === 'encerrar') {
            await globalHandlers['encerrar'](client, message, state, foneNumber);
            return;
        }
        // Caso contrário, apenas marca como não lido e não responde
        await chat.markUnread();
        return;
    }

    const currentMenuKey = state.currentMenu;
    const currentMenu = menus[currentMenuKey];

    if (!currentMenu) {
        state.currentMenu = 'principal';
        state.history = ['principal'];
        saveUserStates(userStates);
        await exibirMenu(client, message, 'principal');
        return;
    }

    const { aliases, handlers } = currentMenu;
    const optionFromMenu = aliases[input];

    let option = optionFromMenu;
    if (!option) {
        const optionFromGlobal = globalAliases[input];
        if (optionFromGlobal) {
            option = optionFromGlobal;
        }
    }

    if (option) {
        let handler = handlers[option];
        if (!handler) {
            handler = globalHandlers[option]; // Pode ser global
        }

        if (handler) {
            await handler(client, message, state, foneNumber, chat);
        } else {
            await client.sendMessage(message.from, MESSAGES.INVALID_OPTION);
            await exibirMenu(client, message, currentMenuKey);
        }
    } else {
        await client.sendMessage(message.from, MESSAGES.INVALID_OPTION);
        await exibirMenu(client, message, currentMenuKey);
    }
});

client.initialize();