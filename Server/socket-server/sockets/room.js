const logicHandler = require('../handler/logicHandler');
const typeHandler = require('../handler/commonHandler')

function roomEvents(io, socket) {
    console.log('Có client kết nối:', socket.id);

    socket.on('SEND_MESSAGE', (roomName, message) => {
        let roomData = logicHandler.common.readRoomData();
        console.log(`Tin nhắn từ ${socket.id} tại phòng ${roomName}: ${message}`);
        const playerId = socket.id
        const room = roomData[roomName];
        const player = room.player.find(playerObj => Object.keys(playerObj)[0] === playerId);
        const playerName = player[playerId].name;
        io.to(roomName).emit('RECEIVED_MESSAGE', {
            success: true,
            sender: playerId,
            senderName: playerName,
            text: message,
            message: `Gửi tin nhắn thành công`
        });
    });


    socket.on('CHECK_ROOM_EXIST', (roomName) => {
        let roomData = logicHandler.common.readRoomData();
        if (roomName in roomData) {
            socket.emit('CHECK_ROOM_EXIST_RESULT', {
                success: false,
                type: typeHandler.TYPE.WARNING,
                message: `Phòng ${roomName} đã tồn tại!`
            });
            return;
        }
        socket.emit('CHECK_ROOM_EXIST_RESULT', {
            success: true,
            type: typeHandler.TYPE.SUCCESS,
            message: `Chưa có phòng ${roomName}, có thể tạo`
        });
    })

    socket.on('CHECK_ROOM_FULL', (roomName) => {
        let roomData = logicHandler.common.readRoomData();
        const currentRoomPlayers = roomData[roomName].player.length;
        const maxRoomPlayers = roomData[roomName].maxPlayer
        const statusRoom = roomData[roomName].status
        if (currentRoomPlayers >= maxRoomPlayers) {
            socket.emit('CHECK_ROOM_FULL_RESULT', { success: false, type: typeHandler.TYPE.WARNING ,message: `Phòng "${roomName}" đã đầy. ` });
            return;
        }
        if (statusRoom != 'waiting'){
            socket.emit('CHECK_ROOM_FULL_RESULT', {success: false, type: typeHandler.TYPE.WARNING ,message: `Phòng "${roomName}" đang trong game. ` })
            return;
        }
        socket.emit('CHECK_ROOM_FULL_RESULT', {
            success: true,
            type: typeHandler.TYPE.SUCCESS,
            message: `Phòng ${roomName} còn slot, có thể join`
        });
    })

    socket.on('CREATE_ROOM', (roomName, amoutPlayer, playerName) => {
        let roomData = logicHandler.common.readRoomData();

        roomData[roomName] = {
            player: [],
            maxPlayer: amoutPlayer,
            status: 'waiting'
        };

        roomData[roomName].player.push({
            [socket.id]: {
                "name": playerName,
                "clickHero": null,
                "lockedHero": null,
                "order": roomData[roomName].player.length,
                "host": true
            }
        });

        socket.join(roomName);

        logicHandler.common.writeRoomData(roomData);
        socket.emit('CREATE_ROOM_RESULT', {
            success: true,
            roomName: roomName
        });

        const roomInfo = updateRoomInfo(roomData);
        io.emit('ROOM_INFO', roomInfo);
    });

    socket.on('JOIN_ROOM', (roomName, playerName) => {
        let roomData = logicHandler.common.readRoomData();

        if (!(roomName in roomData)) {
            socket.emit('JOIN_ROOM_RESULT', { success: false, type: typeHandler.TYPE.ERROR ,message: `Phòng "${roomName}" không tồn tại. ` });
            return;
        }

        const currentRoomPlayers = roomData[roomName].player;
        const maxRoomPlayers = roomData[roomName].maxPlayer

        const playerExists = currentRoomPlayers.some(playerObj => Object.keys(playerObj)[0] === socket.id);
        if (playerExists) {
            socket.emit('JOIN_ROOM_RESULT', { success: false, type: typeHandler.TYPE.WARNING ,message: `Bạn đã ở trong phòng "${roomName}" rồi.` });
            return;
        }

        if (currentRoomPlayers.length >= maxRoomPlayers) {
            socket.emit('JOIN_ROOM_RESULT', { success: false, type: typeHandler.TYPE.WARNING ,message: `Phòng "${roomName}" đã đầy. ` });
            return;
        }

        currentRoomPlayers.push({
            [socket.id]: {
                "name": playerName,
                "clickHero": null,
                "lockedHero": null,
                "order": currentRoomPlayers.length,
                "host": false
            }
        });

        logicHandler.common.writeRoomData(roomData);

        socket.join(roomName);
        socket.emit('JOIN_ROOM_RESULT', { success: true, type: typeHandler.TYPE.SUCCESS ,message: 'Vào phòng thành công' });

        const roomInfo = updateRoomInfo(roomData);
        io.emit('ROOM_INFO', roomInfo);
    });

    socket.on('LEAVE_ROOM', (roomName) => {
        let roomData = logicHandler.common.readRoomData();

        if (!(roomName in roomData)) {
            socket.emit('LEAVE_ROOM_RESULT', { success: false, type: typeHandler.TYPE.WARNING ,message: `Phòng "${roomName}" không tồn tại.` });
            return;
        }

        const currentRoom = roomData[roomName];
        const currentRoomPlayers = currentRoom.player;

        const playerIndex = currentRoomPlayers.findIndex(playerObj => Object.keys(playerObj)[0] === socket.id);

        if (playerIndex === -1) {
            socket.emit('LEAVE_ROOM_RESULT', { success: false, message: `Bạn không có trong phòng "${roomName}".` });
            return;
        }

        const leavingPlayerSocketId = socket.id;
        const leavingPlayerObj = currentRoomPlayers[playerIndex];
        const wasHost = leavingPlayerObj[leavingPlayerSocketId] ? leavingPlayerObj[leavingPlayerSocketId].host : false;

        currentRoomPlayers.splice(playerIndex, 1);
        console.log(`Player ${leavingPlayerSocketId} đã rời khỏi phòng ${roomName} (thông qua leaveRoom).`);

        let roomDeleted = false;

        if (wasHost && currentRoomPlayers.length > 0) {
            const firstPlayerObj = currentRoomPlayers[0];
            const firstSocketId = Object.keys(firstPlayerObj)[0];
            firstPlayerObj[firstSocketId].host = true;
            console.log(`Host mới của phòng ${roomName} là: ${firstPlayerObj[firstSocketId].name} (do host cũ rời phòng).`);
            // io.to(roomName).emit('newHost', { newHostName: firstPlayerObj[firstSocketId].name });
            // io.to(firstSocketId).emit('youAreTheNewHost', { roomName: roomName });
        }

        if (currentRoomPlayers.length === 0) {
            delete roomData[roomName];
            console.log(`Phòng "${roomName}" đã bị xóa vì không còn người chơi .`);
        }

        logicHandler.common.writeRoomData(roomData);

        socket.leave(roomName);
        socket.emit('LEAVE_ROOM_RESULT', { success: true, type: typeHandler.TYPE.SUCCESS ,message: `Bạn đã rời phòng "${roomName}" thành công.` });

        const roomInfo = updateRoomInfo(roomData);
        io.emit('ROOM_INFO', roomInfo);
    });


    socket.on('disconnect', () => {
        console.log('Client ngắt kết nối:', socket.id);

        let roomData = logicHandler.common.readRoomData();
        let roomChanged = false;

        for (const roomName in roomData) {
            let roomPlayers = roomData[roomName].player;
            const initialLength = roomPlayers.length;

            const leavingPlayer = roomPlayers.find(playerObj => Object.keys(playerObj)[0] === socket.id);
            const wasHost = leavingPlayer ? leavingPlayer[socket.id].host : false;

            roomData[roomName].player = roomPlayers.filter(
                playerObj => Object.keys(playerObj)[0] !== socket.id
            );

            if (roomData[roomName].player.length < initialLength) {
                roomChanged = true;
                console.log(`Player ${socket.id} đã rời khỏi phòng ${roomName}`);

                if (wasHost && roomData[roomName].player.length > 0) {
                    const firstPlayerObj = roomData[roomName].player[0];
                    const firstSocketId = Object.keys(firstPlayerObj)[0];
                    firstPlayerObj[firstSocketId].host = true;
                    console.log(`Host mới của phòng ${roomName} là: ${firstPlayerObj[firstSocketId].name}`);
                }

                if (roomData[roomName].player.length === 0) {
                    delete roomData[roomName];
                    console.log(`Room ${roomName} đã bị xóa vì không còn người.`);
                }
            }
        }

        if (roomChanged) {
            logicHandler.common.writeRoomData(roomData);
            const roomInfo = updateRoomInfo(roomData);
            io.emit('ROOM_INFO', roomInfo);
        }
    });

    socket.on('REQUEST_ROOM_INFO', () => {
        let roomData = logicHandler.common.readRoomData();
        const roomInfo = updateRoomInfo(roomData);
        socket.emit('ROOM_INFO', roomInfo);
    });

    socket.on('GAME_START', (callback) => {
        console.warn('Nhận sự kiện GAME_START từ socket:', socket.id);
        const roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error(`Không tìm thấy phòng cho socket ID: ${socket.id}`);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        const players = roomData[roomName].player;
        const maxPlayer = roomData[roomName].maxPlayer
        if(players.length != maxPlayer){
            console.error(`So luong nguoi choi chua du : ${players.length}/${maxPlayer}`);
            if (typeof callback === 'function') {
                callback({ success: false, message: `Số lượng người chơi chưa đủ: ${players.length}/${maxPlayer}` });
            }
            return;
        }
        roomData[roomName].status = 'playing'

        const gameStartData = {
            roomName: roomName,
            players: players.map(playerObj => {
                const playerId = Object.keys(playerObj)[0];
                return {
                    id: playerId,
                    name: playerObj[playerId].name || 'Unknown',
                    clickHero: playerObj[playerId].clickHero,
                    lockedHero: playerObj[playerId].lockedHero,
                    order: playerObj[playerId].order
                };
            })
        }

        console.log('Gửi dữ liệu bắt đầu trò chơi:', gameStartData);
        // io.emit('GAME_START', gameStartData);
        // emit to clients in room name
        io.to(roomName).emit('GAME_START_DATA', gameStartData);
        logicHandler.common.writeRoomData(roomData);
        const roomInfo = updateRoomInfo(roomData);
        io.emit('ROOM_INFO', roomInfo);

        if (typeof callback === 'function') {
            callback({ success: true, message: "Trò chơi đã được bắt đầu!" });
        }
    })

    socket.on('GET_GAME_START_DATA', () => {
        const roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error(`Không tìm thấy phòng cho socket ID: ${socket.id}`);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        const players = roomData[roomName].player;

        const gameStartData = {
            roomName: roomName,
            players: players.map(playerObj => {
                const playerId = Object.keys(playerObj)[0];
                return {
                    id: playerId,
                    name: playerObj[playerId].name || 'Unknown',
                    clickHero: playerObj[playerId].clickHero,
                    lockedHero: playerObj[playerId].lockedHero,
                    order: playerObj[playerId].order,
                    host: playerObj[playerId].host || false
                };
            })
        }
        io.to(roomName).emit('GAME_START_DATA_SELECT', gameStartData);
    })

    function updateRoomInfo(roomData) {
        const rooms = Object.keys(roomData).map((roomName) => ({
            roomName,
            memberCount: roomData[roomName].player.length,
            players: roomData[roomName].player,
            maxPlayer: roomData[roomName].maxPlayer,
            status: roomData[roomName].status
        }));

        const result = {
            totalRooms: rooms.length,
            rooms
        };

        console.log("Phát sự kiện roomInfo với dữ liệu: ", result);
        return result;
    }

    function getRoomNameBySocketId(socketId) {
        let roomData = logicHandler.common.readRoomData();
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

module.exports = roomEvents;