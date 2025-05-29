import GameController from "./GameController";
import GAME_DATA from "./GameData"
import EventBus from "../EventBus";

cc.Class({
    extends: cc.Component,

    properties: {
        mapHeight: cc.Integer,
        mapWidth: cc.Integer,
        // mapTile: cc.SpriteFrame,
        mapTileWidth: cc.Integer,
        mapTileHeight: cc.Integer,
        // mapTileSize: cc.Integer,

        playerTurn: cc.Label,
        bossTurn: cc.Label,

        attackCooldownLabel: cc.Label,
        skillCooldownLabel: cc.Label,
        ultimateCooldownLabel: cc.Label,

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

        resumeButton: cc.Button,
        pauseButton: cc.Button,
        nextButton: cc.Button,
        heroPrefabs: [cc.Prefab],

        heroInfoPanel: cc.Node,
        heroNameLabel: cc.Label,
        heroHpLabel: cc.Label,
        heroImage: cc.Sprite,

        greenTilePrefab: cc.Prefab, // prefab for walkable tile

        map1Objects: [cc.SpriteFrame],
        map2Objects: [cc.SpriteFrame],
        map3Objects: [cc.SpriteFrame],

        objectsJsonData: cc.JsonAsset,
        objectMapPrefab: cc.Prefab,
        groundSpriteFrame: [cc.SpriteFrame], // sprite frame for ground tile

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {

        cc.director.getCollisionManager().enabled = true;

        // variables
        this.gridMap = [];
        this.isMoving = false;
        this.pressedKeys = new Set();
        this.gameController = GameController.getInstance();
        // this.gameController.setTileSize(this.mapTileWidth, this.mapTileHeight)
        this.focusedHeroIndex = -1;
        this.heroes = [];
        this.rootNode = this.node.parent;
        this.bossNode = null;
        // this.heroPrefabs = [];
        this.isCastingSkill = false;

        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        // test add boss into map
        this.winnerNotificationLabel.node.parent.zIndex = 999;
        this.rootNode.sortAllChildren();

        this.gameController.gameScript = this;


        EventBus.on(EventBus.events.CLICK_TO_MOVE, (node) => {
            this.heroClick(node);   
        }, this);

        EventBus.on(EventBus.events.BOSS2_SPAWN_ENEMY, () => {
            let ranNum = Math.floor(Math.random() * this.bossPrefabs.length);
            let ranBoss = cc.instantiate(this.bossPrefabs[ranNum]);

            this.spawnEnemy(ranBoss);
        }, this);


        this.mapLayout.node.on(cc.Node.EventType.TOUCH_END, (event) => {
            EventBus.emit(EventBus.events.CLEAR_WALKABLE_AREA);
        }, this);

       
    },

    start() {
        

        this.initData();
        this.spawnObjectsFromJson();
        
        this.gameController.setHighlightTilePrefab(this.greenTilePrefab);
        this.gameController.setRootNode(this.rootNode);
        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.gameController.setCallbacks(
            (playerTurn) => this.updatePlayerTurnLabel(playerTurn),
            () => {},
            () => this.endGameNotification()
        )

        this.gameController.startGame();
    },

    onClickPanel(event) {
        event.stopPropagation();
    },

    spawnObjectsFromJson() {
        if (!this.objectsJsonData || !this.objectsJsonData.json) {
            console.error("No objects data found");
            return;
        }

        const mapObjects = this.objectsJsonData.json.map1;

        if (!Array.isArray(mapObjects)) {
            console.error("map1 must be a 2D array");
            return;
        }

        for (let i = 0; i < mapObjects.length; i++) {
            for (let j = 0; j < mapObjects[i].length; j++) {
                let newI = mapObjects.length - 1 - i;

                const objectId = mapObjects[newI][j];

                if (objectId === 0) {
                    continue;
                }

                const spriteFrame = this.map1Objects[objectId];
                if (!spriteFrame) {
                    console.warn(`No spriteFrame found for object ID: ${objectId}`);
                    continue;
                }

                const prefab = cc.instantiate(this.objectMapPrefab);

                const sprite = prefab.getComponent(cc.Sprite);
                if (sprite) {
                    sprite.spriteFrame = spriteFrame;
                }
                this.rootNode.addChild(prefab);
                this.addObjectIntoMap(j, i, 1, prefab);
                this.gameController.updateWalkable(j, i, 1, false);
            }
        }
    },


    // update (dt) {},
    onDestroy() {
        // cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        EventBus.off(EventBus.events.CLICK_TO_MOVE, this.onClickToMove, this);
    },

    initData() {
        this.initGridMap();

        // this.heroPrefabs = this.gameController.getHeroPrefabs();
        this.heroPrefabs.forEach((heroPrefab, index) => {
            // console.log('heroPrefab', heroPrefab);
            if (heroPrefab) {
                this.gameController.addSelectedHeroPrefab(heroPrefab);
            }
        });

        this.mapIndex = 2;
        this.tileSpriteFrame = this.tileSpriteFrames[this.mapIndex];
        this.backgroundSprite.spriteFrame = this.backgroundSpriteFrames[this.mapIndex];

        this.initMapView();

        if (this.heroPrefabs) this.spawnHero();
        this.spawnBoss();
        // this.gameController.startPlayerTurn();
    },

    heroClick(node) {
        this.gameController.heroClick(node);
    },
    updateCooldownUI(hero) {
        if (!hero || !hero.mainScript) return;

        this.attackCooldownLabel.string = `Attack CD: ${hero.mainScript.attackCooldownRemaining}`;
        this.skillCooldownLabel.string = `Skill CD: ${hero.mainScript.skillCooldownRemaining}`;
        this.ultimateCooldownLabel.string = `Ultimate CD: ${hero.mainScript.ultimateCooldownRemaining}`;
    },

    updatePlayerTurnLabel(playerTurnCount) {
        if (this.playerTurn) {
            this.playerTurn.string = playerTurnCount;
        }
    },

    // updateBossTurnLabel(points) {
    //     if (this.bossTurn) {
    //         this.bossTurn.string = points;
    //     }
    // },

    updateHeroInfoUI(hero) {
        if (!hero) {
            this.heroInfoPanel.active = false;
            return;
        }

        this.heroInfoPanel.active = true;

        const heroScript = hero.getComponents(cc.Component).find(c => typeof c.getCharacterInfo === 'function');

        if (heroScript && typeof heroScript.getCharacterInfo === 'function') {
            const info = heroScript.getCharacterInfo();

            this.heroNameLabel.string = info.name || '';
            this.heroHpLabel.string = `${heroScript.getCurrentHp()} / ${info.health}`;
            this.heroImage.spriteFrame = info.imageSprite ? info.imageSprite.spriteFrame : null;
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

                this.gameController.updateWalkable(j, i, 1, true);
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
            // this.updateWalkable(index, 0, 1);
            this.gameController.updateWalkable(index, 0, 1, false);

            this.heroes.push(prefabNode)
        });

        this.focusedHeroIndex = 0;
        this.gameController.setFocusedHero(this.focusedHeroIndex);
        // this.gameController.listenKeyDown(this.gameController.getFocusedHero());
    },

    spawnBoss() {
        const size = 2;

        const posX = this.mapWidth - 3;
        const posY = this.mapHeight - 3;

        this.bossNode = cc.instantiate(this.bossPrefabs[this.mapIndex]);
        this.gameController.addBoss(this.bossNode, size);

        // scale boss to 1.5 if size > 1
        if (size == 1) {
            this.bossNode.scale = 1;
        } else if (size > 1) {
            this.bossNode.scale = 1.5;

            // if (this.mapIndex == 2) {
            //     this.bossNode.scale = 1;
            // }
        } else if (size > 3) {
            this.bossNode.scale = 2;
        }


        this.rootNode.addChild(this.bossNode);


        this.addObjectIntoMap(posX, posY, 2, this.bossNode);
        // this.updateWalkable(posX, posY, size, false);
        this.gameController.updateWalkable(posX, posY, size, false);
    },

    // enemy always has size = 1
    spawnEnemy(enemy) {

        if (!enemy) {
            console.error("No enemy to spawn");
            return;
        }

        let posX = Math.floor(Math.random() * this.mapWidth);
        let posY = Math.floor(Math.random() * this.mapHeight);

        let walkableMap = this.gameController.getWalkableMap();
        while(!walkableMap[posX][posY]) {
            posX = Math.floor(Math.random() * this.mapWidth);
            posY = Math.floor(Math.random() * this.mapHeight);
        }

        this.rootNode.addChild(enemy);

        this.gameController.setNewEmemy(enemy);
        this.addObjectIntoMap(posX, posY, 1, enemy);
        this.gameController.updateWalkable(posX, posY, 1, false);
        // this.updateWalkable(posX, posY, size);
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
                // let newI = this.mapWidth - 1 - i;

                let tileNode = new cc.Node();
                let sprite = tileNode.addComponent(cc.Sprite);
                // sprite.spriteFrame = this.tileSpriteFrame;

                if (i == 0 && j == 0) {
                    sprite.spriteFrame = this.groundSpriteFrame[7];
                } else if (i == 0 && j == this.mapHeight - 1) {
                    // sprite.spriteFrame = this.groundSpriteFrame[7];
                    sprite.spriteFrame = this.groundSpriteFrame[6];
                }
                else if (i == this.mapWidth - 1 && j == 0) {

                    sprite.spriteFrame = this.groundSpriteFrame[4];
                } else if (i == this.mapWidth - 1 && j == this.mapHeight - 1) {

                    sprite.spriteFrame = this.groundSpriteFrame[5];
                } else if (i == Math.floor(this.mapWidth / 2) && j == this.mapHeight - 1) {
                    sprite.spriteFrame = this.groundSpriteFrame[8];
                } else if (i == 0) {
                    // set left tile
                    sprite.spriteFrame = this.groundSpriteFrame[1];
                } else if (i == this.mapWidth - 1) {
                    // set right tile
                    sprite.spriteFrame = this.groundSpriteFrame[3];
                } else if (j == 0) {
                    // set top tile
                    sprite.spriteFrame = this.groundSpriteFrame[0];
                } else if (j == this.mapHeight - 1) {
                        // set bottom tile
                        sprite.spriteFrame = this.groundSpriteFrame[2];
                } else {
                    // set ground tile
                    sprite.spriteFrame = this.tileSpriteFrame;
                }

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

    heroAttack() {
        this.gameController.heroAttack();
    },

    heroUltimate() {
        this.gameController.heroUltimate();
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

        cc.director.pause()
        this.pauseButton.node.active = false;
        // this.resumeButton.node.active = false;
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