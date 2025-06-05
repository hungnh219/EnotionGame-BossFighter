const logicHandler = require('../handler/logicHandler');

function gameEvents(io, socket) {
    socket.on('GET_PLAYER_ORDER', () => {
        const roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        const playerId = socket.id;
        const player = roomData[roomName].player.find(playerObj => Object.keys(playerObj)[0] === playerId);

        if (!player) {
            console.error('Không tìm thấy người chơi với socket ID:', socket.id);
            return;
        }

        let order = player[playerId].order;

        console.log('Gửi thứ tự người chơi:', order);

        // io.to.emit('PLAYER_ORDER', order);
        io.to(roomName).emit('PLAYER_ORDER', {
            order: order
        });
    })

    socket.on('INITIALIZE_GAME', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        console.log('Yêu cầu khởi tạo game từ client:', socket.id);
        
        let roomData = logicHandler.common.readRoomData();

        // lấy dữ liệu id + order + lockedHero của người chơi 
        let playerData = logicHandler.game.getPlayerGameData(roomData, roomName);
        if (!playerData) {
            console.error('Không tìm thấy dữ liệu người chơi trong dữ liệu phòng:', roomName);
            return;
        }

        // tạo dữ liệu mảng heroes cho người chơi (thứ tự là theo order)
        let heroes = [];

        playerData.forEach(player => {
            let playerId = player.id;
            let order = player.order;
            let lockedHero = player.lockedHero;

            let heroData = logicHandler.common.getCharacterData(lockedHero);

            if (!heroData) {
            }

            heroes[order] = {
                id: playerId,
                order: order,
                lockedHero: lockedHero,
                // heroData: heroData
                hp: heroData.maxHp,
                maxHp: heroData.maxHp,
                attackDamage: heroData.attackDamage,
                attackRange: heroData.attackRange,

                status: "ALIVE",
                stats: {
                    totalDameDeal: 0,
                    totalDameTaken: 0,

                    totoalScore: 0,
                }
            };
        })


        // thêm dữ liệu heroes vào roomdata với key là heroes

        roomData[roomName].gameState.heroes = heroes;

        logicHandler.common.writeRoomData(roomData);
    })

    socket.on('GET_ATTACK_DAME', (data) => {
        console.log('get attack dame', data);

        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        let attackDamage = heroes[data.playerOrder].attackDamage;

        // io.to(roomName).emit('LISTEN_ATTACK', {
        //     attackDamage: attackDamage,
        // });
        socket.emit('RETURN_ATTACK_DAME', {
            attackDamage: attackDamage,
        });
    })

    socket.on('OTHER_PLAYER_ATTACK', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        console.log('other player attack', data);
        io.to(roomName).emit('LISTEN_ATTACK', {
            playerOrder: data.playerOrder,
            targetOrder: data.targetOrder,
            isBoss: data.isBoss,
        });
    })

    socket.on('MOVE_TO_NEW_TILE', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        console.warn('Yêu cầu di chuyển đến ô mới từ client:', socket.id, 'Data:', data);
        io.to(roomName).emit('LISTEN_MOVE_TO_NEW_TILE', 
            data
        );

    })

    socket.on('UPDATE_WALKABLE_GRID_MAP', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }   

        let roomData = logicHandler.common.readRoomData();

        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);


        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }
        logicHandler.game.updateWalkableGridMap(roomData, roomName, data.x, data.y, data.isWalkable);
        
        logicHandler.common.writeRoomData(roomData);

        io.to(roomName).emit('WALKABLE_GRID_MAP_UPDATED', {
            walkableGridMap: walkableGridMap,
        });
    })

    socket.on('GET_WALKABLE_GRID_MAP', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);

        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }

        io.to(roomName).emit('RETURN_WALKABLE_GRID_MAP', {
            walkableGridMap: walkableGridMap,
        });
    })

    socket.on('FIND_PATH', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);

        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }

        let start = data.start;
        let end = data.end;
        let maxStep = data.maxStep || 3;

        console.log('Yêu cầu tìm đường từ:', start, 'đến:', end, 'với bước tối đa:', maxStep);

        let path = logicHandler.game.findPath(start, end, walkableGridMap, maxStep);

        if (path) {
            console.log('Đường đi tìm thấy:', path);
        } else {
            console.warn('Không tìm thấy đường đi hợp lệ từ', start, 'đến', end);
        }

        io.to(roomName).emit('RETURN_PATH', {
            path: path,
        });
    })
}

module.exports = gameEvents;