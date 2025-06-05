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

        logicHandler.game.updateWalkableGridMap(walkableGridMap, data.x, data.y, data.isWalkable);
        
        io.to(roomName).emit('WALKABLE_GRID_MAP_UPDATED', {
            walkableGridMap: walkableGridMap,
        });
    })
}

module.exports = gameEvents;