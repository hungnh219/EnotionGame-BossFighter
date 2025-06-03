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
        content :cc.Node,
    },

    socket: null,
    currentRoom: '',

    onLoad() {
        this.content.removeAllChildren()
        this.uiCreateRoom.active = false
        this.roomInfoLabel.string = "Tổng số phòng: 0\n";
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        // this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
    },

    start() {
        this.socket = this.socketIOManager.getSocketIO()
    },


    onSubmitRoomButton() {
        const roomName = this.roomNameInput.string.trim();

        if (roomName) {
            this.socketIOManager.createRoom(roomName);
            cc.director.loadScene('WaitingRoom');
        }
    },

    async onJoinRoomButton() {
        const roomName = this.selectRoom.string.trim();
        
        console.log('roomName', roomName)
        if (roomName) {
            this.socketIOManager.joinRoom(roomName, this.socket.id)

            cc.director.loadScene('WaitingRoom');
            // try {
            //     const result = await this.socketIOManager.getJoinRoomResult();
            //     console.log(`Đã tham gia phòng: ${result.roomName}`);
            //     cc.director.loadScene('WaitingRoom');
            // } catch (errorMessage) {
            //     console.log('errMessage', errorMessage)
            //     console.error(errorMessage);
            // }
        }
    },    

    onOpenCreateRoomUI() {
        this.uiCreateRoom.active = true;
    },

    onCloseCreateRoomUI() {
        this.uiCreateRoom.active = false;
    },

    createList(){

    }


});