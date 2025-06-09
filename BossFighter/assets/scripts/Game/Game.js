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

    onLoad() {
        console.log('messageItem', this.messageItem)
        this.scrollViewContent.removeAllChildren();
        this.guideBook.active = false
        this.gameController = GameController.getInstance();
        this.mapIndex = this.gameController.getMapPicked() ? this.gameController.getMapPicked() : 0;
        cc.director.getCollisionManager().enabled = true;
        this.heroHpProgressBar.progress = 1;

        // variables
        this.pressedKeys = new Set();

        this.focusedHeroIndex = -1;
        this.rootNode = this.characterHolder;
        this.bossNode = [];

        this.winnerNotificationLabel.node.parent.zIndex = 999;
        this.rootNode.sortAllChildren();

        this.gameController.gameScript = this;
        this.mapController = MapController.getInstance() || new MapController();
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();

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

        this.mapLayout.node.x = -this.mapWidth * this.mapTileWidth / 2;
        this.mapLayout.node.y = -this.mapHeight * this.mapTileHeight / 2;

        // this.mapHeight
        this.gameController.setCallbacks(
            (playerTurn) => this.updatePlayerTurnLabel(playerTurn),
            (heroInfo, ultimateCooldown) => this.updateHeroInfoUI(heroInfo, ultimateCooldown),
            () => this.endGameNotification()
        )

        // this.mapIndex = 2;

        this.socketIOManager.game.receiveGameMessages(this.onMessageReceived.bind(this));

        this.textMessageInput.node.on('editing-did-ended', this.onEditingEnded, this);
    },

    async start() {
        this.socketIOManager.room.setOnRoomInfoReceivedCallback(this.onRoomInfoReceived.bind(this));
        this.socketIOManager.room.getRoomInformation();
        this.mapData = await this.socketIOManager.game.getMapData();
        // this.mapData = this.mapData.map;
        console.log('Map Data:', this.mapData);
        this.lockedHeroData = await this.socketIOManager.game.getLockedHeroIndex();
        this.playerIndex = await this.socketIOManager.game.getPlayerOrder();

        

        this.socketIOManager.game.listenOtherAttack((data) => {
            this.gameController.heroAttackFromServer(data.playerOrder, data.targetOrder, data.isBoss);
                
        })
        this.socketIOManager.game.listenNextMap(() => {
            this.nextMapServer();
        });
        this.socketIOManager.game.listenBossDie(() => {
            this.endGameNotification();
        })
        if (this.playerIndex != undefined) {
            this.gameController.setPlayerIndex(this.playerIndex);
        }
        this.spawnObjectsFromJson();
        this.initData();
        this.gameController.setHighlightTilePrefab(this.greenTilePrefab);
        this.gameController.setRootNode(this.rootNode);
        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.mapIndex = this.gameController.getMapPicked() ? this.gameController.getMapPicked() : 0;
        this.heroPrefabs = this.gameController.getSelectedHeroPrefabs();

        this.gameController.startGame(this.socketIOManager);

    },

    onMessageReceived(data) {
        console.log('GAME: Nhận tin nhắn từ server:', data);
        console.log('messageItem',this.messageItem)
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
        console.log('scrollView', scrollView)
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
        console.log("WaitingRoom: Thông tin phòng đã nhận được (onRoomInfoReceived):", data);
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

            console.log('room player', room.players)

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

        console.log('roomMembers', roomMembers)
        console.log('foundRoomName',foundRoomName)

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
    

    initData() {
        this.backgroundSprite.spriteFrame = this.backgroundSpriteFrames[this.mapIndex];

        this.initMapView();
        this.spawnHero();

        this.ultimateGreyPrefab = cc.instantiate(this.greyTilePrefab);
        this.ultimateGreyPrefab.parent = this.ultimateCooldownLabel.node.parent;
        this.initLeaderBoard();
    },

    onClickPanel(event) {
        event.stopPropagation();
    },

    spawnObjectsFromJson() {
        if (!this.objectsJsonData || !this.objectsJsonData.json) {
            console.error("No objects data found");
            return;
        }
        
        // const jsonData = this.objectsJsonData.json.mapData[this.mapIndex];

        // const mapObjects = jsonData.map;
        console.log("Map Data:", this.mapData, this.mapData.bossesPosition);
        const mapObjects = this.mapData.map;

        if (!Array.isArray(mapObjects)) {
            console.error("map1 must be a 2D array");
            return;
        }

        // mapHeight and mapWidth are read from json
        this.mapHeight = mapObjects.length;
        this.mapWidth = mapObjects[0].length;
        this.gameController.setMapSetting(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.mapController.initMapSize(this.mapHeight, this.mapWidth, this.mapTileWidth, this.mapTileHeight);
        this.mapController.viewObjectsMap(mapObjects, this.mapWidth, this.mapHeight, this.map1Objects);
        let bossesIndex = this.mapData.bosses;
        let bossesPosition = this.mapData.bossesPosition;

        if (bossesIndex && bossesIndex.length > 0) {
            bossesIndex.forEach((bossIndex) => {
                this.bossNode[bossIndex] = cc.instantiate(this.bossPrefabs[bossIndex]);

                console.log('Boss Node:', this.bossNode[bossIndex], bossesPosition[0]);
                this.mapController.spawnBossIntoMap(this.bossNode[bossIndex], bossesPosition[0], 1);
            })
        }
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
        console.log('lockedHeroData', this.lockedHeroData);
        this.lockedHeroData.forEach((heroData) => {
            if (heroData.lockedHero >= 0 && heroData.lockedHero < this.heroPrefabs.length) {
                // heroPrefabs.push(cc.instantiate(this.heroPrefabs[heroIndex]));
                // heroPrefabs.push(this.heroPrefabs[heroData.lockedHero]);
                // console.log('Hero Prefab:', this.heroPrefabs[heroData.lockedHero]);
                heroPrefabs.push(this.heroPrefabs[heroData.lockedHero]);
            } else {
                console.warn(`Hero index ${heroIndex} is out of bounds for heroPrefabs array`);
            }
        })
        
        let focusEffectPrefab = this.focusEffectPrefab;
        if (!heroPrefabs || heroPrefabs.length === 0) {
            console.warn('No hero prefabs found to spawn');
            return;
        }

        this.mapController.spawnHeroIntoMap(heroPrefabs, focusEffectPrefab, this.lockedHeroData);
    },

    // enemy always has size = 1
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

        // handle quit game
        // this.socketIOManager.game.quitGame();

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

    endGameNotification() {

        let winner = this.gameController.getWinner();
        let notificationPanel = this.winnerNotificationLabel.node.parent;
        let notificationPanelBgSprite = notificationPanel.getComponent(cc.Sprite);
        if (winner == GAME_DATA.ROLE.PLAYER) {
            this.nextButton.node.active = true;
            let audioSources = this.node.getComponents(cc.AudioSource)
            audioSources[0].play();
        } else {
            let audioSources = this.node.getComponents(cc.AudioSource)
            audioSources[1].play();
        }
        this.winnerNotificationLabel.string = winner;
        this.winnerNotificationLabel.node.parent.active = true;

        this.scheduleOnce(() => {
            cc.director.pause()
        }, 1.5);

        this.pauseButton.node.active = false;
    },

    showGuideBook() {
        this.guideBook.active = true

    },
    closeGuideBook(){
        this.guideBook.active = false
    },


    pauseGame() {
        // cc.director.pause();
        this.pausePanel.active = true;

        this.pauseButton.node.active = false;
    },

    resumeGame() {
        cc.director.resume();
        this.pausePanel.active = false;
        this.pauseButton.node.active = true;
    },

    nextGame() {
        this.socketIOManager.game.nextMap();
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
        this.gameController.setWonMap();
        this.gameController.setMapPicked(this.mapIndex + 1);
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME);
    },

    async initLeaderBoard() {
        let leaderBoardData = await this.socketIOManager.game.getLeaderBoard();
        leaderBoardData.forEach((data) => {
            // create new label and add to leaderBoard node
            let label = new cc.Node().addComponent(cc.Label);
            label.string = `${data.playerName}: ${data.totalScore}`;
            label.fontSize = 20;
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
            label.fontSize = 20;
            label.node.color = cc.Color.GREEN;
            label.node.parent = this.leaderBoard;
        });

    },

});
