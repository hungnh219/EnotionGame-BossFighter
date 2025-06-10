const mapEvents = require('./map');
const roomEvents = require('./room')
const selectHeroEvents = require('./selectHero');
const gameEvents = require('./game');
const firebaseEvents = require('./firebase');
const scoreTableEvents = require('./scoreTable');
const turnEvents = require('./turn');

function registerSocketEvents(io, socket, db, admin) {
    mapEvents(io, socket);
    roomEvents(io, socket);
    selectHeroEvents(io, socket);
    gameEvents(io, socket);
    firebaseEvents(io, socket, db, admin);
    scoreTableEvents(io, socket);
    turnEvents(io, socket);
}

module.exports = registerSocketEvents;