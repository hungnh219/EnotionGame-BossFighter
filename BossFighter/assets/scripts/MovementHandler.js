import EventBus from "./EventBus";
import GameController from "./Game/GameController";

cc.Class({
    extends: cc.Component,

    properties: {
        greenTilePrefab: cc.Prefab, // prefab cho ô vuông có thể đi lại
        redTilePrefab: cc.Prefab, // prefab cho ô vuông không thể đi lại
        mapLayout: cc.Layout,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.gameController = GameController.getInstance();
        if (!this.gameController) {
            this.gameController = new GameController();
            cc.game.addPersistRootNode(this.node);
        }

        this.clickNode = null
        this.firstCellPos = null;
        this.lastCellPos = null;
        this.walkableGridMap = null;

        EventBus.on(EventBus.events.DISPLAY_WALKABLE_AREA, (firstCellPos, lastCellPos, walkableGridMap, node) => {
            // console.log(123, gridMap);
            if (this.clickNode != node) this.clearWalkableArea();
            if (this.clickNode != null && this.clickNode == node) return;
            this.clickNode = node;
            this.displayWalkableArea(firstCellPos, lastCellPos, walkableGridMap, node);
        }, this);

        EventBus.on(EventBus.events.CLEAR_WALKABLE_AREA, () => {
            this.clearWalkableArea();
        }, this);

        EventBus.on(EventBus.events.MOVE_TO_WALKABLE_TILE, (nodeMove, tileNode) => {
            console.log('Move to walkable tile', nodeMove, tileNode);
            this.moveToWalkableTile(nodeMove, tileNode);
        }, this);
    },

    start () {

    },

    // update (dt) {},

    onDestroy() {
        EventBus.off(EventBus.events.DISPLAY_WALKABLE_AREA, this);
        EventBus.off(EventBus.events.CLEAR_WALKABLE_AREA, this);
        EventBus.off(EventBus.events.MOVE_TO_WALKABLE_TILE, this);
    },
    // =================== Init State ===================
    initTilePos(firstTilePos, lastTilePos) {
        this.firstTilePos = firstTilePos || { x: 0, y: 0 };
        this.lastTilePos = lastTilePos || { x: 10, y: 10 };
    },


    // =================== Movement Logic ===================
    // moveToWalkableTile(nodeMove, newPosNode) {
    //     let mapSetting = this.gameController.getMapSetting();
    //     if (!mapSetting) {
    //         console.warn('Map setting is not initialized');
    //         return;
    //     }

    //     if (nodeMove == undefined || nodeMove == null) {
    //         nodeMove = this.clickNode;
    //         if (this.clickNode == undefined || this.clickNode == null) return;
    //     }

    //     if (newPosNode == undefined || newPosNode == null) {
    //         console.warn('New tile node is undefined or null');
    //         return;
    //     }
    //     let oldGridX = Math.floor((nodeMove.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
    //     let oldGridY = Math.floor((nodeMove.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

    //     let newGridX = Math.floor((newPosNode.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
    //     let newGridY = Math.floor((newPosNode.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

    //     // calcalute steps to move
    //     let steps = [];
    //     let diffX = newGridX - oldGridX;
    //     let diffY = newGridY - oldGridY;
    //     let dx = 0;
    //     let dy = 0;
    //     diffX < 0 ? dx = -1 : dx = 1;
    //     diffY < 0 ? dy = -1 : dy = 1;

    //     let currentX = oldGridX;
    //     let currentY = oldGridY;
    //     let absDiffX = Math.abs(diffX);
    //     let absDiffY = Math.abs(diffY);
    //     let nextStepX = 0;
    //     let nextStepY = 0;
    //     while (absDiffX !== 0 || absDiffY !== 0) {
    //         if (absDiffX >= absDiffY && absDiffX > 0) {
    //             currentX += dx;
    //             absDiffX--;
    //         } else if (absDiffY > 0) {
    //             currentY += dy;
    //             absDiffY--;
    //         }

    //         nextStepX = this.firstCellPos.x + currentX * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
    //         nextStepY = this.firstCellPos.y + currentY * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;

    //         steps.push(cc.moveTo(0.4, nextStepX, nextStepY));
    //     }
    //     const finishCallback = cc.callFunc(() => {
    //         this.walkableGridMap[oldGridX][oldGridY] = true;
    //         this.walkableGridMap[newGridX][newGridY] = false;

    //         this.gameController.consumePlayerTurn();
    //         this.clearWalkableArea();
    //     });

    //     // Chạy sequence
    //     steps.push(finishCallback);
    //     const sequence = cc.sequence(...steps);
    //     nodeMove.runAction(sequence);
        
    //     // if node is hero, update turn
    //     this.gameController.consumePlayerTurn();
    //     this.clearWalkableArea();
    // },

    moveToWalkableTile(nodeMove, newPosNode) {
        let mapSetting = this.gameController.getMapSetting();
        if (!mapSetting) {
            console.warn('Map setting is not initialized');
            return;
        }

        if (nodeMove == undefined || nodeMove == null) {
            nodeMove = this.clickNode;
            if (this.clickNode == undefined || this.clickNode == null) return;
        }

        if (newPosNode == undefined || newPosNode == null) {
            console.warn('New tile node is undefined or null');
            return;
        }
        let oldGridX = Math.floor((nodeMove.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
        let oldGridY = Math.floor((nodeMove.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

        let newGridX = Math.floor((newPosNode.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
        let newGridY = Math.floor((newPosNode.y - this.firstCellPos.y) / mapSetting.mapTileHeight);
       
        const maxSteps = 3 + 3 - 2;
        const path = this.findPath(
            {x: oldGridX, y: oldGridY },
            { x: newGridX, y: newGridY },
            this.walkableGridMap,
            maxSteps,
        );

        if (!path) {
            console.warn("Không tìm được đường đi!");
            return;
        }

        // calcalute steps to move
        let steps = [];
        for (let i = 1; i < path.length; i++) {
            const p = path[i];
            const px = this.firstCellPos.x + p.x * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
            const py = this.firstCellPos.y + p.y * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;
            steps.push(cc.moveTo(0.4, px, py));
        }

        const finishCallback = cc.callFunc(() => {
            this.walkableGridMap[oldGridX][oldGridY] = true;
            this.walkableGridMap[newGridX][newGridY] = false;

            this.gameController.consumePlayerTurn();
            this.clearWalkableArea();
        });

        // Chạy sequence
        steps.push(finishCallback);
        const sequence = cc.sequence(...steps);
        nodeMove.runAction(sequence);
        
        // if node is hero, update turn
        this.gameController.consumePlayerTurn();
        this.clearWalkableArea();
    },

  


    // displayWalkableArea(firstCellPos, lastCellPos, walkableGridMap, node) {
    //     let mapSetting = this.gameController.getMapSetting();
    //     this.firstCellPos = firstCellPos;
    //     this.lastCellPos = lastCellPos;
    //     this.walkableGridMap = walkableGridMap;

    //     const steps = 2;

    //     const gridX = Math.floor((this.clickNode.x - firstCellPos.x) / 48);
    //     const gridY = Math.floor((this.clickNode.y - firstCellPos.y) / 48);

    //     const firstTileX = gridX - steps >= 0 ? gridX - steps : 0;
    //     const firstTileY = gridY - steps >= 0 ? gridY - steps : 0;
    //     const lastTileX = gridX + steps < mapSetting.mapWidth ? gridX + steps : (mapSetting.mapWidth - 1);
    //     const lastTileY = gridY + steps < mapSetting.mapHeight ? gridY + steps : (mapSetting.mapHeight - 1);


    //     for (let i = firstTileX; i <= lastTileX; i++) {
    //         for (let j = firstTileY; j <= lastTileY; j++) {
    //             if (walkableGridMap[i][j]) {
    //                 const walkableAreaTile = cc.instantiate(this.greenTilePrefab);
    //                 const mapPos = this.mapLayout.node.getPosition();

    //                 walkableAreaTile.x = mapPos.x + i * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
    //                 walkableAreaTile.y = mapPos.y + j * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;

    //                 this.mapLayout.node.parent.addChild(walkableAreaTile);
    //             }
    //         }
    //     }
    // },

    displayWalkableArea(firstCellPos, lastCellPos, walkableGridMap, node) {
        let mapSetting = this.gameController.getMapSetting();
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
        this.walkableGridMap = walkableGridMap;

        const steps = 2; // vùng di chuyển là 3 ô

        const gridX = Math.floor((this.clickNode.x - firstCellPos.x) / mapSetting.mapTileWidth);
        const gridY = Math.floor((this.clickNode.y - firstCellPos.y) / mapSetting.mapTileHeight);

        const firstTileX = Math.max(0, gridX - steps);
        const firstTileY = Math.max(0, gridY - steps);
        const lastTileX = Math.min(mapSetting.mapWidth - 1, gridX + steps);
        const lastTileY = Math.min(mapSetting.mapHeight - 1, gridY + steps);

        for (let i = firstTileX; i <= lastTileX; i++) {
            for (let j = firstTileY; j <= lastTileY; j++) {
                if (!walkableGridMap[i][j]) continue;

                const target = { x: i, y: j };
                const start = { x: gridX, y: gridY };

                // Kiểm tra đường đi trong phạm vi cho phép (A*)
                const path = this.findPath(start, target, walkableGridMap, 4);

                let tile;
                if (path) {
                    tile = cc.instantiate(this.greenTilePrefab);
                } else {
                    tile = cc.instantiate(this.redTilePrefab); // prefab màu đỏ
                }

                const mapPos = this.mapLayout.node.getPosition();
                tile.x = mapPos.x + i * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
                tile.y = mapPos.y + j * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;

                this.mapLayout.node.parent.addChild(tile);
            }
        }
    },


    clearWalkableArea() {
        if (!this.clickNode) return;
        // Xóa tất cả các ô vuông có thể đi lại
        this.mapLayout.node.parent.children.forEach(child => {
            if (child.name === 'GreenTile') {
                child.destroy();
            }
        });

        this.clickNode = null;
    },



    // =================== A* algorithm ===================    
    // findPath(start, end, walkableGridMap) {
    //     const cols = walkableGridMap.length;
    //     const rows = walkableGridMap[0].length;

    //     const openList = [];
    //     const closedList = [];
    //     const cameFrom = {};

    //     function isWalkable(x, y) {
    //         return (
    //             x >= 0 && y >= 0 &&
    //             x < cols && y < rows &&
    //             walkableGridMap[x][y] === true
    //         );
    //     }

    //     function heuristic(a, b) {
    //         // Manhattan distance
    //         return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    //     }

    //     function nodeKey(pos) {
    //         return `${pos.x},${pos.y}`;
    //     }

    //     const startNode = {
    //         x: start.x,
    //         y: start.y,
    //         g: 0,
    //         f: heuristic(start, end)
    //     };

    //     openList.push(startNode);

    //     while (openList.length > 0) {
    //         // lấy node có f thấp nhất
    //         openList.sort((a, b) => a.f - b.f);
    //         const current = openList.shift();
    //         const key = nodeKey(current);
    //         closedList.push(key);

    //         // nếu đến đích
    //         if (current.x === end.x && current.y === end.y) {
    //             const path = [];
    //             let curKey = key;
    //             while (cameFrom[curKey]) {
    //                 const pos = curKey.split(',').map(Number);
    //                 path.unshift({ x: pos[0], y: pos[1] });
    //                 curKey = cameFrom[curKey];
    //             }
    //             path.unshift(start); // thêm điểm bắt đầu
    //             return path;
    //         }

    //         const neighbors = [
    //             { x: current.x + 1, y: current.y },
    //             { x: current.x - 1, y: current.y },
    //             { x: current.x, y: current.y + 1 },
    //             { x: current.x, y: current.y - 1 }
    //         ];

    //         for (const neighbor of neighbors) {
    //             const nKey = nodeKey(neighbor);
    //             if (!isWalkable(neighbor.x, neighbor.y) || closedList.includes(nKey)) {
    //                 continue;
    //             }

    //             const tentativeG = current.g + 1;
    //             const existing = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);

    //             if (!existing) {
    //                 cameFrom[nKey] = key;
    //                 openList.push({
    //                     x: neighbor.x,
    //                     y: neighbor.y,
    //                     g: tentativeG,
    //                     f: tentativeG + heuristic(neighbor, end)
    //                 });
    //             } else if (tentativeG < existing.g) {
    //                 existing.g = tentativeG;
    //                 existing.f = tentativeG + heuristic(neighbor, end);
    //                 cameFrom[nKey] = key;
    //             }
    //         }
    //     }

    //     return null; // không tìm được đường
    // }
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

                // ⚠️ Bỏ nếu vượt vùng di chuyển cho phép
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
    }

});
