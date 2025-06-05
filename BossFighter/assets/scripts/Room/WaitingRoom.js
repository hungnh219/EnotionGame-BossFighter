import SocketIOManager from "../SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        prefabPlayer: cc.Prefab,
        gridPlayer: cc.Node,
        roomNameLabel: cc.Label,
        totalPlayersLabel: cc.Label,
        startButton: cc.Node,
    },

    socketIOManager: null,
    currentRoomData: null,

    onLoad() {
        this.startButton.active = false
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }

        this.socketIOManager.listenGameStart((data) => {
            console.log("WaitingRoom: Nhận được sự kiện bắt đầu trò chơi từ máy chủ.", data);
            cc.director.loadScene("HeroSelect");
        })
    },

    start() {
        this.socketIOManager.setOnRoomInfoReceivedCallback(this.onRoomInfoReceived.bind(this));

        this.socketIOManager.getRoomInformation();

        this.socketIOManager.listenGameStart(() => {
            console.log("Trò chơi đã bắt đầu, chuyển đến HeroSelect scene.");
            this.moveToSelectScene();
        });
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

        if (foundRoomName) {
            this.currentRoomName = foundRoomName
            this.roomNameLabel.string = `Phòng: ${foundRoomName}`;
            this.totalPlayersLabel.string = `Người chơi: ${roomMembers.length}/${maxPlayer}`;

            this.startButton.active = isCurrentPlayerHost;
            console.log("Nut Start active state:", this.startButton.active, "(Current player is host:", isCurrentPlayerHost + ")");

            this.gridPlayer.removeAllChildren();
            for (const playerObj of roomMembers) {
                const playerId = Object.keys(playerObj)[0];
                const playerInfo = playerObj[playerId];

                const playerNode = cc.instantiate(this.prefabPlayer);
                const labelNode = playerNode.getChildByName("New Label");
                const labelComp = labelNode.getComponent(cc.Label);
                labelComp.string = `${playerInfo.name}`;
                this.gridPlayer.addChild(playerNode);
            }
        } else {
            this.roomNameLabel.string = "Không tìm thấy thông tin phòng.";
            this.totalPlayersLabel.string = "";
            this.gridPlayer.removeAllChildren();
            this.startButton.active = false;
        }
    },

    startGame() {
        if (!this.currentRoomData) {
            console.error("Không có thông tin phòng để bắt đầu trò chơi.");
            return;
        }

        this.socketIOManager.gameStart();
    },

    async leaveRoom() {
        console.log('currentNameRoom', this.currentRoomName)
        try {
            const result = await this.socketIOManager.leaveRoom(this.currentRoomName)
            if (result.success) {
                cc.director.loadScene('RoomSelect');
            } else {
                console.warn(result.message);
            }
        } catch (error) {
            console.error("Lỗi khi rời phòng:", error);
        }

    }



});