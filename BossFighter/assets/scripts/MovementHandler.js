import EventBus from "./EventBus";
import GameController from "./Game/GameController";

cc.Class({
    extends: cc.Component,

    properties: {
        greenTilePrefab: cc.Prefab, // prefab cho ô vuông có thể đi lại
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
    moveToWalkableTile(nodeMove, newTileNode) {
        if (nodeMove == undefined || nodeMove == null) {
            nodeMove = this.clickNode;
            if (this.clickNode == undefined || this.clickNode == null) return;
        }
        if (newTileNode == undefined || newTileNode == null) {
            console.warn('New tile node is undefined or null');
            return;
        }
        let oldGridX = Math.floor((nodeMove.x - this.firstCellPos.x) / 48);
        let oldGridY = Math.floor((nodeMove.y - this.firstCellPos.y) / 48);

        let newGridX = Math.floor((newTileNode.x - this.firstCellPos.x) / 48);
        let newGridY = Math.floor((newTileNode.y - this.firstCellPos.y) / 48);

        // check if the node is walkable
        if (this.walkableGridMap[newGridX][newGridY] == false) {
            console.warn('Node is not walkable');
            return;
        }
        
        // // calculate step to new position
        const dx = newGridX - Math.floor((nodeMove.x - this.firstCellPos.x) / 48);
        const dy = newGridY - Math.floor((nodeMove.y - this.firstCellPos.y) / 48);
        if (dx === 0 && dy === 0) {
            console.warn('Node is already at the new position');
            return;
        }

        // find new position
        const newX = nodeMove.x + dx * 48;
        const newY = nodeMove.y + dy * 48;
      
        // update move logic
        const moveAction = cc.moveTo(0.4, newX, newY);
        const finishCallback = cc.callFunc(() => {

        });
        const sequence = cc.sequence(moveAction, finishCallback);
        nodeMove.runAction(sequence);

        // set old position to walkable and new position to not walkable
        if (this.walkableGridMap[oldGridX][oldGridY] !== undefined) {
            this.walkableGridMap[oldGridX][oldGridY] = true;
            this.walkableGridMap[newGridX][newGridY] = false;
        }

        // if node is hero, update turn
        this.gameController.consumePlayerTurn();
        this.clearWalkableArea();
    },

    displayWalkableArea(firstCellPos, lastCellPos, walkableGridMap, node) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
        this.walkableGridMap = walkableGridMap;

        // remove hard code
        const steps = 2;

        const gridX = Math.floor((this.clickNode.x - firstCellPos.x) / 48);
        const gridY = Math.floor((this.clickNode.y - firstCellPos.y) / 48);

        const firstTileX = gridX - steps >= 0 ? gridX - steps : 0;
        const firstTileY = gridY - steps >= 0 ? gridY - steps : 0;
        const lastTileX = gridX + steps < 8 ? gridX + steps : 7;
        const lastTileY = gridY + steps < 8 ? gridY + steps : 7;


        for (let i = firstTileX; i <= lastTileX; i++) {
            for (let j = firstTileY; j <= lastTileY; j++) {
                if (walkableGridMap[i][j]) {
                    const walkableAreaTile = cc.instantiate(this.greenTilePrefab);
                    const mapPos = this.mapLayout.node.getPosition();

                    walkableAreaTile.x = mapPos.x + i * 48 + 24;
                    walkableAreaTile.y = mapPos.y + j * 48 + 24;

                    this.mapLayout.node.parent.addChild(walkableAreaTile);
                }
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
    }
});
