// import mapEvents from "./map";
const mapEvents = require('./map');
const roomEvents = require('./room')

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
    roomEvents(io, socket);
}

module.exports = registerSocketEvents;