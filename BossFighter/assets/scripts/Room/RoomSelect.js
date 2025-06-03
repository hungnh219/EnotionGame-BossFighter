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
        this.uiCreateRoom.active = false
        this.roomInfoLabel.string = "Tổng số phòng: 0\n";
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager;
        console.log(this.socketIOManager)

        this.socketIOManager.setUpdateRoomInfoCallback(() => {
            this.updateRoomInfo();
        });
    },

    start() {
        this.socketIOManager.connectToSocketIOServer("http://localhost:3000");

        this.updateRoomInfo();

        this.socketIOManager.listenGetRooms(() => {
            this.updateRoomInfo();
        });
    },

    async updateRoomInfo() {
        this.rooms = await this.socketIOManager.getRooms();
        
        this.roomInfoLabel.string = `Tổng số phòng: ${this.rooms.length}\n`;
        this.content.removeAllChildren();

        this.rooms.forEach((room) => {
            // let numberOfPlayers = Object.keys(room.players).length;
            console.log(room)
            console.log(room.members)
            let numberOfPlayers = Object.keys(room.members).length;

            const roomNode = new cc.Node('RoomItem');
            const label = roomNode.addComponent(cc.Label);
            label.string = room.name + ` (${numberOfPlayers} người)`;
            label.fontSize = 24;
            label.lineHeight = 24;
            label.font = this.customFont;
            // roomNode.on('click', () => {
            //     this.selectRoom.string = room.name;
            // });
            this.content.addChild(roomNode);
        });
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

    },

    createRoom() {
        const roomName = this.roomNameInput.string.trim();
        if (!roomName) {
            console.warn("Room name cannot be empty.");
            return;
        }

        console.log("Creating room with name:", roomName);
        if (roomName) {
            this.socketIOManager.createRoom(roomName, () => {
                // cc.director.loadScene('WaitingRoom');
                this.joinRoom(roomName);
            })
        }
    },

    joinRoom(name) {
        let roomName =this.selectRoom.string.trim();
        
        if (name) {
            roomName = name;
        }

        if (!roomName) {
            console.warn("Room name cannot be empty.");
            return;
        }

        console.log("Joining room with name:", roomName);
        this.socketIOManager.joinRoom(roomName, () => {
            cc.director.loadScene('WaitingRoom');
        });
    }


});