import SocketIOManager from "../SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        roomNameInput: cc.EditBox,
        selectRoom: cc.EditBox,
        submitRoomButton: cc.Button,
        openCreateRoomButton: cc.Button,
        joinRoomButton: cc.Button,
        roomInfoLabel: cc.Label,
        uiCreateRoom: cc.Node,
        content: cc.Node,
        prefabRoomItem: cc.Prefab
    },

    socketIOManager: null,
    currentRoom: '',

    onLoad() {
        this.content.removeAllChildren();
        console.log('Main Scene: onLoad');
        this.uiCreateRoom.active = false;
        this.roomInfoLabel.string = "Đang tải thông tin phòng...";
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
    },

    start() {
        this.socketIOManager.connectToSocketIOServer("http://localhost:3000");

        this.socketIOManager.setOnRoomInfoReceivedCallback(this.onRoomInfoUpdated.bind(this));
        this.socketIOManager.getRoomInformation();
    },

    onRoomInfoUpdated(data) {
        if (data && data.totalRooms !== undefined) {
            this.roomInfoLabel.string = `Tổng số phòng: ${data.totalRooms}\n`;
            this.displayRoomList(data.rooms);
        } else {
            this.roomInfoLabel.string = "Không có thông tin phòng.";
        }
        console.log("Main Scene: Đã nhận thông tin phòng:", data);
    },

    displayRoomList(rooms) {
        this.content.removeAllChildren(); ư

        if (!this.prefabRoomItem) {
            console.error("not prefab");
            return;
        }

        rooms.forEach(room => {
            const roomItemNode = cc.instantiate(this.prefabRoomItem);


            const roomNameLabelNode = cc.find("New Sprite/New Label", roomItemNode);

            if (roomNameLabelNode) {
                const roomNameLabelComp = roomNameLabelNode.getComponent(cc.Label);
                if (roomNameLabelComp) {
                    roomNameLabelComp.string = `${room.roomName} (${room.memberCount}/4)`;
                } else {
                    console.warn("Node 'New Label' trong prefabRoomItem không có component cc.Label.");
                }
            } else {
                console.warn("Không tìm thấy Node 'New Sprite/New Label' trong prefabRoomItem.");
            }

            this.content.addChild(roomItemNode);
        });
    },

    async onSubmitRoomButton() {
        const roomName = this.roomNameInput.string.trim();
        if (roomName) {
            try {
                await this.socketIOManager.createRoom(roomName);
                cc.director.loadScene('WaitingRoom');
            } catch (error) {
                console.error("Lỗi khi tạo phòng:", error);

            }
        }
    },

    async onJoinRoomButton() {
        const roomName = this.selectRoom.string.trim();

        if (!roomName) return;

        try {
            const result = await this.socketIOManager.joinRoom(roomName);
            if (result.success) {
                cc.director.loadScene('WaitingRoom');
            } else {
                console.warn(result.message);
            }
        } catch (error) {
            console.error("Lỗi khi tham gia phòng:", error);
        }
    },

    onOpenCreateRoomUI() {
        this.uiCreateRoom.active = true;
    },

    onCloseCreateRoomUI() {
        this.uiCreateRoom.active = false;
    },

});