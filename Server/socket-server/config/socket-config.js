// const registerSocketEvents = require("../sockets");
// import registerSocketEvents from "../sockets/index.js";
const registerSocketEvents = require("../sockets");

function configureSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client kết nối:", socket.id);
    registerSocketEvents(io, socket);
  });
};

module.exports = configureSocket;

