// const fs = require('fs');
// const path = require('path');
// const DATA_FILE = path.join(__dirname, '../data/roomData.json');

let rooms = {};

function roomEvents(io, socket) {
    console.log('Có client kết nối:', socket.id);

    // socket.on('createRoom', (roomName) => {
    //     let roomData = {};

    //     // Đọc dữ liệu từ file
    //     if (fs.existsSync(DATA_FILE)) {
    //         const rawData = fs.readFileSync(DATA_FILE);
    //         try {
    //             roomData = JSON.parse(rawData);
    //         } catch (err) {
    //             console.error("Lỗi khi parse file JSON:", err);
    //         }
    //     }
    //     console.log('roomName', roomName)
    //     if (roomName in roomData) {
    //         socket.emit('createRoomResult', {
    //             success: false,
    //             message: `Phòng ${roomName} đã tồn tại!`
    //         });
    //         return;
    //     }

    //     roomData[roomName] = {
    //         [socket.id]: {
    //             "name": 'Unknown'
    //         }
    //     }

    //     console.log('roomData', roomData)

    //     socket.join(roomName)

    //     // Ghi lại dữ liệu vào file
    //     fs.writeFileSync(DATA_FILE, JSON.stringify(roomData, null, 2), 'utf-8');

    //     socket.emit('createRoomResult', {
    //         success: true,
    //         roomName: roomName
    //     });

    //     // socket.join(roomName);
    //     // console.log(Phòng ${roomName} được tạo bởi ${socket.id});
    //     // io.to(roomName).emit('roomCreated', Phòng ${roomName} đã được tạo bởi ${socket.id});
    //     updateRoomInfo(roomData, socket);
    // });

    // socket.on('joinRoom', (roomName) => {
    //     let roomData = {};

    //     // Đọc dữ liệu từ file
    //     if (fs.existsSync(DATA_FILE)) {
    //         const rawData = fs.readFileSync(DATA_FILE);
    //         try {
    //             roomData = JSON.parse(rawData);
    //         } catch (err) {
    //             console.error("Lỗi khi parse file JSON:", err);
    //             socket.emit('joinRoomResult', { success: false, message: 'Lỗi dữ liệu phòng.' });
    //             return;
    //         }
    //     }

    //     if (!(roomName in roomData)) {
    //         socket.emit('joinRoomResult', { success: false, message: `Phòng "${roomName}" không tồn tại. ` });
    //         return;
    //     }

    //     const roomObject = Object.keys(roomData[roomName]);

    //     if (roomObject.length >= 4) {
    //         socket.emit('joinRoomResult', { success: false, message: `Phòng "${roomName}" đã đầy. ` });
    //         return;
    //     }

    //     roomData[roomName][socket.id] = {
    //         name: 'Unknown'
    //     };

    //     // Ghi lại dữ liệu mới vào file
    //     try {
    //         fs.writeFileSync(DATA_FILE, JSON.stringify(roomData, null, 2), 'utf-8');
    //     } catch (err) {
    //         console.error("Không thể ghi file:", err);
    //         socket.emit('joinRoomResult', { success: false, message: 'Lỗi ghi dữ liệu phòng.' });
    //         return;
    //     }

    //     socket.join(roomName);

    //     socket.emit('joinRoomResult', { success: true, message: 'Vào phòng thành công' });

    //     updateRoomInfo(roomData, socket)

    // });

    // socket.on('disconnect', () => {
    //     console.log('Client ngắt kết nối:', socket.id);

    //     let roomData = {};

    //     // Đọc file JSON
    //     if (fs.existsSync(DATA_FILE)) {
    //         const rawData = fs.readFileSync(DATA_FILE);
    //         try {
    //             roomData = JSON.parse(rawData);
    //         } catch (err) {
    //             console.error("Lỗi khi parse file JSON:", err);
    //             return;
    //         }
    //     }

    //     for (const roomName in roomData) {
    //         if (roomData[roomName][socket.id]) {
    //             delete roomData[roomName][socket.id];
    //             console.log(`Player ${socket.id} đã rời khỏi phòng ${roomName}`);

    //             if (Object.keys(roomData[roomName]).length === 0) {
    //                 delete roomData[roomName];
    //                 console.log(`Room ${roomName} đã bị xóa vì không còn người.`);
    //             }
    //         }
    //     }

    //     // Ghi lại file JSON sau khi cập nhật
    //     fs.writeFileSync(DATA_FILE, JSON.stringify(roomData, null, 2), 'utf-8');

    //     updateRoomInfo(roomData, socket);
    // });

    // function updateRoomInfo(roomData, socket) {
    //     console.log('fasdfasdfadsfads', roomData)
    //     const rooms = Object.keys(roomData).map((roomName) => ({
    //         roomName,
    //         memberCount: Object.keys(roomData[roomName]).length,
    //         players: Object.values(roomData[roomName])
    //     }));
    //     console.log(rooms, 'romssssss')

    //     socket.emit('roomInfo', {
    //         totalRooms: rooms.length,
    //         rooms
    //     });
    // }

    socket.on('CREATE_ROOM', (data) => {
        // console.log('Yêu cầu tạo phòng từ client:', socket.id, 'Room Name:', data);
        if (rooms[data]) {
            return;
        }

        rooms[data] = {
            name: data,
            members: {
            },
        };

        socket.emit('CREATE_ROOM_SUCCESS', rooms);
        io.emit('UPDATE_ROOM_INFO', rooms);
    })

    socket.on('GET_ROOM', () => {
        console.log('Yêu cầu danh sách phòng từ client:', socket.id);
        const roomList = Object.values(rooms).map(room => ({
            name: room.name,
            members: room.members
        }));

        socket.emit('ROOM_LIST', {
            rooms: roomList
        });
    })

    socket.on('JOIN_ROOM', (roomName) => {
        console.log('Yêu cầu tham gia phòng từ client:', socket.id, 'Room Name:', roomName);
        if (!rooms[roomName]) {
            // socket.emit('JOIN_ROOM_ERROR', { message: 'Phòng không tồn tại.' });
            return;
        }

        const room = rooms[roomName];
        if (Object.keys(room.members).length >= 4) {
            return;
        }

        addPlayerToRoom(roomName, socket.id);

        socket.join(roomName);
        socket.emit('JOIN_ROOM_SUCCESS', room);
        io.emit('UPDATE_ROOM_INFO', rooms);
    });

    function addPlayerToRoom(roomName, playerId) {
        if (!rooms[roomName]) {
            return;
        }

        const room = rooms[roomName];
        if (Object.keys(room.members).length >= 4) {
            return;
        }

        room.members[playerId] = {
            name: 'Unknown',
            playerIndex: Object.keys(room.members).length, // Assign player index based on current members
        };
    }
}

module.exports = roomEvents;