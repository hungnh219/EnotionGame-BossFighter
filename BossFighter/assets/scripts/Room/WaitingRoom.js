import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        prefabPlayer: cc.Prefab,
        gridPlayer: cc.Node,
        roomNameLabel: cc.Label,
        totalPlayersLabel: cc.Label,
        startButton: cc.Node,
        textMessageInput: cc.EditBox,
        messageItem: cc.Prefab,
        scrollViewContent: cc.Node
    },

    socketIOManager: null,
    currentRoomData: null,
    currentRoomName: '', 

    onLoad() {
        this.scrollViewContent.removeAllChildren();
        this.startButton.active = false
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }

        this.socketIOManager.room.listenGameStart((data) => {
            console.log("WaitingRoom: Nhận được sự kiện bắt đầu trò chơi từ máy chủ.", data);
            cc.director.loadScene("HeroSelect");
        })

        this.socketIOManager.room.receiveMessages(this.onMessageReceived.bind(this));

        this.textMessageInput.node.on('editing-did-ended', this.onEditingEnded, this);
    },

    start() {
        this.socketIOManager.room.setOnRoomInfoReceivedCallback(this.onRoomInfoReceived.bind(this));

        this.socketIOManager.room.getRoomInformation();

        this.socketIOManager.room.listenGameStart(() => {
            console.log("Trò chơi đã bắt đầu, chuyển đến HeroSelect scene.");
            this.moveToSelectScene();
        });
    },

    onMessageReceived(data) {
        console.log('WaitingRoom: Nhận tin nhắn từ server:', data);
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
            await this.socketIOManager.room.sendMessage(this.currentRoomName, inputText);
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

        this.socketIOManager.room.gameStart();
    },

    async leaveRoom() {
        console.log('currentNameRoom', this.currentRoomName)
        try {
            const result = await this.socketIOManager.room.leaveRoom(this.currentRoomName)
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