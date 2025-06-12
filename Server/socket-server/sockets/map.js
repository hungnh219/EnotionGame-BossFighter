// import mapData from '../data/mapData.json';
const MAP_DATA = require('../data/mapData.json');
const logicHandler = require('../handler/logicHandler');

function mapEvents(io, socket) {
    socket.on('GET_MAP_DATA', () => {
        // get current map data

        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        let roomData = logicHandler.common.readRoomData();
        let currentMapIndex = roomData[roomName].gameState.currentMapIndex;


        io.to(roomName).emit('MAP_DATA', {
            mapData: MAP_DATA.mapData[currentMapIndex]
        })
    })
}

module.exports = mapEvents;