// import mapEvents from "./map";
const mapEvents = require('./map');

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
}

module.exports = registerSocketEvents;