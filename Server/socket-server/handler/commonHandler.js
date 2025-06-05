const fs = require('fs');
const { get } = require('http');
const path = require('path');
const DATA_FILE = path.join(__dirname, '../data/roomData.json');
const CHARACTER_DATA = path.join(__dirname, '../data/character.json');

module.exports = {
    getRoomNameBySocketId(socketId) {
        const roomData = this.readRoomData();
        for (const roomName in roomData) {
            if (roomData[roomName].player.some(playerObj => Object.keys(playerObj)[0] === socketId)) {
                return roomName;
            }
        }
        return null;
    },

    readRoomData() {
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE);
            try {
                return JSON.parse(rawData);
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return {};
            }
        }
        return {};
    },
    
    writeRoomData(data) {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } catch (err) {
            console.error("Không thể ghi file:", err);
        }
    },

    getCharacterData(characterIndex) {
        if (fs.existsSync(CHARACTER_DATA)) {
            const rawData = fs.readFileSync(CHARACTER_DATA);
            try {
                const characterData = JSON.parse(rawData);
                return characterData.heroes[characterIndex] || null;
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return null;
            }
        }
    }
}