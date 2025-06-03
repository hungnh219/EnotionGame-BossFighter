const rooms = {};

function roomEvents(io, socket) {
    console.log('Có client kết nối:', socket.id);

    socket.on('createRoom', (roomName) => {
        if (rooms[roomName]) {
            socket.emit('error', `Phòng ${roomName} đã tồn tại!`);
            return;
        }

        rooms[roomName] = {
            host: socket.id,
            members: [socket.id],
            playerInfos: {}
        };

        // socket.join(roomName);
        console.log(`Phòng ${roomName} được tạo bởi ${socket.id}`);
        updateRoomInfo();
    });

    socket.on('joinRoom', (data) => {
        if (!rooms[data.roomName]) {
            return;
        }

        rooms[data.roomName].members.push(socket.id);
        updateRoomInfo();
    });

    socket.on('leaveRoom', (roomName) => {
        if (!rooms[roomName]) {

            socket.emit('error', `Bạn không ở trong phòng ${roomName}`);
            return;
        }
        const room = rooms[roomName];
        room.members = room.members.filter((member) => member !== socket.id);
        delete room.playerInfos[socket.id];
        console.log(`Client ${socket.id} đã rời khỏi phòng ${roomName}`);
        if (room.members.length === 0) {
            delete rooms[roomName];
            console.log(`Phòng ${roomName} đã bị xóa.`);
        }
        else if (room.host === socket.id) {
            room.host = room.members[0];
            io.to(roomName).emit('message', `Host mới của phòng ${roomName} là ${room.host}`);
        }
        socket.leave(roomName);
        updateRoomInfo();
    });

    socket.on('disconnect', () => {
        console.log('Client ngắt kết nối:', socket.id);

        for (const roomName in rooms) {
            const room = rooms[roomName];
            room.members = room.members.filter((member) => member !== socket.id);
            delete room.playerInfos[socket.id];

            if (room.members.length === 0) {
                delete rooms[roomName];
                console.log(`Phòng ${roomName} đã bị xóa.`);
            } else if (room.host === socket.id) {
                room.host = room.members[0];
                io.to(roomName).emit('message', `Host mới của phòng ${roomName} là ${room.host}`);
            }
        }
        updateRoomInfo();
    });

    function updateRoomInfo() {
        const roomData = Object.keys(rooms).map((roomName) => ({
            roomName: roomName,
            memberCount: rooms[roomName].members.length,
            players: Object.values(rooms[roomName].playerInfos)
        }));

        io.emit('roomInfo', {
            totalRooms: roomData.length,
            rooms: roomData,
        });

        // console.log('Tong cong dang co ', totalRooms, 'Rooms')
        // rooms.forEach((item, index)=>{
        //     console.log("Player "+ index + `${rooms[index].players}`)
        // })
    }
}

module.exports = roomEvents;