import GameController from "./GameController";
import GameScene from "./GameData";

cc.Class({
    extends: cc.Component,

    properties: {
        mapHeight: cc.Integer,
        mapWidth: cc.Integer,
        // mapTile: cc.SpriteFrame,
        mapTileWidth: cc.Integer,
        mapTileHeight: cc.Integer,
        // mapTileSize: cc.Integer,

        backgroundSprite: cc.Sprite,
        backgroundSpriteFrames: [cc.SpriteFrame],
        tileSpriteFrames: [cc.SpriteFrame],
        bossPrefabs: [cc.Prefab],

        winnerNotificationLabel: cc.Label,

        bossAttackAnimation: cc.Animation,
        mapLayout: cc.Layout,

        boss1: cc.Prefab,

        mapIndex: 0,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // variables
        this.gridMap = [];
        this.isMoving = false;
        this.pressedKeys = new Set();
        this.gameController = GameController.getInstance();
        this.gameController.setTileSize(this.mapTileWidth, this.mapTileHeight)
        this.focusedHeroIndex = -1;
        this.heros = [];
        this.rootNode = this.node.parent;
        this.bossNode = null;
        

        for (let j = 0; j < this.mapHeight; j++) {
            let row = [];
            for (let i = 0; i < this.mapWidth; i++) {
                row.push({
                    x: j,
                    y: i,
                    walkable: true,
                    object: null,
                })

                this.gameController.updateWalkable(j, i, true);
            }
            this.gridMap.push(row);
        }

        
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        // test add boss into map
        this.winnerNotificationLabel.node.zIndex = 999;
        this.rootNode.sortAllChildren();
        
    },

    start () {
        this.heros = this.gameController.getHeroPrefabs();

        this.mapIndex = this.gameController.getMapPicked() ?? 0;
        console.log(this.mapIndex);
        this.tileSpriteFrame = this.tileSpriteFrames[this.mapIndex];
        this.backgroundSprite.spriteFrame = this.backgroundSpriteFrames[this.mapIndex];

        this.initMapView();
        if (this.heros) this.spawnHero(this.heros);
        this.spawnBoss();
        this.turnOnAutoBossAttack();
    },

    // update (dt) {},
    // onDestroy() {
    // },

    spawnHero(heroPrefabs) {
        heroPrefabs.forEach((heroPrefab, index) => {
            console.log(heroPrefab)
            let prefabNode = cc.instantiate(heroPrefab)

            this.rootNode.addChild(prefabNode);
            // this.gameController
            this.gameController.addHero(prefabNode);
            this.addObjectIntoMap(index, 0, 1, prefabNode);
        });

        this.focusedHeroIndex = 0;
        this.gameController.setFocusedHero(this.focusedHeroIndex);
        this.gameController.listenKeyDown(this.gameController.getFocusedHero());
    },

    spawnBoss() {
        console.log(this.mapIndex, 'map index')
        console.log(this.bossPrefabs[this.mapIndex], 'boss map')
        this.bossNode = cc.instantiate(this.bossPrefabs[this.mapIndex]);
        this.gameController.addBoss(this.bossNode);
        // this.bossNode.playA
        // const sprite = this.bossNode.getChildByName('Image')
        // const animation = sprite.getComponent(cc.Animation);
        // animation.play('boss2-fly'); 
        this.rootNode.addChild(this.bossNode);

        const size = 2;
        const posX = 2;
        const posY = 5;
        this.addObjectIntoMap(posX, posY, size, this.bossNode);
    },

    initMapView() {
        this.mapLayout.node.removeAllChildren();
        console.log('check reset')
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
                sprite.spriteFrame = this.tileSpriteFrame;

                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

                tileNode.width = this.mapTileWidth;
                tileNode.height = this.mapTileHeight;

                tileNode.x = i * this.mapTileWidth;
                tileNode.y = j * this.mapTileHeight;
                // tileNode.parent = this.mapLayout.node;
                tileNode.parent = this.mapLayout.node;

            }
        }
        // add first cell position
        const firstCellPos = {
            x: this.mapLayout.node.x,
            y: this.mapLayout.node.y,
        };

        const lastCellPos = {
            x: this.mapLayout.node.x + this.mapWidth * this.mapTileWidth,
            y: this.mapLayout.node.y + this.mapHeight * this.mapTileHeight,
        };

        this.gameController.setCellPosition(firstCellPos, lastCellPos);

            // create boss attack animation (test)
       
    },

    convertGridToPosition(gridX, gridY) {
        return {
            x: gridX * this.mapTileWidth,
            y: gridY * this.mapTileHeight,
        }
    },

    addObjectIntoMap(gridX, gridY, size, object) {
        let objectNode = object;

        if (object.node) objectNode = object.node;

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

        // set the z index of the object
        console.log("addObjectIntoMap", "objectNode", objectNode.x, objectNode.y);
        if (this.gridMap[gridX][gridY].object === null) {
            this.gridMap[gridX][gridY].object = object;

            if (size == 1) {
                this.gridMap[gridX][gridY].walkable = false;
                this.gameController.updateWalkable(gridX, gridY, false);
            } {
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        this.gameController.updateWalkable(gridX + i, gridY + j, false);
                    }
                }
            }
        } else {
            console.log("addObjectIntoMap", "object already exists");
        }

    },

    onKeyDown(event) {
        if (event.keyCode == cc.macro.KEY.tab) {
            // this.focusedHeroIndex = this.focusedHeroIndex++ % this.heros.length;
            if (this.gameController.getNumberOfHero() == 1) return; // only 1 hero remain
            this.focusedHeroIndex++;

            if (this.focusedHeroIndex == this.heros.length) {
                this.focusedHeroIndex = 0;
            }

            this.gameController.setFocusedHero(this.focusedHeroIndex);
            this.gameController.listenKeyDown(this.gameController.getFocusedHero());
        }

        if (event.keyCode == cc.macro.KEY.q) {
            // this.gameController.getFocusedHero().attack();

            // if (this.gameController.getWinner()) return;
            console.log(this.gameController.getFocusedHero());
            this.gameController.heroAttack();
            if (this.gameController.getWinner()) {
                this.winnerNotificationLabel.string = this.gameController.getWinner();
                this.winnerNotificationLabel.node.active = true;
                this.winnerNotificationLabel.node.parent.active = true;

                console.log(this.winnerNotificationLabel.node, 'label node')
                console.log(this.winnerNotificationLabel.node, 'label parent node')
                cc.director.pause();
            }
        }

        // if (event.keyCode == cc.macro.KEY.j) {
        //     console.log("w");
        //     this.gameController.heroSkill();
        // }

        if (event.keyCode == cc.macro.KEY.a || event.keyCode == cc.macro.KEY.d || event.keyCode == cc.macro.KEY.w || event.keyCode == cc.macro.KEY.s) {
         
            if (this.gameController.heros.length != 0){
       
                this.gameController.heroMoveAnimation(event);
            };
            
        }
    },



    turnOnAutoBossAttack() {
        console.log("turnOnAutoBossAttack");

        this.bossAutoAttack();

    },

    bossAutoAttack() {
        if (this.gameController.boss == undefined) {
            console.log("no boss node");
            return;
        }

        if (this.gameController.getWinner()) {
            this.winnerNotificationLabel.string = this.gameController.getWinner();
            this.winnerNotificationLabel.node.active = true;
            this.winnerNotificationLabel.node.parent.active = true;

            console.log(this.winnerNotificationLabel.node, 'label node')
            console.log(this.winnerNotificationLabel.node, 'label parent node')
            cc.director.pause()
            return;
        }

        setTimeout(() => {
            console.log('hehe231')
            console.log(this.gameController.getWinner());
            if (this.gameController.getWinner() == undefined) {
                this.gameController.bossAttack();
                this.bossAutoAttack();
            } else {
                console.log('check end game')
                this.winnerNotificationLabel.string = this.gameController.getWinner();
                cc.director.pause();
            }

            if (this.gameController.getWinner()) {
                
            }
        }, 2000);   
    },

    replayGame() {
        // if (cc.director.isPaused()) {
        //     cc.director.resume();
        // }

        // this.gameController.newGame();
        // this.node.destroy();

        cc.director.loadScene(GameScene.GAME)
    },

    newGame() {
        if (cc.director.isPaused()) {
            cc.director.resume();
        }

        this.gameController.newGame();
        this.node.destroy();
        cc.director.loadScene(GameScene.MAP_SELECT)
    },

    resetGame() {
        // reset
    },


});