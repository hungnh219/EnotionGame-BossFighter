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
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // GameController.getInstance().testPrintScene("hihi hehehe");
        // GameController.getInstance().printEditBoxValue();
        this.gridMap = [];

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
    },

    start () {
        console.log("start", this.gridMap);
        this.initMapView();
    },

    // update (dt) {},
    testChangeScene () {
        console.log("testChangeScene");
        // cc.director.loadScene("BossFighter");

        this.initMapView();
    },

    initMapView() {
        this.mapLayout.node.removeAllChildren();

        // center the map
        this.mapLayout.node.x = -this.mapWidth * this.mapTileWidth / 2;
        this.mapLayout.node.y = -this.mapHeight * this.mapTileHeight / 2;

        console.log("initMapView", this.mapHeight, this.mapWidth);
        this.mapLayout.node.width = this.mapWidth * this.mapTileWidth;
        this.mapLayout.node.height = this.mapHeight * this.mapTileHeight;


        console.log("this.mapLayout.node.width", this.mapLayout.node.width);
        console.log("this.mapLayout.node.height", this.mapLayout.node.height);

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

        const size = 2;

        const posX = 2;
        const posY = 7;

        this.addObjectIntoMap(posX, posY, size, this.bossAttackAnimation);
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
        let objectSprite = objectNode.getComponent(cc.Sprite);
        objectSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        const mapPos = this.mapLayout.node.getPosition();
        objectNode.x = mapPos.x + gridX * this.mapTileWidth;
        objectNode.y = mapPos.y + gridY * this.mapTileHeight;


        // calculate the size of the object (calculate based on raw size and scale it)


        if (this.gridMap[gridX][gridY].object === null) {
            this.gridMap[gridX][gridY].object = object;
            console.log("addObjectIntoMap", this.gridMap[gridX][gridY].object);
        } else {
            console.log("addObjectIntoMap", "object already exists");
        }

    }
});
