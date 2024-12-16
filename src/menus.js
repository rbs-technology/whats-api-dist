const { encerrarAtendimento } = require('./utils');

const menus = {
    principal: {
        text: '*Escolha uma opção:*\n1 - Financeiro\n2 - RH\n0 - Voltar',
        aliases: { '0': '0', '1': '1', 'financeiro': '1', '2': '2', 'rh': '2' },
        handlers: {
            '1': async (client, message, state) => {
                state.currentMenu = 'financeiro';
                await client.sendMessage(message.from, 'Você entrou no setor Financeiro.');
            },
            '2': async (client, message, state) => {
                state.currentMenu = 'rh';
                await client.sendMessage(message.from, 'Você entrou no setor RH.');
            },
            '0': async (client, message, state) => {
                state.currentMenu = 'principal';
                await client.sendMessage(message.from, menus.principal.text);
            }
        }
    },
    financeiro: {
        text: 'Setor Financeiro:\n1 - Opção A\n2 - Opção B\n0 - Voltar',
        aliases: { '0': '0', '1': '1', '2': '2' },
        handlers: {
            '0': async (client, message, state) => {
                state.currentMenu = 'principal';
                await client.sendMessage(message.from, menus.principal.text);
            }
        }
    },
    rh: {
        text: 'Setor RH:\n1 - Opção A\n2 - Opção B\n0 - Voltar',
        aliases: { '0': '0', '1': '1', '2': '2' },
        handlers: {
            '0': async (client, message, state) => {
                state.currentMenu = 'principal';
                await client.sendMessage(message.from, menus.principal.text);
            }
        }
    }
};

const globalHandlers = {
    'encerrar': async (client, message, state, foneNumber, userStates) => {
        console.log(`⚙️ Handler global de encerramento acionado para ${foneNumber}.`);
        if (!userStates) {
            console.error('❌ userStates não está definido no handler global de encerramento.');
            return;
        }
        await encerrarAtendimento(client, message, foneNumber, userStates);
    }
};

module.exports = { menus, globalHandlers };