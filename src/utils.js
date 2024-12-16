const moment = require('moment-timezone');

function obterPeriodo(userTimezone = 'America/Sao_Paulo') {
    const currentHour = moment().tz(userTimezone).hour();
    if (currentHour >= 5 && currentHour < 12) return 'bom dia';
    if (currentHour >= 12 && currentHour < 18) return 'boa tarde';
    return 'boa noite';
}

function atendimentoExpirado(state) {
    const now = Date.now();
    const limite = state.humanizado ? 3600000 : 900000; // 1 hora ou 15 minutos
    return now - state.lastInteraction > limite;
}

async function encerrarAtendimento(client, message, foneNumber, userStates) {
    if (!userStates || !userStates[foneNumber]) {
        console.error(`❌ Estado não encontrado para ${foneNumber}. Ignorando encerramento.`);
        return;
    }

    // Envia mensagem de encerramento
    await client.sendMessage(message.from, 'Atendimento encerrado. Até breve!');

    // Reinicia o estado do usuário
    userStates[foneNumber] = { currentMenu: null, lastInteraction: null };
    console.log(`✅ Estado de ${foneNumber} reiniciado após encerramento.`);
}

module.exports = { obterPeriodo, atendimentoExpirado, encerrarAtendimento };