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

function gameEvents(io, socket) {
    // socket.on('')
    socket.on('GET_PLAYER_ORDER', () => {
        const roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        const roomData = readRoomData();
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
        console.warn('Yêu cầu di chuyển đến ô mới từ client:', socket.id, 'Data:', data);
        const roomName = getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        console.warn('Yêu cầu di chuyển đến ô mới từ client:', socket.id, 'Data:', data);
        io.to(roomName).emit('LISTEN_MOVE_TO_NEW_TILE', 
            data
        );

    } )
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

module.exports = gameEvents;