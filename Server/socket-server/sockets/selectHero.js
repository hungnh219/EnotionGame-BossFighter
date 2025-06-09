
const logicHandler = require('../handler/logicHandler');

function selectHeroEvents(io, socket) {
    // =================== select hero logic ===================   
    socket.on('SELECT_HERO', (heroIndex) => {
        let roomData = logicHandler.common.readRoomData();
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        const playerObjIndexLocked = roomData[roomName].player.findIndex(obj => obj[socket.id] && obj[socket.id].lockedHero !== null);
        if (playerObjIndexLocked !== -1) {
            const playerInfo = roomData[roomName][playerObjIndexLocked][socket.id];
            if (playerInfo.lockedHero !== null) {
                console.log(`Player ${socket.id} đã khóa hero, không thể chọn lại.`);
                return;
            }
        }

        const playerObjIndex = roomData[roomName].player.findIndex(obj => Object.keys(obj)[0] === socket.id);
        if (playerObjIndex !== -1) {
            roomData[roomName].player[playerObjIndex][socket.id].clickHero = heroIndex;
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
            // const playerInfo = playerObj[playerId];

            let heroData = logicHandler.common.getCharacterData(playerObj[playerId].lockedHero);
            if (!heroData) {
                console.error('Không tìm thấy dữ liệu hero cho lockedHero:', playerObj[playerId].lockedHero);
                return;
            }

            const playerInfo = {
                "lockedHero": playerObj[playerId].lockedHero,
                "id": heroData.id,
                "maxHp": heroData.maxHp,
                "name": heroData.name,
                "attackDamage": heroData.attackDamage,
                "attackRange": heroData.attackRange,
            }
            // clickHeroArray.push(playerInfo.clickHero);
            lockedHeroArray.push(playerInfo);
        }

        socket.emit('LOCKED_HERO_INDEX', {
            "lockedHeroArray": lockedHeroArray,
        });
        
    })

    socket.on('PLAY_GAME', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName].gameState) {
            roomData[roomName].gameState = {
                "status": "STARTED",
                "turn": 'player',
                "currentPlayer": null,
                "walkableGridMap": [],
                "currentMapIndex": 0,
            };
            logicHandler.common.writeRoomData(roomData);
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