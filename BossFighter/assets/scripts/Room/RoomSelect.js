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
    },

    socket: null,
    currentRoom: '',

    onLoad() {
        this.content.removeAllChildren()
        console.log('fsafsfsd')
        this.uiCreateRoom.active = false
        this.roomInfoLabel.string = "Tổng số phòng: 0\n";
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager;
        console.log(this.socketIOManager)

    },

    start() {
        this.socketIOManager.connectToSocketIOServer("http://localhost:3000");

        // this.socket = this.socketIOManager.getSocketIO()

    },


    async onSubmitRoomButton() {

        const roomName = this.roomNameInput.string.trim();
        if (roomName) {
            try {
                await this.socketIOManager.createRoom(roomName)
                cc.director.loadScene('WaitingRoom');
            } catch (error) {
                console.log(error)
            }

        }
    },

    async onJoinRoomButton() {
        const roomName = this.selectRoom.string.trim();

        if (!roomName) return;

        const result = await this.socketIOManager.joinRoom(roomName);

        if (result.success) {
            cc.director.loadScene('WaitingRoom');
        } else {
            console.warn(result.message);
            alert(result.message);
        }
    },


    onOpenCreateRoomUI() {
        this.uiCreateRoom.active = true;
    },

    onCloseCreateRoomUI() {
        this.uiCreateRoom.active = false;
    },

    createList() {

    }


});