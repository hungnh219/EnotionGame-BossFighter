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

        enemyPrefab: cc.Prefab,
        enemySpawn: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // variables
        this.gridMap = [];
        this.isMoving = false;
        this.pressedKeys = new Set();
        this.gameController = GameController.getInstance();
        this.gameController.setTileSize(this.mapTileWidth, this.mapTileHeight)

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
        // this.node.addChild(this.testPrefab)
        this.node.parent.addChild(this.testPrefab)
        this.gameController.listenKeyDown(this.testPrefab);

        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    start () {
        console.log("start", this.gridMap);
        const test = this.gameController.getHeroPrefabs();
        console.log('previous prefab: ', test)
        this.initMapView();
    },

    // update (dt) {},
    // onDestroy() {
    // },

    initMapView() {
        this.mapLayout.node.removeAllChildren();

        /* ------------- create grid map ------------- */
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
        const size = 1;
        const posX = 1;
        const posY = 2;
        

        this.addObjectIntoMap(posX, posY, size, this.testPrefab);
        // this.addObjectIntoMap(posX, posY, size, this.testPrefab);

        
        if (this.gridMap[posX][posY].object !== null) {
            // this.gridMap[posX][posY].object.play('boss');
        }
    },

    convertGridToPosition(gridX, gridY) {
        return {
            x: gridX * this.mapTileWidth,
            y: gridY * this.mapTileHeight,
        }
    },

    addObjectIntoMap(gridX, gridY, size, object) {
        // let objectNode = object.node;
        let objectNode = object;
        // let objectSprite = objectNode.getComponent(cc.Sprite);
        // objectSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

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
