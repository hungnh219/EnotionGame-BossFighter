const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/roomData.json');

function readRoomData() {
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
}

function writeRoomData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error("Không thể ghi file:", err);
    }
}

let heroSelects = {}
let lockedHeroes = {}
function selectHeroEvents(io, socket) {

    // =================== các xử lý cho 1 client ===================   
    socket.on('SELECT_HERO', (heroIndex) => {
        let roomData = readRoomData();
        console.log('Yêu cầu chọn hero từ client:', socket.id, 'Hero Index:', heroIndex);
        let roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        // change value of click hero into hero index

        if (!heroSelects[roomName]) {
            heroSelects[roomName] = {};
        }
        // check if lockedHero is not null -> return
        // const playerObjIndexLocked = roomData[roomName].findIndex(obj => Object.keys(obj)[0] === socket.id);
        const playerObjIndexLocked = roomData[roomName].player.findIndex(obj => obj[socket.id] && obj[socket.id].lockedHero !== null);
        if (playerObjIndexLocked !== -1) {
            const playerInfo = roomData[roomName][playerObjIndexLocked][socket.id];
            console.log(playerInfo.lockedHero, "playerInfo.lockedHero");
            if (playerInfo.lockedHero !== null) {
                console.log(`Player ${socket.id} đã khóa hero, không thể chọn lại.`);
                return;
            }
        }

        // Update the clickHero value in roomData and persist to file
        const playerObjIndex = roomData[roomName].player.findIndex(obj => Object.keys(obj)[0] === socket.id);
        if (playerObjIndex !== -1) {
            // roomData[roomName][player][playerObjIndex][socket.id].clickHero = heroIndex;
            roomData[roomName].player[playerObjIndex][socket.id].clickHero = heroIndex;
            writeRoomData(roomData); // Persist the change immediately
        }

        roomData = readRoomData();

        let clickHeroArray = [];
        for (const playerObj of roomData[roomName].player) {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            clickHeroArray.push(playerInfo.clickHero);
        }

        console.log('Hero selections:', heroSelects);

        // emit in room
        // io.to(roomName).emit('HERO_SELECTED', {
        //     socketId: socket.id,
        //     heroIndex: heroIndex,
        // });
        io.emit('HERO_SELECTED', {
            "clickHeroArray": clickHeroArray,
        });
    })

    socket.on('LOCK_HERO', (heroIndex) => {
        let roomData = readRoomData();

        console.log('Yêu cầu khóa hero từ client:', socket.id, 'Hero Index:', heroIndex);
        let roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        // Update the lockedHero value in roomData and persist to file
        const playerObjIndex = roomData[roomName].player.findIndex(obj => Object.keys(obj)[0] === socket.id);
        if (playerObjIndex !== -1) {
            roomData[roomName].player[playerObjIndex][socket.id].lockedHero = heroIndex;
            writeRoomData(roomData); // Persist the change immediately
        }
        

        roomData = readRoomData();
        // let clickHeroArray = []
        let lockedHeroArray = [];
        for (const playerObj of roomData[roomName].player) {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            // clickHeroArray.push(playerInfo.clickHero);
            lockedHeroArray.push(playerInfo.lockedHero);
        }

        console.log('Locked heroes:', lockedHeroes);


        io.emit('HERO_LOCKED', {
            "lockedHeroArray": lockedHeroArray,
        });
    })

    socket.on('GET_LOCKED_HERO_INDEX', () => {
        let roomData = readRoomData();
        let roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let lockedHeroArray = [];
        for (const playerObj of roomData[roomName].player) {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            // clickHeroArray.push(playerInfo.clickHero);
            lockedHeroArray.push(playerInfo.lockedHero);
        }

        console.log('Locked heroes:', lockedHeroArray);
        socket.emit('LOCKED_HERO_INDEX', {
            "lockedHeroArray": lockedHeroArray,
        });
        
    })

    socket.on('PLAY_GAME', () => {
        console.log('Yêu cầu bắt đầu trò chơi từ client:', socket.id);
        let roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        // Gửi sự kiện bắt đầu game cho tất cả client trong phòng
        io.to(roomName).emit('GAME_STARTED');
    })
    // =================== các xử lý tất cả client ===================

    // broadcast hero selection to all clients
    socket.on('HERO_SELECTED', (data) => {
        console.log('Hero selected by client:', data.socketId, 'Hero Index:', data.heroIndex);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete heroSelects[socket.id]; // Remove the hero selection for the disconnected client
    });

    // function getRoomNameBySocketId(socketId) {
    //     const roomData = readRoomData();
    //     for (const roomName in roomData) {
    //         // if (roomData[roomName].some(playerObj => Object.keys(playerObj)[0] === socketId)) {
    //         //     return roomName;
    //         // }
    //         if (roomData[roomName].find(playerObj => Object.keys(playerObj)[0] === socketId)) {
    //             return roomName;
    //         }
    //     }
    //     return null;
    // }
    function getRoomNameBySocketId(socketId) {
        const roomData = readRoomData();
        for (const roomName in roomData) {
            // if (roomData[roomName].some(playerObj => Object.keys(playerObj)[0] === socketId)) {
            //     return roomName;
            // }
            if (roomData[roomName].player.some(playerObj => Object.keys(playerObj)[0] === socketId)) {
                return roomName;
            }
        }
        return null;
    }
}

module.exports = selectHeroEvents;