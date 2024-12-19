const { createClient, ALLOWED_NUMBER } = require('./config');
const { menus, globalHandlers } = require('./menus');
const { loadUserStates, saveUserStates } = require('./states');
const { atendimentoExpirado, encerrarAtendimento } = require('./utils');

const userStates = loadUserStates();
const client = createClient();

client.on('ready', async () => console.log('✅ Client is ready!'));
client.on('authenticated', () => console.log('✅ Client is authenticated!'));
client.on('auth_failure', msg => console.error('❌ Authentication failed:', msg));

client.on('qr', qr => {
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
    console.log('📸 QR Code gerado. Escaneie para autenticar.');
});

client.on('message', async message => {
    const foneNumber = message.from.split('@')[0];

    // Valida o número permitido
    if (foneNumber !== ALLOWED_NUMBER) {
        console.log(`❌ Mensagem ignorada de número não permitido: ${foneNumber}`);
        return;
    }

    const input = message.body.trim().toLowerCase();
    console.log(`📩 Mensagem recebida de ${foneNumber}: ${input}`);

    let state = userStates[foneNumber];

    // Verifica se o usuário está em atendimento humano
    if (state && state.currentMenu === 'atendimentoHumano') {
        console.log('📴 Usuário em atendimento humano. Nenhuma resposta automática será enviada.');
        return;
    }

    // Inicializa estado do usuário se necessário
    if (!state || !state.currentMenu) {
        console.log('🔄 Criando estado inicial para o usuário...');
        state = { currentMenu: 'principal', lastInteraction: Date.now() };
        userStates[foneNumber] = state;
        saveUserStates(userStates);

        console.log('📤 Enviando menu principal após mensagem inicial...');
        await client.sendMessage(
            message.from,
            `Olá! Seja bem-vindo ao atendimento automatizado.\n\n${menus.principal.text}`
        );
        return;
    }

    state.lastInteraction = Date.now();
    saveUserStates(userStates);

    const currentMenu = menus[state.currentMenu];
    if (!currentMenu) {
        console.error('❌ Menu inválido. Redirecionando ao principal...');
        state.currentMenu = 'principal';
        await client.sendMessage(
            message.from,
            `Algo deu errado. Redirecionando ao menu principal.\n\n${menus.principal.text}`
        );
        saveUserStates(userStates);
        return;
    }

    const option = currentMenu.aliases[input]
        ? input
        : globalHandlers[input]
            ? input
            : null;

    // Se nenhuma opção é encontrada, redireciona ao menu principal
    if (!option) {
        console.log('❌ Nenhum alias ou handler global encontrado. Enviando menu principal...');
        state.currentMenu = 'principal';
        await client.sendMessage(
            message.from,
            `Olá! Não entendi sua mensagem. Por favor, escolha uma opção válida.\n\n${menus.principal.text}`
        );
        return;
    }

    const handler = currentMenu.handlers[option] || globalHandlers[option];
    if (handler) {
        console.log(`⚙️ Executando handler para a opção: ${option}`);
        await handler(client, message, state, foneNumber, userStates);
    } else {
        console.log('❌ Nenhum handler encontrado. Enviando mensagem de erro...');
        await client.sendMessage(message.from, 'Opção inválida. Tente novamente.');
    }
});

client.initialize();