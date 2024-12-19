const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');

function createClient() {
    return new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: puppeteer.executablePath(),
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });
}

module.exports = {
    createClient,
    ALLOWED_NUMBER: '558586749017', // Número permitido
};