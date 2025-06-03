// import mapEvents from "./map";
const mapEvents = require('./map');
const selectHeroEvents = require('./selectHero');
const roomEvents = require('./room')

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
    selectHeroEvents(io, socket);
    roomEvents(io, socket);
}

module.exports = registerSocketEvents;