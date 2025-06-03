// import mapData from '../data/mapData.json';
const mapData = require('../data/mapData.json');

let walkableGridMap = [];

function mapEvents(io, socket) {
    socket.on('GET_MAP_DATA', () => {
        console.log('Yêu cầu dữ liệu bản đồ từ client:', socket.id);
        
        socket.emit('MAP_1_DATA', {
            mapData: mapData.mapData.find(map => map.name === 'Map 1'),
        })
    })

    // socket.on('UPDATE_WALKABLE_GRID', (data) => {
    //     console.log('Cập nhật lưới đi bộ từ client:', socket.id, 'Dữ liệu:', data);

    //     let tileX = data.tileX;
    //     let tileY = data.tileY;
    //     let isWalkable = data.isWalkable;

    //     // Cập nhật lưới đi bộ
    //     if (!walkableGridMap[tileX]) {
    //         walkableGridMap[tileX] = [];
    //     }
    //     walkableGridMap[tileX][tileY] = isWalkable;

    //     // Phát sự kiện cho tất cả client
    //     io.emit('WALKABLE_GRID_UPDATED', {
    //         tileX: tileX,
    //         tileY: tileY,
    //         isWalkable: isWalkable,
    //     });
    // })

    // socket.on('GET_WALKABLE_GRID_MAP', () => {
    //     console.log('Yêu cầu gridmap từ client:', socket.id);
        
    //     // // Phát sự kiện cho tất cả client
    //     socket.emit('WALKABLE_GRID_MAP', {
    //         walkableGridMap: walkableGridMap,
    //     });
    // })
    socket.on('GET_WALKABLE_GRID_MAP', () => {
        console.log('Client yêu cầu gridmap:', socket.id);

        socket.emit('WALKABLE_GRID_MAP', {
            walkableGridMap: walkableGridMap,
        });
    });

}

module.exports = mapEvents;