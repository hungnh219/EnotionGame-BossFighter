// import mapData from '../data/mapData.json';
const mapData = require('../data/mapData.json');

function mapEvents(io, socket) {
    socket.on('GET_MAP_DATA', () => {
        console.log('Yêu cầu dữ liệu bản đồ từ client:', socket.id);
        
        socket.emit('MAP_1_DATA', {
        mapData: mapData.mapData.find(map => map.name === 'Map 1'),
        })
    })
}

module.exports = mapEvents;