const { encerrarAtendimento } = require('./utils');

const menus = {
    principal: {
        text: '*Menu Principal:*\n1 - Financeiro\n2 - RH\n9 - Voltar\n0 - Encerrar Atendimento',
        aliases: { '1': '1', '2': '2', '9': '9', '0': '0', 'encerrar': '0', 'voltar': '9', 'financeiro': '1', 'rh': '2' },
        handlers: {
            '1': async (client, message, state) => {
                state.currentMenu = 'financeiro';
                await client.sendMessage(message.from, menus.financeiro.text);
            },
            '2': async (client, message, state) => {
                state.currentMenu = 'rh';
                await client.sendMessage(message.from, menus.rh.text);
            },
            '0': async (client, message, state, foneNumber, userStates) => {
                await encerrarAtendimento(client, message, foneNumber, userStates);
            }
        }
    },
    financeiro: {
        text: '*Menu Financeiro:*\n1 - Consultar Saldo\n2 - Solicitar Extrato\n3 - Falar com Atendente\n9 - Voltar\n0 - Encerrar Atendimento',
        aliases: { '1': '1', '2': '2', '3': '3', '9': '9', '0': '0', 'voltar': '9', 'encerrar': '0', 'falar com atendente': '3' },
        handlers: {
            '1': async (client, message, state) => {
                state.currentMenu = 'consultarSaldo';
                await client.sendMessage(message.from, menus.consultarSaldo.text);
            },
            '2': async (client, message, state) => {
                state.currentMenu = 'solicitarExtrato';
                await client.sendMessage(message.from, menus.solicitarExtrato.text);
            },
            '3': async (client, message, state) => {
                state.currentMenu = 'atendimentoHumano';
                saveUserStates(userStates);
                await client.sendMessage(
                    message.from,
                    'Você será transferido para um atendente humano. Por favor, aguarde!'
                );
            },
            '9': async (client, message, state) => {
                state.currentMenu = 'principal';
                await client.sendMessage(message.from, menus.principal.text);
            },
            '0': async (client, message, state, foneNumber, userStates) => {
                await encerrarAtendimento(client, message, foneNumber, userStates);
            }
        }
    },
    consultarSaldo: {
        text: '*Consulta de Saldo:*\nSeu saldo atual é R$ 1.000,00.\n9 - Voltar\n0 - Encerrar Atendimento',
        aliases: { '9': '9', '0': '0', 'voltar': '9', 'encerrar': '0' },
        handlers: {
            '9': async (client, message, state) => {
                state.currentMenu = 'financeiro';
                await client.sendMessage(message.from, menus.financeiro.text);
            },
            '0': async (client, message, state, foneNumber, userStates) => {
                await encerrarAtendimento(client, message, foneNumber, userStates);
            }
        }
    },
    solicitarExtrato: {
        text: '*Solicitação de Extrato:*\nSeu extrato será enviado para seu email.\n9 - Voltar\n0 - Encerrar Atendimento',
        aliases: { '9': '9', '0': '0', 'voltar': '9', 'encerrar': '0' },
        handlers: {
            '9': async (client, message, state) => {
                state.currentMenu = 'financeiro';
                await client.sendMessage(message.from, menus.financeiro.text);
            },
            '0': async (client, message, state, foneNumber, userStates) => {
                await encerrarAtendimento(client, message, foneNumber, userStates);
            }
        }
    },
    rh: {
        text: '*Menu RH:*\n1 - Folha de Pagamento\n2 - Benefícios\n3 - Falar com Atendente\n9 - Voltar\n0 - Encerrar Atendimento',
        aliases: { '1': '1', '2': '2', '3': '3', '9': '9', '0': '0', 'voltar': '9', 'encerrar': '0', 'falar com atendente': '3' },
        handlers: {
            '1': async (client, message) => {
                await client.sendMessage(message.from, 'Você escolheu Folha de Pagamento.');
            },
            '2': async (client, message) => {
                await client.sendMessage(message.from, 'Você escolheu Benefícios.');
            },
            '3': async (client, message, state) => {
                state.currentMenu = 'atendimentoHumano';
                saveUserStates(userStates);
                await client.sendMessage(
                    message.from,
                    'Você será transferido para um atendente humano. Por favor, aguarde!'
                );
            },
            '9': async (client, message, state) => {
                state.currentMenu = 'principal';
                await client.sendMessage(message.from, menus.principal.text);
            },
            '0': async (client, message, state, foneNumber, userStates) => {
                await encerrarAtendimento(client, message, foneNumber, userStates);
            }
        }
    }
};

const globalHandlers = {
    'encerrar': async (client, message, state, foneNumber, userStates) => {
        console.log(`⚙️ Handler global de encerramento acionado para ${foneNumber}.`);
        await encerrarAtendimento(client, message, foneNumber, userStates);
    }
};

module.exports = { menus, globalHandlers };