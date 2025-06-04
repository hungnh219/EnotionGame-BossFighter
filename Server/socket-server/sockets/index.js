// import mapEvents from "./map";
const mapEvents = require('./map');
const roomEvents = require('./room')
import selectHeroEvents from './selectHero';

function registerSocketEvents(io, socket) {
    mapEvents(io, socket);
    roomEvents(io, socket);
    selectHeroEvents(io, socket);
}

module.exports = registerSocketEvents;