const fs = require('fs');
const { get } = require('http');
const path = require('path');
const DATA_FILE = path.join(__dirname, '../data/roomData.json');
const CHARACTER_DATA = path.join(__dirname, '../data/character.json');
const MAP_DATA = path.join(__dirname, '../data/mapData.json');

module.exports = {
    TYPE : {
        "WARNING": 'warning',
        "ERROR": 'error',
        "SUCCESS": 'success'
    },
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
    },

    getCharacterById(characterId) {
        if (fs.existsSync(CHARACTER_DATA)) {
            const rawData = fs.readFileSync(CHARACTER_DATA);
            try {
                const characterData = JSON.parse(rawData);
                let heroes = characterData.heroes || {};
                let bosses = characterData.bosses || {};
                let enemies = characterData.enemies || {};
                for (const hero of Object.values(heroes)) {
                    if (hero.id === characterId) {
                        return hero;
                    }
                }
                
                for (const boss of Object.values(bosses)) {
                    if (boss.id === characterId) {
                        return boss;
                    }
                }

                for (const enemy of Object.values(enemies)) {
                    if (enemy.id === characterId) {
                        return enemy;
                    }
                }
                
                return null;
            }
            catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return null;
            }
        } else {
            console.error("File dữ liệu nhân vật không tồn tại:", CHARACTER_DATA);
            return null;
        }
    },

    getHeroById(socketId) {
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE);
            try {
                const characterData = JSON.parse(rawData);
                return characterData.heroes.find(hero => hero.id === socketId) || null;
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return null;
            }
            
        }
        return null;
    },

    isHero(characterId) {
        if (fs.existsSync(CHARACTER_DATA)) {
            const rawData = fs.readFileSync(CHARACTER_DATA);
            try {
                const characterData = JSON.parse(rawData);
                return characterData.heroes.some(hero => hero.id === characterId);
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return false;
            }
        }
        return false;
    },

    getBossDataByIndex(index) {
        if (fs.existsSync(CHARACTER_DATA)) {
            const rawData = fs.readFileSync(CHARACTER_DATA);
            try {
                const characterData = JSON.parse(rawData);
                return characterData.bosses[index] || null;
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return null;
            }
        }
        return null;
    },

    getInGameCharacterData(characterId, roomData, roomName) {
        if (!roomData || !roomData[roomName]) {
            console.error("Không tìm thấy dữ liệu phòng.");
            return null;
        }

        const heroes = roomData[roomName].gameState.heroes || [];
        const bosses = roomData[roomName].gameState.bosses || [];

        const character = heroes.find(hero => hero.heroId === characterId) || 
                          bosses.find(boss => boss.bossId === characterId);
        if (character) {
            return character;
        }
        console.error("Không tìm thấy nhân vật trong phòng:", characterId);
        return null;
    },

    getBossIndex(mapIndex) {
        if (fs.existsSync(MAP_DATA)) {
            const rawData = fs.readFileSync(MAP_DATA);
            try {
                const mapData = JSON.parse(rawData);
                return mapData.mapData[mapIndex].bosses || []; // Trả về chỉ số boss mặc định là 0 nếu không tìm thấy
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return 0; // Trả về chỉ số mặc định nếu có lỗi
            }
        }
        return 0; // Trả về chỉ số mặc định nếu file không tồn tại
    },

    getMapSizeByIndex(mapIndex) {
        if (fs.existsSync(MAP_DATA)) {
            const rawData = fs.readFileSync(MAP_DATA);
            try {
                const mapData = JSON.parse(rawData);
                const map = mapData.mapData[mapIndex].map;

                console.log("Map data:", map);
                console.log(map.length, map[0] ? map[0].length : 0);
                if (map) {
                    let height = map.length || 0;
                    let width = map[0] ? map[0].length : 0;
                    return { width: width, height: height };
                }
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return null; // Trả về null nếu có lỗi
            }
        }
        return null; // Trả về null nếu file không tồn tại
    }
}