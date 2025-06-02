import GameController from "./GameController";
import GAME_DATA from "./GameData"
import EventBus from "../EventBus";
import MapController from "./MapController";

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

        ultimateSprite: cc.Sprite,

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
        heroHpProgressBar: cc.ProgressBar,

        pausePanel: cc.Node,

        greenTilePrefab: cc.Prefab, // prefab for walkable tile
        greyTilePrefab: cc.Prefab,

        map1Objects: [cc.SpriteFrame],
        map2Objects: [cc.SpriteFrame],
        map3Objects: [cc.SpriteFrame],

        objectsJsonData: cc.JsonAsset,
        objectMapPrefab: cc.Prefab,
        groundSpriteFrame: [cc.SpriteFrame], // sprite frame for ground tile

        characterHolder: cc.Node,

        guideBook: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.guideBook.active = false
        this.gameController = GameController.getInstance();
        this.mapIndex = this.gameController.getMapPicked() ? this.gameController.getMapPicked() : 0;
        cc.director.getCollisionManager().enabled = true;
        this.heroHpProgressBar.progress = 1;

        // variables
        this.gridMap = [];
        this.isMoving = false;
        this.pressedKeys = new Set();

        this.focusedHeroIndex = -1;
        this.heroes = [];
        this.rootNode = this.characterHolder;
        this.bossNode = [];
        this.isCastingSkill = false;

        this.winnerNotificationLabel.node.parent.zIndex = 999;
        this.rootNode.sortAllChildren();

        this.gameController.gameScript = this;
        this.mapController = MapController.getInstance() || new MapController();


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

        this.mapLayout.node.x = -this.mapWidth * this.mapTileWidth / 2;
        this.mapLayout.node.y = -this.mapHeight * this.mapTileHeight / 2;

        // this.mapHeight
        this.gameController.setCallbacks(
            (playerTurn) => this.updatePlayerTurnLabel(playerTurn),
            (heroInfo, ultimateCooldown) => this.updateHeroInfoUI(heroInfo, ultimateCooldown),
            () => this.endGameNotification()
        )

        // this.mapIndex = 2;
    },

    start() {
        this.spawnObjectsFromJson();
        console.log('start game map picked',this.gameController.getMapPicked());
        this.initData();
        
        this.gameController.setHighlightTilePrefab(this.greenTilePrefab);
        this.gameController.setRootNode(this.rootNode);
        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        

        this.gameController.startGame();

    },

    initData() {
        this.initGridMap();

        this.heroPrefabs = this.gameController.getSelectedHeroPrefabs();

        this.mapIndex = this.gameController.getMapPicked() ? this.gameController.getMapPicked() : 0;
        
        this.backgroundSprite.spriteFrame = this.backgroundSpriteFrames[this.mapIndex];

        this.initMapView();

        if (this.heroPrefabs) this.spawnHero();

        this.ultimateGreyPrefab = cc.instantiate(this.greyTilePrefab);

        this.ultimateGreyPrefab.parent = this.ultimateCooldownLabel.node.parent;
    },

    onClickPanel(event) {
        event.stopPropagation();
    },

    spawnObjectsFromJson() {
        if (!this.objectsJsonData || !this.objectsJsonData.json) {
            console.error("No objects data found");
            return;
        }
        
        const jsonData = this.objectsJsonData.json.mapData[this.mapIndex];

        const mapObjects = jsonData.map;

        if (!Array.isArray(mapObjects)) {
            console.error("map1 must be a 2D array");
            return;
        }
        this.mapHeight = mapObjects.length;
        this.mapWidth = mapObjects[0].length;

        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.mapController.initMapSize(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);

        this.mapController.viewObjectsMap(mapObjects, this.mapWidth, this.mapHeight, this.map1Objects);
        let bossesIndex = jsonData.bosses;
        let bossesPosition = jsonData.bossesPosition;
        let bossesSize = jsonData.bossesSize;

        if (bossesIndex && bossesIndex.length > 0) {
            bossesIndex.forEach((bossIndex) => {
                this.bossNode[bossIndex] = cc.instantiate(this.bossPrefabs[bossIndex]);

                // this.spawnBoss(this.bossNode[bossIndex], bossesPosition[bossIndex], bossesSize[bossIndex]);
                this.mapController.spawnBossIntoMap(this.bossNode[bossIndex], bossesPosition[bossIndex], bossesSize[bossIndex]);
            })
        }
    },


    // update (dt) {},
    onDestroy() {
        // cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        EventBus.off(EventBus.events.CLICK_TO_MOVE, this.onClickToMove, this);
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

    updateHeroInfoUI(heroInfo, ultimateCooldown) {
        if (!heroInfo) {
            this.heroInfoPanel.active = false;
            return;
        }

        this.heroInfoPanel.active = true;

        this.heroNameLabel.string = heroInfo.name || '';
        this.heroHpLabel.string = heroInfo.health || '';

        this.heroImage.spriteFrame = heroInfo.imageSprite.spriteFrame || null;

        this.ultimateCooldownLabel.string = ultimateCooldown || '';

        ultimateCooldown > 0 ? this.ultimateGreyPrefab.active = true : this.ultimateGreyPrefab.active = false;

        this.ultimateSprite.spriteFrame = heroInfo.imageSprite ? heroInfo.imageSprite.spriteFrame : null;

        let hpPercentage = heroInfo.health / heroInfo.maxHp;
        this.heroHpProgressBar.progress = hpPercentage;
        // this.heroHpProgressBar.node.color = cc.Color.GREEN.lerp(cc.Color.RED, 1 - hpPercentage);
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

                // this.gameController.updateWalkable(i, j, 1, true);
            }
            this.gridMap.push(row);
        }
    },
    spawnHero() {
        this.mapController.spawnHeroIntoMap(this.heroPrefabs, this.focusEffectPrefab);
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
        while (!walkableMap[posX][posY]) {
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
        let mapController = this.mapController;
  
        let mapSize = {
            width: this.mapWidth,
            height: this.mapHeight,
        }

        let tileSize = {
            width: this.mapTileWidth,
            height: this.mapTileHeight,
        }
        mapController.viewMap(mapSize, tileSize, this.groundSpriteFrame);
       
        const firstCellPos = {
            x: this.mapLayout.node.x,
            y: this.mapLayout.node.y,
        };

        const lastCellPos = {
            x: this.mapLayout.node.x + this.mapWidth * this.mapTileWidth,
            y: this.mapLayout.node.y + this.mapHeight * this.mapTileHeight,
        };

        this.gameController.setCellPosition(firstCellPos, lastCellPos);
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
        this.gameController.resetGame();

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
        let notificationPanel = this.winnerNotificationLabel.node.parent;
        let notificationPanelBgSprite = notificationPanel.getComponent(cc.Sprite);
        if (winner == GAME_DATA.ROLE.PLAYER) {
            this.nextButton.node.active = true;
            // notificationPanelBgSprite.spriteFrame = this.backgroundNotificationPanelSpriteFrames[0];

            // play sound effect win game, source 
            let audioSources = this.node.getComponents(cc.AudioSource)
            audioSources[0].play();
        } else {
            // notificationPanelBgSprite.spriteFrame = this.backgroundNotificationPanelSpriteFrames[1];
            let audioSources = this.node.getComponents(cc.AudioSource)
            audioSources[1].play();
        }
        this.winnerNotificationLabel.string = winner;
        this.winnerNotificationLabel.node.parent.active = true;

        this.scheduleOnce(() => {
            cc.director.pause()
        }, 1.5);

        this.pauseButton.node.active = false;
        // this.resumeButton.node.active = false;
    },

    showGuideBook() {
        this.guideBook.active = true

    },
    closeGuideBook(){
        this.guideBook.active = false
    },


    pauseGame() {
        cc.director.pause();
        this.pausePanel.active = true;

        this.pauseButton.node.active = false;
        // this.resumeButton.node.active = true;
    },

    resumeGame() {
        cc.director.resume();
        this.pausePanel.active = false;
        this.pauseButton.node.active = true;
        // this.resumeButton.node.active = false;
    },

    nextGame() {
        if (this.mapIndex >= this.backgroundSpriteFrames.length - 1) {
            console.warn('No more maps to play');
            return;
        }

        if (this.gameController.getWonMap() >= (this.backgroundSpriteFrames.length)) {
            this.nextButton.node.active = false;

            return;
        }
        if (cc.director.isPaused()) {
            console.log('resume')
            cc.director.resume();
        }

        this.gameController.resetGame();
        this.gameController.setWonMap();
        this.gameController.setMapPicked(this.mapIndex + 1);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME);
    },

});
