// const registerSocketEvents = require("../sockets");
// import registerSocketEvents from "../sockets/index.js";
const registerSocketEvents = require("../sockets");

function configureSocket(io, db, admin) {
  io.on("connection", (socket) => {
    console.log("Client kết nối:", socket.id);
    registerSocketEvents(io, socket, db, admin);
  });
};

module.exports = configureSocket;

