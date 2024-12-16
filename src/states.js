const fs = require('fs');
const path = require('path');

const USER_STATES_FILE = path.join(__dirname, 'userStates.json');

function loadUserStates() {
    if (fs.existsSync(USER_STATES_FILE)) {
        return JSON.parse(fs.readFileSync(USER_STATES_FILE, 'utf8'));
    }
    return {};
}

function saveUserStates(states) {
    fs.writeFileSync(USER_STATES_FILE, JSON.stringify(states, null, 2), 'utf8');
}

module.exports = { loadUserStates, saveUserStates };