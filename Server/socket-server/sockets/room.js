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

        roomData[roomName] = [];
        roomData[roomName].push({
            [socket.id]: {
                "name": 'Unknown'
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

        const currentRoomPlayers = roomData[roomName];

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
                name: 'Unknown'
            }
        });

        writeRoomData(roomData);

        socket.join(roomName);
        socket.emit('joinRoomResult', { success: true, message: 'Vào phòng thành công' });

        const roomInfo = updateRoomInfo(roomData);
        io.emit('roomInfo', roomInfo);
    });

    socket.on('disconnect', () => {
        console.log('Client ngắt kết nối:', socket.id);

        let roomData = readRoomData();
        let roomChanged = false;

        for (const roomName in roomData) {
            let roomPlayers = roomData[roomName];
            const initialLength = roomPlayers.length;

            roomData[roomName] = roomPlayers.filter(playerObj => Object.keys(playerObj)[0] !== socket.id);

            if (roomData[roomName].length < initialLength) {
                roomChanged = true;
                console.log(`Player ${socket.id} đã rời khỏi phòng ${roomName}`);

                if (roomData[roomName].length === 0) {
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

    socket.on('GAME_START', (data) => {
        console.log('Yêu cầu bắt đầu trò chơi từ client:', socket.id, 'Dữ liệu:', data);

        const { roomName, players } = data;

        if (!roomName || !players || players.length === 0) {
            console.error('Dữ liệu không hợp lệ để bắt đầu trò chơi.');
            return;
        }

        startGameData[roomName] = {
            players: players,
            // playerId: socket.id
        };

        // Gửi sự kiện GAME_START đến tất cả người chơi trong phòng
        io.to(roomName).emit('START', {
            roomName,
            players
        });

        console.log(`Trò chơi đã bắt đầu trong phòng ${roomName} với người chơi:`, players);
    })

    socket.on('GET_START_GAME_DATA', () => {
        // console.log('Yêu cầu dữ liệu bắt đầu trò chơi từ client:', socket.id, 'Phòng:', roomName);

        const roomName = Object.keys(startGameData).find(name => startGameData[name].players.some(player => Object.keys(player)[0] === socket.id));

        if (startGameData[roomName]) {
            console.log('Dữ liệu bắt đầu trò chơi:', startGameData[roomName]);
            socket.emit('START_GAME_DATA', startGameData[roomName]);
        } else {
            console.error(`Không có dữ liệu bắt đầu trò chơi cho phòng ${roomName}`);
            socket.emit('START_GAME_DATA', null);
        }
    });

    function updateRoomInfo(roomData) {
        const rooms = Object.keys(roomData).map((roomName) => ({
            roomName,
            memberCount: roomData[roomName].length,
            players: roomData[roomName]
        }));

        const result = {
            totalRooms: rooms.length,
            rooms
        };

        console.log("Phát sự kiện roomInfo với dữ liệu: ", result);
        return result;
    }
}

module.exports = roomEvents;