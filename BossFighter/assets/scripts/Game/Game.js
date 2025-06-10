import GameController from "./GameController";
import GAME_DATA from "./GameData"
import EventBus from "../EventBus";
import MapController from "./MapController";
import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        mapHeight: cc.Integer,
        mapWidth: cc.Integer,
        mapTileWidth: cc.Integer,
        mapTileHeight: cc.Integer,

        playerTurn: cc.Label,

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

        guideBook: cc.Node,

        leaderBoard: cc.Node,

        scrollViewContent: cc.Node,
        messageItem: cc.Prefab,
        textMessageInput: cc.EditBox,
    },

    // LIFE-CYCLE CALLBACKS:

    async onLoad() {
        this.gameController = GameController.getInstance() || new GameController();
        this.mapController = MapController.getInstance() || new MapController();
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        cc.director.getCollisionManager().enabled = true;

        // this.rootNode.sortAllChildren();
        this.rootNode = this.characterHolder;
        this.bossNode = [];
        this.ultimateGreyPrefab = cc.instantiate(this.greyTilePrefab);
        this.ultimateGreyPrefab.parent = this.ultimateCooldownLabel.node.parent;
    },

    start() {
        this.initData();
        this.listenEvent();
    },

    async initData() {
        await this.socketIOManager.game.initializeGame();

        this.mapIndex = await this.socketIOManager.game.getMapIndex();
        if (this.mapIndex == undefined) {
            this.mapIndex = 0;
        }

        this.guideBook.active = false
        this.heroHpProgressBar.progress = 1;

        this.gameController.setCallbacks(
            (playerTurn) => this.updatePlayerTurnLabel(playerTurn),
            (heroInfo, ultimateCooldown) => this.updateHeroInfoUI(heroInfo, ultimateCooldown),
            () => this.endGameNotification()
        )

        // chat
        this.scrollViewContent.removeAllChildren();
        this.socketIOManager.game.receiveGameMessages(this.onMessageReceived.bind(this));
        this.textMessageInput.node.on('editing-did-ended', this.onEditingEnded, this);

        // onload end
        this.mapData = await this.socketIOManager.game.getMapData();
        this.heroes = await this.socketIOManager.game.getHeroes();
        this.bosses = await this.socketIOManager.game.getBosses();
        
        this.playerIndex = await this.socketIOManager.game.getPlayerOrder();
        if (this.playerIndex != undefined) {
            this.gameController.setPlayerIndex(this.playerIndex);
        }

        await this.spawnObjectsFromJson();
        
        this.initLeaderBoard();

        this.gameController.setHighlightTilePrefab(this.greenTilePrefab);
        this.gameController.setRootNode(this.rootNode);
        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.gameController.startGame(this.socketIOManager);

        // chat
        this.socketIOManager.room.setOnRoomInfoReceivedCallback(this.onRoomInfoReceived.bind(this));
        this.socketIOManager.room.getRoomInformation();
    },
    
    listenEvent() {
        EventBus.on(EventBus.events.CLICK_TO_MOVE, (node) => {
            this.heroClick(node);
        }, this);

        EventBus.on(EventBus.events.BOSS2_SPAWN_ENEMY, () => {
            let ranNum = Math.floor(Math.random() * this.bossPrefabs.length);
            let ranBoss = cc.instantiate(this.bossPrefabs[ranNum]);

            this.spawnEnemy(ranBoss);
        }, this);

        EventBus.on(EventBus.events.UPDATE_LEADER_BOARD, () => {
            this.updateLeaderBoard();
        }, this);

        this.mapLayout.node.on(cc.Node.EventType.TOUCH_END, (event) => {
            EventBus.emit(EventBus.events.CLEAR_WALKABLE_AREA);
        }, this);

        this.socketIOManager.game.listenOtherAttack((data) => {
            this.gameController.heroAttackFromServer(data.playerOrder, data.targetOrder, data.isBoss);
        })
        this.socketIOManager.game.listenBossAttack((data) => {
            this.gameController.bossAttackFromServer(data.bossId, data.heroId);
        })
        this.socketIOManager.game.listenNextMap(() => {
            this.nextMapServer();
        });
        this.socketIOManager.game.listenBossDie(() => {
            // this.endGameNotification();
        })
        this.socketIOManager.game.listenCharacterDeath((data) => {
            this.gameController.handleCharacterDeath(data.characterId);
        })
        this.socketIOManager.game.listenGameOver((data) => {
            console.log("Game over received from server:", data);
            this.endGameNotification(data.result);
        });
    },

    // onClickPanel(event) {
    //     event.stopPropagation();
    // },

    spawnObjectsFromJson() {
        if (!this.objectsJsonData || !this.objectsJsonData.json) {
            console.error("No objects data found");
            return;
        }
        
        const mapObjects = this.mapData.map;

        if (!Array.isArray(mapObjects)) {
            console.error("map1 must be a 2D array");
            return;
        }

        // config map 
        this.mapHeight = mapObjects.length;
        this.mapWidth = mapObjects[0].length;
        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.mapController.initMapSize(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);

        // map view
        this.initMapView();
        this.backgroundSprite.spriteFrame = this.backgroundSpriteFrames[this.mapIndex];

        // add object
        this.mapController.viewObjectsMap(mapObjects, this.mapWidth, this.mapHeight, this.map1Objects);
        
        // add boss
        let bossesPosition = this.mapData.bossesPosition;
        for (let i = 0; i < this.bosses.length; i++) {
            if (this.bosses[i]) {
                this.bossNode[i] = cc.instantiate(this.bossPrefabs[i]);
                this.bossNode[i].mainScript = this.bossNode[i].getComponents(cc.Component).find(c => typeof c.initData === 'function');
                if (this.bossNode[i].mainScript) {
                    this.bossNode[i].mainScript.initData(this.bosses[i]);
                }
                this.mapController.spawnBossIntoMap(this.bossNode[i], bossesPosition[i], 1);
            } else {
                console.warn(`Boss at index ${i} is not defined`);
            }
        }

        // add hero
        this.spawnHero();
    },

    // update (dt) {},
    onDestroy() {
        // cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        EventBus.off(EventBus.events.CLICK_TO_MOVE, this.onClickToMove, this);
    },

    heroClick(node) {
        let currentHero = this.gameController.getPlayerByIndex(this.playerIndex);
        if (node != currentHero) {
            console.warn("Clicked node is not the current hero");
            return;
        }

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
    },

    spawnHero() {
        let heroPrefabs = [];
        if (!this.heroPrefabs || this.heroPrefabs.length === 0) {
            console.warn('No hero prefabs found to spawn');
            return;
        }

        this.heroes.forEach((hero) => {
            if (hero.lockedHero >= 0 && hero.lockedHero < this.heroPrefabs.length) {
                heroPrefabs.push(this.heroPrefabs[hero.lockedHero]);
            } else {
                console.warn(`Hero index ${heroIndex} is out of bounds for heroPrefabs array`);
            }
        })
        
        let focusEffectPrefab = this.focusEffectPrefab;
        if (!heroPrefabs || heroPrefabs.length === 0) {
            console.warn('No hero prefabs found to spawn');
            return;
        }

        this.mapController.spawnHeroIntoMap(heroPrefabs, focusEffectPrefab, this.heroes);
    },

    spawnEnemy(enemy) {
        this.mapController.spawnEnemyIntoMap(enemy);
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
        mapController.setCellPosition();
    },

    heroAttack() {
        EventBus.emit(EventBus.events.CLEAR_WALKABLE_AREA);
        this.gameController.heroAttack();
        EventBus.emit(EventBus.events.PREVENT_DRAG);
    },

    heroUltimate() {
        EventBus.emit(EventBus.events.CLEAR_WALKABLE_AREA);
        this.gameController.heroUltimate();
        EventBus.emit(EventBus.events.PREVENT_DRAG);
    },

    replayGame() {
        this.gameController.resetGame();

        cc.director.loadScene(GAME_SCENE.GAME)
    },

    quitGame() {
        if (cc.director.isPaused()) {
            cc.director.resume();
        }

        this.socketIOManager.game.quitGame();

        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAIN_MENU)
    },

    resetGame() {
        if (cc.director.isPaused()) {
            console.log('resume')
            cc.director.resume();
        }

        this.gameController.resetGame();
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME)
    },

    endGameNotification(result) {
        // let winner = this.gameController.getWinner();
        // if (winner == GAME_DATA.ROLE.PLAYER) {
        //     this.nextButton.node.active = true;
        //     let audioSources = this.node.getComponents(cc.AudioSource)
        //     audioSources[0].play();
        // } else {
        //     let audioSources = this.node.getComponents(cc.AudioSource)
        //     audioSources[1].play();
        // }
        this.winnerNotificationLabel.string = result;
        this.winnerNotificationLabel.node.parent.active = true;
        this.winnerNotificationLabel.node.active = true;

        this.pauseButton.node.active = false;

        this.scheduleOnce(() => {
            cc.director.loadScene("ScoreTable")
        }, 2);
    },

    showGuideBook() {
        this.guideBook.active = true

    },
    closeGuideBook(){
        this.guideBook.active = false
    },


    pauseGame() {
        this.pausePanel.active = true;

        this.pauseButton.node.active = false;
    },

    resumeGame() {
        cc.director.resume();
        this.pausePanel.active = false;
        this.pauseButton.node.active = true;
    },

    nextGame() {
        // this.socketIOManager.game.nextMap();
    },

    nextMapServer() {
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
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME);
    },

    async initLeaderBoard() {
        this.leaderBoard.removeAllChildren();

        let leaderBoardData = await this.socketIOManager.game.getLeaderBoard();
        leaderBoardData.forEach((data) => {
            // create new label and add to leaderBoard node
            let label = new cc.Node().addComponent(cc.Label);
            label.string = `${data.playerName}: ${data.totalScore}`;
            label.fontSize = 40;
            label.node.color = cc.Color.GREEN;
            label.node.parent = this.leaderBoard;
        })
    },
    
    async updateLeaderBoard() {
        let newLeaderBoard = await this.socketIOManager.game.getLeaderBoard();

        this.leaderBoard.removeAllChildren();
        newLeaderBoard.forEach((data) => {
            let label = new cc.Node().addComponent(cc.Label);
            label.string = `${data.playerName}: ${data.totalScore}`;
            label.fontSize = 40;
            label.node.color = cc.Color.GREEN;
            label.node.parent = this.leaderBoard;
        });

    },

    // chat
    onMessageReceived(data) {
        if (data.success) {
            const messageNode = cc.instantiate(this.messageItem);
            const messageLabel = messageNode.getComponent(cc.Label);
            const playerName = messageNode.getChildByName('New Label')
            const nameLabel = playerName.getComponent(cc.Label)
            nameLabel.string = data.senderName;
            messageLabel.string = data.text;

            this.scrollViewContent.insertChild(messageNode, 0); 

            this.scrollToBottom();

        } else {
            console.error("Lỗi tin nhắn từ server:", data.message);
        }
    },

    scrollToBottom() {
        const scrollView = this.scrollViewContent.parent.parent.getComponent(cc.ScrollView)
        scrollView.scrollToBottom(0.1); 
    },

    async onEditingEnded() {
        const inputText = this.textMessageInput.string.trim();
        cc.log(inputText);
        if (!inputText) {
            cc.warn("Tin nhắn trống, không gửi.");
            return;
        }

        try {
            await this.socketIOManager.game.sendGameMessage(this.currentRoomName, inputText);
            this.textMessageInput.string = '';
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error);
        }

    },

    onRoomInfoReceived(data) {
        this.currentRoomData = data;
        this.updateRoomUI();
    },

    updateRoomUI() {
        if (!this.currentRoomData) return;

        const currentPlayerSocketId = this.socketIOManager.getSocketIO().id;
        let foundRoomName = '';
        let roomMembers = [];
        let maxPlayer = 0;
        let isCurrentPlayerHost = false;


        for (const room of this.currentRoomData.rooms) {
            const playerInThisRoom = room.players.find(playerObj => Object.keys(playerObj)[0] === currentPlayerSocketId);

            if (playerInThisRoom) {
                foundRoomName = room.roomName;
                roomMembers = room.players;
                maxPlayer = room.maxPlayer
                const currentPlayerData = playerInThisRoom[currentPlayerSocketId];
                isCurrentPlayerHost = currentPlayerData.host === true;
                break;
            }
        }

        if (foundRoomName) {
            this.currentRoomName = foundRoomName
            // this.roomNameLabel.string = `Phòng: ${foundRoomName}`;
            // this.totalPlayersLabel.string = `Người chơi: ${roomMembers.length}/${maxPlayer}`;

            // this.startButton.active = isCurrentPlayerHost;
            // console.log("Nut Start active state:", this.startButton.active, "(Current player is host:", isCurrentPlayerHost + ")");

            // this.gridPlayer.removeAllChildren();
            // for (const playerObj of roomMembers) {
            //     const playerId = Object.keys(playerObj)[0];
            //     const playerInfo = playerObj[playerId];

            //     const playerNode = cc.instantiate(this.prefabPlayer);
            //     const labelNode = playerNode.getChildByName("New Label");
            //     const labelComp = labelNode.getComponent(cc.Label);
            //     labelComp.string = `${playerInfo.name}`;
            //     this.gridPlayer.addChild(playerNode);
            // }
        } else {
            // this.roomNameLabel.string = "Không tìm thấy thông tin phòng.";
            // this.totalPlayersLabel.string = "";
            // this.gridPlayer.removeAllChildren();
            // this.startButton.active = false;
        }
    },

});