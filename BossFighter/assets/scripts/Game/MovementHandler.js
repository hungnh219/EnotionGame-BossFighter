// import EventBus from "./EventBus";
// import GameController from "./Game/GameController";
import EventBus from "../EventBus";
import GameController from "./GameController";
import MapController from "./MapController";
import SocketIOManager from "../SocketIO/SocketIOManager";

const ANIM_MAP = {
    'idle': 'Idle',
    'walk': {
        'front': 'walk_front',
        'back': 'walk_back',
        'left': 'walk_left',
        'right': 'walk_right',
    }, 
    'attack': {
        'front': 'attack_front',
        'back': 'attack_back',
        'left': 'attack_left',
        'right': 'attack_right',
    }
}

cc.Class({
    extends: cc.Component,

    properties: {
        greenTilePrefab: cc.Prefab, // prefab cho ô vuông có thể đi lại
        redTilePrefab: cc.Prefab, // prefab cho ô vuông không thể đi lại
        mapLayout: cc.Layout,

        mapObjectHolder: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.gameController = GameController.getInstance();
        if (!this.gameController) {
            this.gameController = new GameController();
            cc.game.addPersistRootNode(this.node);
        }

        this.mapController = MapController.getInstance() || new MapController();
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        this.socketIOManager.game.listenMoveToNewTile((data) => {
            let playerNode = this.gameController.getPlayerByIndex(data.playerIndex);

            // Nếu là chính mình thì bỏ qua
            if (data.playerIndex === this.gameController.getPlayerIndex()) return;

            this.moveToWalkableTile(playerNode, {
                newX: data.newX,
                newY: data.newY,
            }, true);
        })
        this.clickNode = null
        this.firstCellPos = null;
        this.lastCellPos = null;

        EventBus.on(EventBus.events.DISPLAY_WALKABLE_AREA, (firstCellPos, lastCellPos, walkableGridMap, node) => {
            if (this.clickNode != node) {
                this.clearWalkableArea();
            }
            if (this.clickNode != null && this.clickNode == node) return;
            if (!firstCellPos || !lastCellPos || !walkableGridMap || !node) {
                console.warn('Invalid parameters for displaying walkable area');
                return;
            }

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
    async moveToWalkableTile(nodeMove, newPosNode, moveFromServer = false) {
        let mapSetting = this.gameController.getMapSetting();
        if (!mapSetting) return;

        if (nodeMove == undefined || nodeMove == null) {
            nodeMove = this.clickNode;
            if (this.clickNode == undefined || this.clickNode == null) return;
        }
        if (newPosNode == undefined || newPosNode == null) return;

        let oldGridX = Math.floor((nodeMove.x) / mapSetting.mapTileWidth);
        let oldGridY = Math.floor((nodeMove.y) / mapSetting.mapTileHeight);
        let newGridX, newGridY;

        if (newPosNode.x == undefined || newPosNode.y == undefined) {
            newGridX = newPosNode.newX;
            newGridY = newPosNode.newY;
        } else {
            newGridX = Math.floor((newPosNode.x) / mapSetting.mapTileWidth);
            newGridY = Math.floor((newPosNode.y) / mapSetting.mapTileHeight);
        }


        const maxStep = 3 + 3 - 2;

        const path = await this.socketIOManager.game.findPath({
            start: { x: oldGridX, y: oldGridY },
            end: { x: newGridX, y: newGridY },
            maxStep: maxStep
        });

        if (!path) {
            console.warn("Không tìm được đường đi!");
            return;
        }

        if (!moveFromServer) {
            this.socketIOManager.game.moveToNewTile({
                playerIndex: this.gameController.getPlayerIndex(),
                // newPos: newPosNode,
                newX: newGridX,
                newY: newGridY,
            });
        }


        const moveStep = async (i) => {
            if (i >= path.length) {
                // Finish
                await this.socketIOManager.game.updateWalkableGridMap({
                    x: oldGridX,
                    y: oldGridY,
                    isWalkable: true
                });
                await this.socketIOManager.game.updateWalkableGridMap({
                    x: newGridX,
                    y: newGridY,
                    isWalkable: false
                });

                this.gameController.consumePlayerTurn();
                if (this.gameController.getPlayerTurnCount() <= 0) {
                    this.gameController.enemyAutoMode();
                }
                // this.clearWalkableArea();
                return;
            }
            if (i > 0) {
                const prev = path[i - 1];
                const curr = path[i];
                const direction = this.getDirection(prev, curr);
                this.playAnimation(nodeMove, 'walk', direction);
            }
            const p = path[i];
            const px = p.x * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
            const py = p.y * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;
            
            nodeMove.runAction(
                cc.sequence(
                    cc.moveTo(0.4, px, py),
                    cc.callFunc(() => moveStep(i + 1))
                )
            );
        };
        this.clearWalkableArea();
        moveStep(1); // bắt đầu từ bước 1 (bỏ vị trí hiện tại)
    },

    async displayWalkableArea(firstCellPos, lastCellPos, walkableGridMap, node) {
        let mapSetting = this.gameController.getMapSetting();
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
        this.walkableGridMap = walkableGridMap;

        const steps = 2; // vùng di chuyển là 3 ô

        const gridX = Math.floor((this.clickNode.x) / mapSetting.mapTileWidth);
        const gridY = Math.floor((this.clickNode.y) / mapSetting.mapTileWidth);

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
                // const path = this.findPath(start, target, walkableGridMap, 4);
                const path = await this.socketIOManager.game.findPath({
                    start: start,
                    end: target,
                    maxStep: 4
                });

                let tile;
                if (path) {
                    tile = cc.instantiate(this.greenTilePrefab);
                } else {
                    tile = cc.instantiate(this.redTilePrefab); // prefab màu đỏ
                }

                this.mapObjectHolder.addChild(tile);
                this.mapController.addObjectIntoMap(i, j, 1, tile);
                

            }
        }
    },
  
    async autoMoveToHero(enemy, hero) {
        if (!enemy || !hero) {
            console.warn('Enemy or hero is not defined');
            return;
        }

        const mapSetting = this.gameController.getMapSetting();
        if (!mapSetting) {
            console.warn('Map setting is not initialized');
            return;
        }

        const enemyGridX = Math.floor((enemy.x) / mapSetting.mapTileWidth);
        const enemyGridY = Math.floor((enemy.y) / mapSetting.mapTileHeight);
        const heroGridX = Math.floor((hero.x) / mapSetting.mapTileWidth);
        const heroGridY = Math.floor((hero.y) / mapSetting.mapTileHeight);
        
        // this.walkableGridMap[heroGridX][heroGridY] = true;
        await this.socketIOManager.game.updateWalkableGridMap({
            x: heroGridX,
            y: heroGridY,
            isWalkable: true
        });

        const path = await this.socketIOManager.game.findPath({
            start: { x: enemyGridX, y: enemyGridY },
            end: { x: heroGridX, y: heroGridY },
            maxStep: 100
        });

        if (!path || path.length < 2) {
            console.warn("Không tìm được đường đi!");
            return;
        }

        const maxSteps = 3;
        let finalStepIndex = Math.min(maxSteps, path.length - 1);

        const lastStep = path[finalStepIndex];
        if (lastStep.x === heroGridX && lastStep.y === heroGridY) {
            finalStepIndex--;
            if (finalStepIndex < 1) {
                console.warn("Enemy không thể tiếp cận hero trong phạm vi di chuyển.");
                return;
            }
        }

        const moveStep = (i) => {
            if (i > finalStepIndex) {
                // Finish
                // this.walkableGridMap[enemyGridX][enemyGridY] = true;
                this.socketIOManager.game.updateWalkableGridMap({
                    x: enemyGridX,
                    y: enemyGridY,
                    isWalkable: true
                });
                // const newEnemyX = Math.floor((enemy.x - this.firstCellPos.x) / mapSetting.mapTileWidth);
                // const newEnemyY = Math.floor((enemy.y - this.firstCellPos.y) / mapSetting.mapTileHeight);

                const newEnemyX = Math.floor(enemy.x / mapSetting.mapTileWidth);
                const newEnemyY = Math.floor(enemy.y / mapSetting.mapTileHeight);
                // this.walkableGridMap[newEnemyX][newEnemyY] = false;
                this.socketIOManager.game.updateWalkableGridMap({
                    x: newEnemyX,
                    y: newEnemyY,
                    isWalkable: false
                });
                
                return;
            }
            if (i > 0) {
                const prev = path[i - 1];
                const curr = path[i];
                const direction = this.getDirection(prev, curr);
                this.playAnimation(enemy, 'walk', direction);
            }
            const p = path[i];
            // const px = this.firstCellPos.x + p.x * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
            // const py = this.firstCellPos.y + p.y * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;
            const px = p.x * mapSetting.mapTileWidth + mapSetting.mapTileWidth / 2;
            const py = p.y * mapSetting.mapTileHeight + mapSetting.mapTileHeight / 2;
            enemy.runAction(
                cc.sequence(
                    cc.moveTo(0.4, px, py),
                    cc.callFunc(() => moveStep(i + 1))
                )
            );
        };
        moveStep(1); // bắt đầu từ bước 1 (bỏ vị trí hiện tại)
    },


    clearWalkableArea() {
        if (!this.clickNode) return;
        // Xóa tất cả các ô vuông có thể đi lại
        this.mapObjectHolder.children.forEach(child => {
            if (child.name === 'GreenTile') {
                child.destroy();
            }
        });

        this.clickNode = null;
    },

    // =================== animation move logic ===================
    getDirection(current, next) {
        if (next.x > current.x) return 'right';
        if (next.x < current.x) return 'left';
        if (next.y > current.y) return 'front';
        if (next.y < current.y) return 'back';
        return 'front';
    },

    playAnimation(node, actionName, direction) {
        node.mainScript = node.getComponents(cc.Component).find(c => typeof c.playAnimation === 'function');
        if (!node.mainScript) {
            cc.error("Node does not have a main script with playAnimation method");
            return;
        }

        let animationName = ANIM_MAP[actionName][direction];
        if (!animationName) {
            cc.error("Invalid action name or direction:", actionName, direction);
            return;
        }

        node.mainScript.playAnimation(animationName, 0.4);
    }
});