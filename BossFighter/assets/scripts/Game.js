import GameController from "./GameController";

cc.Class({
    extends: cc.Component,

    properties: {
        mapHeight: cc.Integer,
        mapWidth: cc.Integer,
        mapTile: cc.SpriteFrame,
        mapTileWidth: cc.Integer,
        mapTileHeight: cc.Integer,
        // mapTileSize: cc.Integer,

        bossAttackAnimation: cc.Animation,
        mapLayout: cc.Layout,

        playerPrefab: cc.Prefab,
        playerSpawn: cc.Node,
        
        // enemyPrefab: cc.Prefab,
        // enemySpawn: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // variables
        this.gridMap = [];
        this.isMoving = false;
        this.pressedKeys = new Set();



        for (let j = 0; j < this.mapHeight; j++) {
            let row = [];
            for (let i = 0; i < this.mapWidth; i++) {
                row.push({
                    x: j,
                    y: i,
                    walkable: true,
                    object: null,
                })
            }

            this.gridMap.push(row);
        }
        this.testPrefab = cc.instantiate(this.playerPrefab)
        // this.testPrefab.setPosition(this.playerSpawn.position);
        this.node.addChild(this.testPrefab)
        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.gameController = GameController.getInstance();
        this.gameController.onLoad();
        this.gameController.setMapTileWidth(this.mapTileWidth);
        this.gameController.setMapTileHeight(this.mapTileHeight);
        this.gameController.setObject(this.testPrefab);
    },

    start () {
        console.log("start", this.gridMap);
        this.initMapView();
    },

    // // update (dt) {},
    // onDestroy() {
    //     cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.keyboardInput, this);
    //     cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.keyboardInput, this);
    // },

    // onKeyDown(event) {
    //     this.pressedKeys.add(event.keyCode);

    //     // delay to wait set of keys down
    //     this.scheduleOnce(() => {
    //         this.checkMove();
    //     }, 0.1);
    // },
    // onKeyUp(event) {
    //     this.pressedKeys.delete(event.keyCode);
    // },
    // checkMove() {
    //     if (this.isMoving) return;

    //     let dx = 0;
    //     let dy = 0;

    //     if (this.pressedKeys.has(cc.macro.KEY.w) || this.pressedKeys.has(cc.macro.KEY.up)) {
    //         dy += 1;
    //     }
    //     if (this.pressedKeys.has(cc.macro.KEY.s) || this.pressedKeys.has(cc.macro.KEY.down)) {
    //         dy -= 1;
    //     }
    //     if (this.pressedKeys.has(cc.macro.KEY.a) || this.pressedKeys.has(cc.macro.KEY.left)) {
    //         dx -= 1;
    //     }
    //     if (this.pressedKeys.has(cc.macro.KEY.d) || this.pressedKeys.has(cc.macro.KEY.right)) {
    //         dx += 1;
    //     }

    //     if (dx !== 0 || dy !== 0) {
    //         this.moveCharacter(dx, dy);
    //     }
    // },
    // moveCharacter (dx, dy) {
    //     const newX = this.testPrefab.x + dx * this.mapTileWidth;
    //     const newY = this.testPrefab.y + dy * this.mapTileHeight;

    //     // check if the new position is walkable
    //     // if (newX < 0 || newX >= this.mapWidth * this.mapTileWidth) return;

    //     this.isMoving = true;
    //     const moveAction = cc.moveTo(0.5, newX, newY);
    //     // const moveAction = cc.moveTo(0.5, newX, newY).easing(cc.easeCubicActionOut());
    //     const finishCallback = cc.callFunc(() => {
    //         this.isMoving = false;
    //         this.checkMove();
    //     });
    //     const sequence = cc.sequence(moveAction, finishCallback);
    //     this.testPrefab.runAction(sequence);

    // },
    
    testChangeScene () {
        console.log("testChangeScene");
        this.initMapView();

        
    },

    initMapView() {
        this.mapLayout.node.removeAllChildren();

        // create grid map
            // center the map
        this.mapLayout.node.x = -this.mapWidth * this.mapTileWidth / 2;
        this.mapLayout.node.y = -this.mapHeight * this.mapTileHeight / 2;

        this.mapLayout.node.width = this.mapWidth * this.mapTileWidth;
        this.mapLayout.node.height = this.mapHeight * this.mapTileHeight;

        for (let j = 0; j < this.mapHeight; j++) {
            for (let i = 0; i < this.mapWidth; i++) {
                let tileNode = new cc.Node();
                let sprite = tileNode.addComponent(cc.Sprite);
                sprite.spriteFrame = this.mapTile;

                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

                tileNode.width = this.mapTileWidth;
                tileNode.height = this.mapTileHeight;

                tileNode.x = i * this.mapTileWidth;
                tileNode.y = j * this.mapTileHeight;
                // tileNode.parent = this.mapLayout.node;
                tileNode.parent = this.mapLayout.node;
            }
        }

            // create boss attack animation (test)
        const size = 2;
        const posX = 1;
        const posY = 5;

        this.addObjectIntoMap(posX, posY, size, this.testPrefab);
        if (this.gridMap[posX][posY].object !== null) {
            this.gridMap[posX][posY].object.play('boss');
        }
    },

    convertGridToPosition(gridX, gridY) {
        return {
            x: gridX * this.mapTileWidth,
            y: gridY * this.mapTileHeight,
        }
    },

    addObjectIntoMap(gridX, gridY, size, object) {
        let objectNode = object.node;
        console.log('objectNode',objectNode)
        let objectSprite = objectNode.getComponent(cc.Sprite);
        objectSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;


        // resize the object
        if (objectNode.width > objectNode.height) {
            console.log("objectSprite", "width > height", objectNode.width, objectNode.height);
            let ratio = this.mapTileHeight / objectNode.height;

            objectNode.height = this.mapTileHeight * size;

            objectNode.width *= ratio * size;
            console.log("after resize", objectNode.width, objectNode.height);
        } else {
            console.log("objectSprite", "width < height", objectNode.width, objectNode.height);
            objectNode.width = this.mapTileWidth * size;

            objectNode.height = this.mapTileHeight * size * (objectNode.width / this.mapTileWidth);
            console.log("after resize", objectNode.width, objectNode.height);
        }

        // set the position of the object
        const mapPos = this.mapLayout.node.getPosition();
        objectNode.x = mapPos.x + gridX * this.mapTileWidth + (this.mapTileWidth * size)/ 2;
        objectNode.y = mapPos.y + gridY * this.mapTileHeight + (this.mapTileHeight * size)/ 2;

        if (this.gridMap[gridX][gridY].object === null) {
            this.gridMap[gridX][gridY].object = object;
            console.log("addObjectIntoMap", this.gridMap[gridX][gridY].object);
        } else {
            console.log("addObjectIntoMap", "object already exists");
        }

    }
});
