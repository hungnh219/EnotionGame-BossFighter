const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/roomData.json');
function roomEvents(io, socket) {
    console.log('Có client kết nối:', socket.id);

    socket.on('createRoom', (roomName) => {
        let roomData = {};

        // Đọc dữ liệu từ file
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE);
            try {
                roomData = JSON.parse(rawData);
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
            }
        }
        console.log('roomName', roomName)
        if (roomName in roomData) {
            socket.emit('createRoomResult', {
                success: false,
                message: `Phòng ${roomName} đã tồn tại!`
            });
            return;
        }

        roomData[roomName] = {
            [socket.id]: {
                "name": 'Unknown'
            }
        }

        console.log('roomData', roomData)

        socket.join(roomName)

        // Ghi lại dữ liệu vào file
        fs.writeFileSync(DATA_FILE, JSON.stringify(roomData, null, 2), 'utf-8');

        socket.emit('createRoomResult', {
            success: true,
            roomName: roomName
        });

        // socket.join(roomName);
        // console.log(Phòng ${roomName} được tạo bởi ${socket.id});
        // io.to(roomName).emit('roomCreated', Phòng ${roomName} đã được tạo bởi ${socket.id});
        updateRoomInfo(roomData, socket);
    });

    socket.on('joinRoom', (roomName) => {
        let roomData = {};

        // Đọc dữ liệu từ file
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE);
            try {
                roomData = JSON.parse(rawData);
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                socket.emit('joinRoomResult', { success: false, message: 'Lỗi dữ liệu phòng.' });
                return;
            }
        }

        if (!(roomName in roomData)) {
            socket.emit('joinRoomResult', { success: false, message: `Phòng "${roomName}" không tồn tại. ` });
            return;
        }

        const roomObject = Object.keys(roomData[roomName]);

        if (roomObject.length >= 4) {
            socket.emit('joinRoomResult', { success: false, message: `Phòng "${roomName}" đã đầy. ` });
            return;
        }

        roomData[roomName][socket.id] = {
            name: 'Unknown'
        };

        // Ghi lại dữ liệu mới vào file
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(roomData, null, 2), 'utf-8');
        } catch (err) {
            console.error("Không thể ghi file:", err);
            socket.emit('joinRoomResult', { success: false, message: 'Lỗi ghi dữ liệu phòng.' });
            return;
        }

        socket.join(roomName);

        socket.emit('joinRoomResult', { success: true, message: 'Vào phòng thành công' });

        updateRoomInfo(roomData, socket)

    });

    socket.on('disconnect', () => {
        console.log('Client ngắt kết nối:', socket.id);

        let roomData = {};

        // Đọc file JSON
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE);
            try {
                roomData = JSON.parse(rawData);
            } catch (err) {
                console.error("Lỗi khi parse file JSON:", err);
                return;
            }
        }

        for (const roomName in roomData) {
            if (roomData[roomName][socket.id]) {
                delete roomData[roomName][socket.id];
                console.log(`Player ${socket.id} đã rời khỏi phòng ${roomName}`);

                if (Object.keys(roomData[roomName]).length === 0) {
                    delete roomData[roomName];
                    console.log(`Room ${roomName} đã bị xóa vì không còn người.`);
                }
            }
        }

        // Ghi lại file JSON sau khi cập nhật
        fs.writeFileSync(DATA_FILE, JSON.stringify(roomData, null, 2), 'utf-8');

        updateRoomInfo(roomData, socket);
    });

    function updateRoomInfo(roomData, socket) {
        console.log('fasdfasdfadsfads', roomData)
        const rooms = Object.keys(roomData).map((roomName) => ({
            roomName,
            memberCount: Object.keys(roomData[roomName]).length,
            players: Object.values(roomData[roomName])
        }));
        console.log(rooms, 'romssssss')

        socket.emit('roomInfo', {
            totalRooms: rooms.length,
            rooms
        });
    }
}

module.exports = roomEvents;