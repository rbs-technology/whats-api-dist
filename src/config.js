const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');

function createClient() {
    return new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: puppeteer.executablePath(),
            headless: true,
            timeout: 60000
        }
    });
}

module.exports = createClient;