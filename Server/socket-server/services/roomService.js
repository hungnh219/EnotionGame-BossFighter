const data = require('../data/players.json');

let io = null;
const rooms = {};

function setIO(socketIOInstance) {
  io = socketIOInstance;
  io.on('connection', (socket) => {
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

      socket.join(roomName);
      console.log(`Phòng ${roomName} được tạo bởi ${socket.id}`);
      io.to(roomName).emit('roomCreated', `Phòng ${roomName} đã được tạo bởi ${socket.id}`);
      updateRoomInfo();
    });

    socket.on('joinRoom', ({ roomName, playerKey }) => {
      if (!rooms[roomName]) {
        socket.emit('error', `Phòng ${roomName} không tồn tại!`);
        return;
      }

      rooms[roomName].members.push(socket.id);
      socket.join(roomName);

      if (data[playerKey]) {
        rooms[roomName].playerInfos[socket.id] = data[playerKey];
      } else {
        rooms[roomName].playerInfos[socket.id] = { name: "Unknown", age: 0 };
      }

      console.log(`Client ${socket.id} (player: ${playerKey}) đã vào ${roomName}`);
      io.to(roomName).emit('message', `User ${socket.id} (${rooms[roomName].playerInfos[socket.id].name}) đã tham gia ${roomName}`);
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
    }
  });
}

module.exports = {
  setIO,
};
