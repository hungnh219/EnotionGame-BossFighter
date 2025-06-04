const mapEvents = require('./map');
const roomEvents = require('./room')
const selectHeroEvents = require('./selectHero');

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
    roomEvents(io, socket);
    selectHeroEvents(io, socket);
}

module.exports = registerSocketEvents;