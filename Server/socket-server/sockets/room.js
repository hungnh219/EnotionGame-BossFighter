const fs = require('fs');
const path = require('path');
const { start } = require('repl');

const DATA_FILE = path.join(__dirname, '../data/roomData.json');

let startGameData = {}

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

function roomEvents(io, socket) {
    console.log('Có client kết nối:', socket.id);

    socket.on('createRoom', (roomName) => {
        let roomData = readRoomData();

        console.log('roomName', roomName);
        if (roomName in roomData) {
            socket.emit('createRoomResult', {
                success: false,
                message: `Phòng ${roomName} đã tồn tại!`
            });
            return;
        }

        roomData[roomName] = {
            player:[]
        };

        roomData[roomName].player.push({
            [socket.id]: {
                "name": 'Unknown',
                "clickHero": null,
                "lockedHero": null,
                "order": roomData[roomName].player.length,
                "host": true
            }
        });

        console.log('roomData', roomData);

        socket.join(roomName);

        writeRoomData(roomData);
        socket.emit('createRoomResult', {
            success: true,
            roomName: roomName
        });

        const roomInfo = updateRoomInfo(roomData);
        io.emit('roomInfo', roomInfo);
    });

    socket.on('joinRoom', (roomName) => {
        let roomData = readRoomData();

        if (!(roomName in roomData)) {
            socket.emit('joinRoomResult', { success: false, message: `Phòng "${roomName}" không tồn tại. ` });
            return;
        }

        const currentRoomPlayers = roomData[roomName].player;

        const playerExists = currentRoomPlayers.some(playerObj => Object.keys(playerObj)[0] === socket.id);
        if (playerExists) {
            socket.emit('joinRoomResult', { success: false, message: `Bạn đã ở trong phòng "${roomName}" rồi.` });
            return;
        }

        if (currentRoomPlayers.length >= 4) {
            socket.emit('joinRoomResult', { success: false, message: `Phòng "${roomName}" đã đầy. ` });
            return;
        }
     
        currentRoomPlayers.push({
            [socket.id]: {
                "name": 'Unknown',
                "clickHero": null,
                "lockedHero": null,
                "order":currentRoomPlayers.length,
                "host": false
            }
        });

        writeRoomData(roomData);

        socket.join(roomName);
        socket.emit('joinRoomResult', { success: true, message: 'Vào phòng thành công' });

        const roomInfo = updateRoomInfo(roomData);
        io.emit('roomInfo', roomInfo);
    });

    socket.on('leaveRoom', (roomName) => {
        let roomData = readRoomData();
    
        if (!(roomName in roomData)) {
            socket.emit('leaveRoomResult', { success: false, message: `Phòng "${roomName}" không tồn tại.` });
            return;
        }
    
        const currentRoomPlayers = roomData[roomName].player;
    
        const playerIndex = currentRoomPlayers.findIndex(playerObj => Object.keys(playerObj)[0] === socket.id);
        if (playerIndex === -1) {
            socket.emit('leaveRoomResult', { success: false, message: `Bạn không có trong phòng "${roomName}".` });
            return;
        }
    
        currentRoomPlayers.splice(playerIndex, 1);
    
        writeRoomData(roomData);
    
        socket.leave(roomName);
        socket.emit('leaveRoomResult', { success: true, message: `Bạn đã rời phòng "${roomName}" thành công.` });
    
        const roomInfo = updateRoomInfo(roomData);
        io.emit('roomInfo', roomInfo);
    });
    

    socket.on('disconnect', () => {
        console.log('Client ngắt kết nối:', socket.id);

        let roomData = readRoomData();
        let roomChanged = false;

        for (const roomName in roomData) {
            let roomPlayers = roomData[roomName].player;
            const initialLength = roomPlayers.length;

            roomData[roomName].player = roomPlayers.filter(playerObj => Object.keys(playerObj)[0] !== socket.id);

            if (roomData[roomName].player.length < initialLength) {
                roomChanged = true;
                console.log(`Player ${socket.id} đã rời khỏi phòng ${roomName}`);

                if (roomData[roomName].player.length === 0) {
                    delete roomData[roomName];
                    console.log(`Room ${roomName} đã bị xóa vì không còn người.`);
                }
            }
        }

        if (roomChanged) {
            writeRoomData(roomData);
            const roomInfo = updateRoomInfo(roomData);
            io.emit('roomInfo', roomInfo);
        }
    });

    socket.on('requestRoomInfo', () => {
        const roomData = readRoomData();
        const roomInfo = updateRoomInfo(roomData);
        socket.emit('roomInfo', roomInfo);
    });

    socket.on('GAME_START', () => {
        console.warn('Nhận sự kiện GAME_START từ socket:', socket.id);
        const roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error(`Không tìm thấy phòng cho socket ID: ${socket.id}`);
            return;
        }

        const roomData = readRoomData();
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
                    order: playerObj[playerId].order
                };
            })
        }

        console.log('Gửi dữ liệu bắt đầu trò chơi:', gameStartData);
        // io.emit('GAME_START', gameStartData);
        // emit to clients in room name
        io.to(roomName).emit('GAME_START_DATA', gameStartData);
    })

    socket.on('GET_GAME_START_DATA', () => {
        const roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error(`Không tìm thấy phòng cho socket ID: ${socket.id}`);
            return;
        }

        const roomData = readRoomData();
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
                    order: playerObj[playerId].order
                };
            })
        }
        io.to(roomName).emit('GAME_START_DATA_SELECT', gameStartData);
    })

    function updateRoomInfo(roomData) {
        const rooms = Object.keys(roomData).map((roomName) => ({
            roomName,
            memberCount: roomData[roomName].player.length,
            players: roomData[roomName].player
        }));

        const result = {
            totalRooms: rooms.length,
            rooms
        };

        console.log("Phát sự kiện roomInfo với dữ liệu: ", result);
        return result;
    }

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

module.exports = roomEvents;