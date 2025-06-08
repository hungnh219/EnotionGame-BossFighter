const mapEvents = require('./map');
const roomEvents = require('./room')
const selectHeroEvents = require('./selectHero');
const gameEvents = require('./game');
const firebaseEvents = require('./firebase');

function registerSocketEvents(io, socket, db, admin) {
    mapEvents(io, socket);
    roomEvents(io, socket);
    selectHeroEvents(io, socket);
    gameEvents(io, socket);
    firebaseEvents(io, socket, db, admin)
}

module.exports = registerSocketEvents;