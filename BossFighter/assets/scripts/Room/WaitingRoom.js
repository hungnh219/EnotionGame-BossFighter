import SocketIOManager from "../SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        prefabPlayer: cc.Prefab,
        gridPlayer: cc.Node,
        roomNameLabel: cc.Label,
        totalPlayersLabel: cc.Label,
    },

    socketIOManager: null,
    currentRoomData: null,

    onLoad() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }
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

        const playerSocketId = this.socketIOManager.getSocketIO().id;
        let foundRoomName = '';
        let roomMembers = [];

        for (const room of this.currentRoomData.rooms) {
            const playerInThisRoom = room.players.find(playerObj => Object.keys(playerObj)[0] === playerSocketId);

            if (playerInThisRoom) {
                foundRoomName = room.roomName;
                roomMembers = room.players;
                break;
            }
        }

        console.log('roomMembers', roomMembers)

        if (foundRoomName) {
            this.roomNameLabel.string = `Phòng: ${foundRoomName}`;
            this.totalPlayersLabel.string = `Người chơi: ${roomMembers.length}/4`;
            console.log("foundRoomName:", foundRoomName);
            console.log("this.roomNameLabel:", this.roomNameLabel);
            console.log("this.totalPlayersLabel:", this.totalPlayersLabel);


            this.gridPlayer.removeAllChildren();
            for (const playerObj of roomMembers) {
                const playerId = Object.keys(playerObj)[0];
                const playerInfo = playerObj[playerId];

                const playerNode = cc.instantiate(this.prefabPlayer);
                const labelNode = playerNode.getChildByName("New Label");
                const labelComp = labelNode.getComponent(cc.Label);
                labelComp.string = `ID: ${playerId.substring(0, 5)}... - Name: ${playerInfo.name}`; // Hiển thị cả ID và Name
                this.gridPlayer.addChild(playerNode);
            }
        } else {
            this.roomNameLabel.string = "Không tìm thấy thông tin phòng.";
            this.totalPlayersLabel.string = "";
            this.gridPlayer.removeAllChildren();
        }
    },

    playGame() {
        for (const room of this.currentRoomData.rooms) {
            if (room.players.length > 4) {
                console.error("Phòng đã đầy, không thể bắt đầu trò chơi.");
                return;
            }

            if (room.players.some(playerObj => Object.keys(playerObj)[0] === this.socketIOManager.getSocketIO().id)) {
                console.log("Bắt đầu trò chơi trong phòng:", room.roomName);
                this.socketIOManager.gameStart(room.roomName, room.players);
                return;
            }
        }
    },

    moveToSelectScene() {
        console.log("Chuyển đến HeroSelect scene.");
        cc.director.loadScene("HeroSelect");
    }


});