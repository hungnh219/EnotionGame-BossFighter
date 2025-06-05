
const logicHandler = require('../handler/logicHandler');

function selectHeroEvents(io, socket) {
    // =================== select hero logic ===================   
    socket.on('SELECT_HERO', (heroIndex) => {
        // let roomData = readRoomData();
        let roomData = logicHandler.common.readRoomData();
        console.log('Yêu cầu chọn hero từ client:', socket.id, 'Hero Index:', heroIndex);
        // let roomName = getRoomNameBySocketId(socket.id);
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        console.log('Room name:', roomName);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        // change value of click hero into hero index
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
            roomData[roomName].player[playerObjIndex][socket.id].clickHero = heroIndex;
            // writeRoomData(roomData); // Persist the change immediately
            logicHandler.common.writeRoomData(roomData);
        }

        roomData = logicHandler.common.readRoomData();

        let clickHeroArray = [];
        for (const playerObj of roomData[roomName].player) {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            clickHeroArray.push(playerInfo.clickHero);
        }

        io.emit('HERO_SELECTED', {
            "clickHeroArray": clickHeroArray,
        });
    })

    socket.on('LOCK_HERO', (heroIndex) => {
        let roomData = logicHandler.common.readRoomData();

        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        // Update the lockedHero value in roomData and persist to file
        const playerObjIndex = roomData[roomName].player.findIndex(obj => Object.keys(obj)[0] === socket.id);
        if (playerObjIndex !== -1) {
            roomData[roomName].player[playerObjIndex][socket.id].lockedHero = heroIndex;
            logicHandler.common.writeRoomData(roomData);            
        }
        

        roomData = logicHandler.common.readRoomData();
        let lockedHeroArray = [];
        for (const playerObj of roomData[roomName].player) {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            lockedHeroArray.push(playerInfo.lockedHero);
        }

        io.emit('HERO_LOCKED', {
            "lockedHeroArray": lockedHeroArray,
        });
    })

    socket.on('GET_LOCKED_HERO_INDEX', () => {
        let roomData = logicHandler.common.readRoomData();
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
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

        socket.emit('LOCKED_HERO_INDEX', {
            "lockedHeroArray": lockedHeroArray,
        });
        
    })

    socket.on('PLAY_GAME', () => {
        // let roomName = getRoomNameBySocketId(socket.id);
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        // add gameState into roomData
        // let roomData = readRoomData();
        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName].gameState) {
            roomData[roomName].gameState = {
                "status": "STARTED",
                "turn": 'player',
                "currentPlayer": null,
                // "mapData": null,
                // "heroData": null,
                "walkableGridMap": [],
            };
            logicHandler.common.writeRoomData(roomData);
            // console.log()
        }

        io.to(roomName).emit('GAME_STARTED');
    })
    // =================== các xử lý tất cả client ===================

    // broadcast hero selection to all clients
    socket.on('HERO_SELECTED', (data) => {
        console.log('Hero selected by client:', data.socketId, 'Hero Index:', data.heroIndex);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
    });
}

module.exports = selectHeroEvents;