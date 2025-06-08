const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
// const roomRoutes = require('./routes/roomRoutes.js');
const configureSocket = require('./config/socket-config.js');

const admin = require('firebase-admin');
const cors = require('cors');

require('dotenv').config()

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- Khởi tạo Firebase Admin SDK ---
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const PORT = 3000;
app.use(cors());
app.use(express.json({ limit: '10mb' }));

configureSocket(io, db, admin);

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
