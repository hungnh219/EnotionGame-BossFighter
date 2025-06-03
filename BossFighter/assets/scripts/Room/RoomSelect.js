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
        console.log('fsafsfsd')
        this.uiCreateRoom.active = false
        this.roomInfoLabel.string = "Tổng số phòng: 0\n";
        this.socketIOManager = SocketIOManager.getInstance();
        console.log(this.socketIOManager)

    },

    start() {
        this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        
        this.socket = this.socketIOManager.getSocketIO()

        // this.socket.on('roomInfo', (data) => {
        //     let roomInfoText = `Tổng số phòng: ${data.totalRooms}\n`;
        //     data.rooms.forEach((room) => {
        //         roomInfoText += `Phòng: ${room.roomName}, Số user: ${room.memberCount}\n`;
        //     });
        //     this.roomInfoLabel.string = roomInfoText;
        // });

        // this.socket.on('error', (error) => {
        //     console.error("Socket error:", error);
        // });
    },


    onSubmitRoomButton() {
        
        const roomName = this.roomNameInput.string.trim();
        this.socketIOManager.setRoomName(roomName)
        if (this.socketIOManager.getRoomName()) {
            this.socketIOManager.getCreateRoom();
            cc.director.loadScene('WaitingRoom');
        }
    },

    async onJoinRoomButton() {
        const roomName = this.selectRoom.string.trim();
        this.socketIOManager.setRoomName(roomName);
    
        if (this.socketIOManager.getRoomName()) {
            this.socketIOManager.getJoinRoom()
            try {
                const result = await this.socketIOManager.getJoinRoomResult();
                console.log(`Đã tham gia phòng: ${result.roomName}`);
                cc.director.loadScene('WaitingRoom');
            } catch (errorMessage) {
                console.log('errMessage', errorMessage)
                console.error(errorMessage);
            }
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