const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
// const roomRoutes = require('./routes/roomRoutes.js');
const configureSocket = require('./config/socket-config.js');



const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;
app.use(express.json());
// app.use('/', roomRoutes);

configureSocket(io);

// const roomService = require('./services/roomService.js');
// roomService.setIO(io);

// mapService.setIO(io);
// playerService.setIO(io);

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
