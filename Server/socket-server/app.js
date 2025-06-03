const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;

app.use(express.json());
app.use('/', roomRoutes);

const roomService = require('./services/roomService.js');
roomService.setIO(io);

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
