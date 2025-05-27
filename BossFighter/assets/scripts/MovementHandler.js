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
        // this.isHeroMoving = false;

        EventBus.on(EventBus.events.DISPLAY_WALKABLE_AREA, (firstCellPos, lastCellPos, walkableGridMap, node) => {
            // if (this.isHeroMoving) return;
            if (this.clickNode != node) this.clearWalkableArea();
            if (this.clickNode != null && this.clickNode == node) return;
            this.clickNode = node;
            this.displayWalkableArea(firstCellPos, lastCellPos, walkableGridMap, node);
        }, this);

        EventBus.on(EventBus.events.CLEAR_WALKABLE_AREA, () => {
            this.clearWalkableArea();
        }, this);

        EventBus.on(EventBus.events.MOVE_TO_WALKABLE_TILE, (nodeMove, tileNode) => {
            this.moveToWalkableTile(nodeMove, tileNode);
        }, this);

        EventBus.on(EventBus.events.ENEMY_AUTO_MODE, (enemy, hero) => {
            this.autoMoveToHero(enemy, hero);
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
    moveToWalkableTile(nodeMove, newPosNode) {
        // this.isHeroMoving = true;
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

            this.isMoving = false;
            // let move = cc.Tween(nodeMove)
            //     .to(0.4, { x: px, y: py })
            // steps.push(move);
        }

        const finishCallback = cc.callFunc(() => {
            console.log('Node moved to new position');
            this.walkableGridMap[oldGridX][oldGridY] = true;
            this.walkableGridMap[newGridX][newGridY] = false;

            this.gameController.consumePlayerTurn();

            if (this.gameController.getPlayerTurnCount() <= 0) {
                this.gameController.enemyAutoMode();
            }
            // this.isHeroMoving = false;
            // this.clearWalkableArea();
        });

        // Chạy sequence
        steps.push(finishCallback);
        const sequence = cc.sequence(...steps);
        nodeMove.runAction(sequence);
        
        // if node is hero, update turn
        // this.gameController.consumePlayerTurn();
        this.clearWalkableArea();
    },

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

    // autoMoveToHero(enemy, hero) {
    //     if (!enemy || !hero) {
    //         console.warn('Enemy or hero is not defined');
    //         return;
    //     }

    //     const mapSetting = this.gameController.getMapSetting();
    //     if (!mapSetting) {
    //         console.warn('Map setting is not initialized');
    //         return;
    //     }

    //     const enemyGridX = Math.floor((enemy.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
    //     const enemyGridY = Math.floor((enemy.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

    //     const heroGridX = Math.floor((hero.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
    //     const heroGridY = Math.floor((hero.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

    //     this.walkableGridMap[heroGridX][heroGridY] = true; // Đảm bảo ô hero là có thể đi lại

    //     const path = this.findPath(
    //         {x: enemyGridX, y: enemyGridY },
    //         {x: heroGridX, y: heroGridY },
    //         this.walkableGridMap,
    //         100,
    //     );

    //     if (!path) {
    //         console.warn("Không tìm được đường đi!");
    //         return;
    //     }
    //     // calcalute steps to move
    //     let steps = [];
    //     for (let i = 1; i < path.length; i++) {
    //         const p = path[i];
    //         const px = this.firstCellPos.x + p.x * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
    //         const py = this.firstCellPos.y + p.y * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;
    //         steps.push(cc.moveTo(0.4, px, py));
    //     }

    //     const finishCallback = cc.callFunc(() => {
    //         console.log('Enemy reached hero position');

    //         // calculate new position of enemy
    //         const newEnemyPosX = Math.floor((enemy.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
    //         const newEnemyPosY = Math.floor((enemy.y - this.firstCellPos.y) / mapSetting.mapTileHeight);
    //         this.walkableGridMap[newEnemyPosX][newEnemyPosY] = false;
    //         this.walkableGridMap[heroGridX][heroGridY] = false;
    //         this.walkableGridMap[enemyGridX][enemyGridY] = true;
    //     });

    //     // Chạy sequence
    //     let restrictSteps = steps.slice(0, 3); // Giới hạn số bước di chuyển
    //     if (restrictSteps.length === 0) {
    //         console.warn("Không có bước di chuyển nào hợp lệ!");
    //         return;
    //     }
    //     restrictSteps.push(finishCallback);
    //     const sequence = cc.sequence(...restrictSteps);
    //     enemy.runAction(sequence);

    // },
    autoMoveToHero(enemy, hero) {
        if (!enemy || !hero) {
            console.warn('Enemy or hero is not defined');
            return;
        }

        const mapSetting = this.gameController.getMapSetting();
        if (!mapSetting) {
            console.warn('Map setting is not initialized');
            return;
        }

        const enemyGridX = Math.floor((enemy.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
        const enemyGridY = Math.floor((enemy.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

        const heroGridX = Math.floor((hero.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
        const heroGridY = Math.floor((hero.y - this.firstCellPos.y) / mapSetting.mapTileHeight);
        
        // Tạm thời cho phép tìm đường đến hero
        this.walkableGridMap[heroGridX][heroGridY] = true;

        const path = this.findPath(
            {x: enemyGridX, y: enemyGridY },
            {x: heroGridX, y: heroGridY },
            this.walkableGridMap,
            100
        );

        if (!path || path.length < 2) {
            console.warn("Không tìm được đường đi!");
            return;
        }

        const maxSteps = 3;
        let finalStepIndex = Math.min(maxSteps, path.length - 1);

        // Nếu bước cuối là ô hero, lùi lại 1 bước để không bước vào hero
        const lastStep = path[finalStepIndex];
        if (lastStep.x === heroGridX && lastStep.y === heroGridY) {
            finalStepIndex--;
            if (finalStepIndex < 1) {
                console.warn("Enemy không thể tiếp cận hero trong phạm vi di chuyển.");
                return;
            }
        }

        const steps = [];
        for (let i = 1; i <= finalStepIndex; i++) {
            const p = path[i];
            const px = this.firstCellPos.x + p.x * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
            const py = this.firstCellPos.y + p.y * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;
            steps.push(cc.moveTo(0.4, px, py));
            // let move = cc.Tween(nodeMove)
            //     .to(0.4, { x: px, y: py })
            // steps.push(move);
        }

        const finishCallback = cc.callFunc(() => {
            console.log('Enemy moved toward hero');

            // Cập nhật lại walkable map
            this.walkableGridMap[enemyGridX][enemyGridY] = true;

            const newEnemyX = Math.floor((enemy.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
            const newEnemyY = Math.floor((enemy.y - this.firstCellPos.y) / mapSetting.mapTileHeight);
            this.walkableGridMap[newEnemyX][newEnemyY] = false;
        });

        steps.push(finishCallback);
        enemy.runAction(cc.sequence(...steps));
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
    // move exactly to position
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
});
