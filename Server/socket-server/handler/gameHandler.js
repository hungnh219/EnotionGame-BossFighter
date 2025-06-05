module.exports = {
    updateWalkableGridMap(walkableGridMap, x, y, isWalkable) {
        if (!walkableGridMap || !Array.isArray(walkableGridMap) || walkableGridMap.length === 0) {
            console.error("walkableGridMap không hợp lệ hoặc rỗng.");
            return;
        }
        if (x < 0 || x >= walkableGridMap.length || y < 0 || y >= walkableGridMap[0].length) {
            console.error("Vị trí (x, y) nằm ngoài phạm vi của walkableGridMap.");
            return;
        }
        walkableGridMap[x][y] = isWalkable;
    },

    getWalkableGridMap(roomData, roomName) {
        
    }
}