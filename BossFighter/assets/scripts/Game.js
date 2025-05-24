import GameController from "./GameController";
import GAME_DATA from "./GameData"

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
        backgroundNotificationPanelSpriteFrames: [cc.SpriteFrame], // win index bg = 1, lose = 0
        mapLayout: cc.Layout,
        focusEffectPrefab: cc.Prefab,
        mapIndex: 0,

        testSkills: [cc.Prefab],

        pauseButton: cc.Button,
        resumeButton: cc.Button,
        nextButton: cc.Button,
        heroPrefabs: [cc.Prefab],
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {

        cc.director.getCollisionManager().enabled = true;
       
        // variables
        this.gridMap = [];
        this.isMoving = false;
        this.pressedKeys = new Set();
        this.gameController = GameController.getInstance();
        this.gameController.setTileSize(this.mapTileWidth, this.mapTileHeight)
        this.focusedHeroIndex = -1;
        this.heroes = [];
        this.rootNode = this.node.parent;
        this.bossNode = null;
        // this.heroPrefabs = [];
        this.isAttacking = false;
        this.isCastingSkill = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        // test add boss into map
        this.winnerNotificationLabel.node.parent.zIndex = 999;
        this.rootNode.sortAllChildren();
    },

    start() {
        this.initData();
    },

    // update (dt) {},
    // onDestroy() {
    // },
    initData() {
        this.initGridMap();

        // this.heroPrefabs = this.gameController.getHeroPrefabs();
        this.heroPrefabs.forEach((heroPrefab, index) => {
            console.log('heroPrefab', heroPrefab);
            if (heroPrefab) {
                this.gameController.addSelectedHeroPrefab(heroPrefab);
            }
        });

        console.log('heroPrefabs', this.gameController.getHeroPrefabs());
        // this.gameController.setHe
        // this.mapIndex = this.gameController.getMapPicked() ?? 0;
        this.mapIndex = 1;
        this.tileSpriteFrame = this.tileSpriteFrames[this.mapIndex];
        this.backgroundSprite.spriteFrame = this.backgroundSpriteFrames[this.mapIndex];

        this.initMapView();

        if (this.heroPrefabs) this.spawnHero();
        this.spawnBoss();
        this.turnOnAutoBossAttack();
        // this.turnOnAutoSkill();
        this.turnOnAutoMode();
        // this.spawnTestSkill();

        this.gameController.setMapPicked(this.mapIndex);
        if (this.mapIndex > 0) {
            this.turnOnAutoSkill();
        }

    },

    resetData() {
        this.gameController.resetGame();

        this.heroPrefabs = this.gameController.getHeroPrefabs();
        this.mapIndex = this.gameController.getMapPicked() ?? 0;

        if (this.heroPrefabs) this.spawnHero();
        this.spawnBoss();
    },

    initGridMap() {
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
    },
    spawnHero() {
        this.heroPrefabs.forEach((heroPrefab, index) => {
            let prefabNode = cc.instantiate(heroPrefab)
            let effectNode = cc.instantiate(this.focusEffectPrefab)
            prefabNode.focusEffect = effectNode;
            effectNode.setPosition(cc.v2(0, this.mapTileHeight));
            effectNode.active = false;
            prefabNode.addChild(effectNode);

            this.rootNode.addChild(prefabNode);
            this.gameController.addHero(prefabNode);
            this.addObjectIntoMap(index, 0, 1, prefabNode);
            this.updateWalkable(index, 0, 1);

            this.heroes.push(prefabNode)
        });

        this.focusedHeroIndex = 0;
        this.gameController.setFocusedHero(this.focusedHeroIndex);
        this.gameController.listenKeyDown(this.gameController.getFocusedHero());
    },

    spawnBoss() {
        const size = 2;
        const posX = 2;
        const posY = 5;

        this.bossNode = cc.instantiate(this.bossPrefabs[this.mapIndex]);
        this.gameController.addBoss(this.bossNode);

        // scale boss to 1.5 if size > 1
        if (size == 1) {
            this.bossNode.scale = 1;
        } else if (size > 1) {
            this.bossNode.scale = 1.5;

            if (this.mapIndex == 2) {
                this.bossNode.scale = 1;
            }
        } else if (size > 3) {
            this.bossNode.scale = 2;
        }


        this.rootNode.addChild(this.bossNode);

        
        this.addObjectIntoMap(posX, posY, size, this.bossNode);
        this.updateWalkable(posX, posY, size);
    },

    spawnSkill() {
        let randomNumber = Math.floor(Math.random() * 3)

        let testSkill = null;
        if (this.testSkills[this.mapIndex] == undefined) {
            console.log('no test skill map')
            return;
        }
        if (randomNumber == 0) {
            testSkill = cc.instantiate(this.testSkills[0]);
        }
        if (randomNumber == 1) {
            testSkill = cc.instantiate(this.testSkills[1]);
        }
        if (randomNumber == 2) {
            testSkill = cc.instantiate(this.testSkills[2]);
        }

        let randomX = Math.floor(Math.random() * this.mapWidth);
        let randomY = Math.floor(Math.random() * this.mapHeight);

        let size = Math.floor(Math.random() * 2) + 1;
        this.rootNode.addChild(testSkill);
        this.addObjectIntoMap(randomX, randomY, size, testSkill);

        this.gameController.bossCastSkill(randomX, randomY, size);
        // detroy test skill after 5 seconds
        setTimeout(() => {
            testSkill.destroy();
            // this.gridMap[randomX][randomY].object = null;
            // this.gameController.updateWalkable(randomX, randomY, true);
        }
        , 500);
    },

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
            let ratio = this.mapTileHeight / objectNode.height;

            objectNode.height = this.mapTileHeight * size;

            objectNode.width *= ratio * size;
        } else {
            objectNode.width = this.mapTileWidth * size;

            objectNode.height = this.mapTileHeight * size * (objectNode.width / this.mapTileWidth);
        }

        // set the position of the object
        const mapPos = this.mapLayout.node.getPosition();
        objectNode.x = mapPos.x + gridX * this.mapTileWidth + (this.mapTileWidth * size) / 2;
        objectNode.y = mapPos.y + gridY * this.mapTileHeight + (this.mapTileHeight * size) / 2;
    },

    updateWalkable(x, y, size) {
        if (this.gridMap[x][y].object === null) {
            if (size == 1) {
                // this.gridMap[gridX][y].walkable = false;
                this.gameController.updateWalkable(x, y, false);
            } {
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        this.gameController.updateWalkable(x + i, y + j, false);
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

            if (this.focusedHeroIndex == this.heroPrefabs.length) {
                this.focusedHeroIndex = 0;
            }

            this.gameController.setFocusedHero(this.focusedHeroIndex);
            this.gameController.listenKeyDown(this.gameController.getFocusedHero());
        }

        if (event.keyCode == cc.macro.KEY.j) {
            this.heroAttack();
            if (this.gameController.getWinner() != undefined && this.gameController.getWinner() != null) {
                this.endGameNotification();
                this.gameController.setWonMap();
                cc.director.pause();
                this.pauseButton.node.active = false;
            }
        }

        if (event.keyCode == cc.macro.KEY.k) {
            this.gameController.heroSkill();
            if (this.gameController.getWinner() != undefined && this.gameController.getWinner() != null) {
                console.log('skill')
                this.endGameNotification();
                this.gameController.setWonMap();
                cc.director.pause();
                this.pauseButton.node.active = false;
            }
        }

        if (event.keyCode == cc.macro.KEY.a || event.keyCode == cc.macro.KEY.d || event.keyCode == cc.macro.KEY.w || event.keyCode == cc.macro.KEY.s) {
            this.gameController.heroMoveAnimation(event.keyCode);
        }
    },

    heroSkill() {
        if (this.isCastingSkill) return;
        this.isCastingSkill = true;
        this.gameController.heroSkill();

        this.scheduleOnce(() => {
            this.isCastingSkill = false;
        }, this.gameController.getSkillCooldown()) // get cool down from hero
    },

    turnOnAutoBossAttack() {
        this.bossAutoAttack();
    },

    turnOnAutoSkill() {
        this.bossAutoSkill();
    },

    bossAutoAttack() {
        if (this.gameController.boss == undefined) {
            console.log("no boss node");
            return;
        }

        if (this.gameController.getWinner()) {
            this.endGameNotification();
            return;
        }

        if (cc.director.isPaused()) return;

        setTimeout(() => {
            if (this.gameController.getWinner() != undefined && this.gameController.getWinner() != null) {
                this.endGameNotification();
                return;
            } else {
                this.gameController.bossAttack();
                this.bossAutoAttack();
            }
        }, 1000);
    },

    bossAutoSkill() {
        console.log('boss auto skill')
        let delay = (Math.random() * 3000 + 1000) / this.mapIndex;
        if (this.gameController.boss == undefined) {
            console.log("no boss node");
            return;
        }

        if (this.gameController.getWinner()) {
            this.endGameNotification();
            return;
        }

        setTimeout(() => {
            if (!this.gameController.getWinner()) {
                this.gameController.bossCastSkill();
                this.spawnSkill();
                this.bossAutoSkill();
            } else {
                this.endGameNotification();
            }
        }, delay);
    },

    turnOnAutoMode() {    
        if (this.gameController.getWinner() != undefined && this.gameController.getWinner() != null) {
            this.gameController.setWonMap();
            this.endGameNotification();
            return;
        }

        // this.scheduleOnce(() => {
        //     this.gameController.moveHeroNotFocusesToBoss();
        //     this.gameController.nonFocusedHeroesAttackBoss();
        //     this.turnOnAutoMode();
        // }, 1)

        this.gameController.turnOnAutoMode();
    },

    heroAttack() {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.gameController.heroAttack();


        this.scheduleOnce(() => {
            this.isAttacking = false;
        }, this.gameController.getAttackCooldown()) // get cool down from hero
    },

    replayGame() {
        // if (cc.director.isPaused()) {
        //     cc.director.resume();
        // }

        // this.gameController.newGame();
        // this.node.destroy();

        cc.director.loadScene(GAME_SCENE.GAME)
    },

    newGame() {
        if (cc.director.isPaused()) {
            cc.director.resume();
        }
        // this.resetGame();
        this.gameController.newGame();
        // this.gameController.setFocusedHero(0);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAP_SELECT)
    },

    resetGame() {

        if (cc.director.isPaused()) {
            console.log('resume')
            cc.director.resume();
        }

        this.gameController.resetGame();
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME)
    },

    endGameNotification() {
        let winner = this.gameController.getWinner();
        // console.log()
        let notificationPanel = this.winnerNotificationLabel.node.parent;
        let notificationPanelBgSprite = notificationPanel.getComponent(cc.Sprite);
        if (winner == GAME_DATA.ROLE.PLAYER) {
            this.nextButton.node.active = true;
            notificationPanelBgSprite.spriteFrame = this.backgroundNotificationPanelSpriteFrames[0];

            // play sound effect win game, source 
            let audioSources = this.node.getComponents(cc.AudioSource)
            audioSources[0].play();
        } else {
            notificationPanelBgSprite.spriteFrame = this.backgroundNotificationPanelSpriteFrames[1];
            let audioSources = this.node.getComponents(cc.AudioSource)
            audioSources[1].play();
        }
        this.winnerNotificationLabel.string = winner;
        this.winnerNotificationLabel.node.parent.active = true;
 
        // cc.director.pause()
        this.pauseButton.node.active = false;
        this.resumeButton.node.active = false;
    },

    pauseGame() {
        cc.director.pause();
        this.pauseButton.node.active = false;
        this.resumeButton.node.active = true;
    },

    resumeGame() {
        cc.director.resume();
        this.pauseButton.node.active = true;
        this.resumeButton.node.active = false;
    },

    nextGame() {
        if (this.gameController.getWonMap() >= (this.backgroundSpriteFrames.length)) {
            this.nextButton.node.active = false;
          
            return;
        }
        if (cc.director.isPaused()) {
            console.log('resume')
            cc.director.resume();
        }

        this.gameController.resetGame();
        this.gameController.setMapPicked(this.mapIndex + 1);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME);
    },

});