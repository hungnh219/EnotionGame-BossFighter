// const logicHandler = require('../handler/logicHandler');

const { getPlayerOrder } = require("./selectHeroHandler");

module.exports = {
    getPlayerGameData(roomData, roomName) {
        if (!roomData || !roomData[roomName]) {
            console.error("Không tìm thấy dữ liệu người chơi trong dữ liệu phòng.");
            return null;
        }

        // let player = roomData[roomName].player
        let player = [];
        roomData[roomName].player.map(playerObj => {
            const playerId = Object.keys(playerObj)[0];
            player.push({
                id: playerId,
                order: playerObj[playerId].order,
                lockedHero: playerObj[playerId].lockedHero,
            });
        });

        return player;
    },
    
    updateWalkableGridMap(roomData, roomName, x, y, isWalkable) {
        roomData[roomName].gameState.walkableGridMap;

        if (!roomData[roomName].gameState.walkableGridMap || !Array.isArray(roomData[roomName].gameState.walkableGridMap)) {
            console.error("Không hợp lệ hoặc không phải là mảng.");
            return;
        }

        if (roomData[roomName].gameState.walkableGridMap[x] === undefined || roomData[roomName].gameState.walkableGridMap[x] === null) {
            roomData[roomName].gameState.walkableGridMap[x] = [];
        }

        roomData[roomName].gameState.walkableGridMap[x][y] = isWalkable;

        // logicHandler.common.writeRoomData(roomData);
    },

    getWalkableGridMap(roomData, roomName) {
        if (!roomData || !roomData[roomName]) {
            console.error("Không tìm thấy lưới ô có thể đi lại trong dữ liệu phòng.");
            return null;
        }
        
        return roomData[roomName].gameState.walkableGridMap;
    },

    // =================== A* algorithm ===================    
    findPath(start, end, walkableGridMap, maxStep = 3) {
        const cols = walkableGridMap.length;
        const rows = walkableGridMap[0].length;

        const openList = [];
        const closedList = [];
        const cameFrom = {};

        function isWalkable(x, y) {
            return (
                x >= 0 && y >= 0 &&
                x < cols && y < rows &&
                walkableGridMap[x][y] === true
            );
        }

        function heuristic(a, b) {
            return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan
        }

        function nodeKey(pos) {
            return `${pos.x},${pos.y}`;
        }

        function isInMoveRange(start, pos, maxStep) {
            const dx = Math.abs(start.x - pos.x);
            const dy = Math.abs(start.y - pos.y);
            return (dx + dy <= maxStep);
        }

        // Kiểm tra nếu end nằm ngoài vùng cho phép thì bỏ
        if (!isInMoveRange(start, end, maxStep)) return null;

        const startNode = {
            x: start.x,
            y: start.y,
            g: 0,
            f: heuristic(start, end)
        };

        openList.push(startNode);

        while (openList.length > 0) {
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();
            const key = nodeKey(current);
            closedList.push(key);

            if (current.x === end.x && current.y === end.y) {
                const path = [];
                let curKey = key;
                while (cameFrom[curKey]) {
                    const pos = curKey.split(',').map(Number);
                    path.unshift({ x: pos[0], y: pos[1] });
                    curKey = cameFrom[curKey];
                }
                path.unshift(start); // thêm điểm đầu
                return path;
            }

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (const neighbor of neighbors) {
                const nKey = nodeKey(neighbor);

                // Bỏ nếu vượt vùng di chuyển cho phép
                if (!isInMoveRange(start, neighbor, maxStep)) continue;

                if (!isWalkable(neighbor.x, neighbor.y) || closedList.includes(nKey)) {
                    continue;
                }

                const tentativeG = current.g + 1;
                const existing = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);

                if (!existing) {
                    cameFrom[nKey] = key;
                    openList.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        g: tentativeG,
                        f: tentativeG + heuristic(neighbor, end)
                    });
                } else if (tentativeG < existing.g) {
                    existing.g = tentativeG;
                    existing.f = tentativeG + heuristic(neighbor, end);
                    cameFrom[nKey] = key;
                }
            }
        }

        return null; // không tìm được đường đi
    },

}