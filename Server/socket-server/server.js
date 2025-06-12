const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const configureSocket = require('./config/socket-config.js');
const cors = require('cors');
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDAkyc8uXCZGzcBEG7D6BO8XxeS-VkwqpY",
  authDomain: "my-game-project-321a1.firebaseapp.com",
  projectId: "my-game-project-321a1",
  storageBucket: "my-game-project-321a1.appspot.com",
  messagingSenderId: "729080652897",
  appId: "1:729080652897:web:fd25d889e0109a5cffb620"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;
app.use(cors());
app.use(express.json({ limit: '10mb' }));

configureSocket(io, db);

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});