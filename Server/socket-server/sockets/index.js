// import mapEvents from "./map";
const mapEvents = require('./map');
const selectHeroEvents = require('./selectHero');

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
    selectHeroEvents(io, socket);
}

module.exports = registerSocketEvents;