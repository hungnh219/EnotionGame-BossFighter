const mapEvents = require('./map');
const roomEvents = require('./room')
const selectHeroEvents = require('./selectHero');
const gameEvents = require('./game');

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
    roomEvents(io, socket);
    selectHeroEvents(io, socket);
    gameEvents(io, socket);
}

module.exports = registerSocketEvents;