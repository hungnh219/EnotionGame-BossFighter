import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        roomNameInput: cc.EditBox,
        namePlayerInput: cc.EditBox,
        submitRoomButton: cc.Button,
        submitPlayerNameButton: cc.Button,
        openCreateRoomButton: cc.Button,
        roomInfoLabel: cc.Label,
        uiCreateRoom: cc.Node,
        uiNamePlayerInput: cc.Node,
        content: cc.Node,
        prefabRoomItem: cc.Prefab,
        numberPlayer: cc.Label,
        filterRoom: cc.EditBox,
        notificationPopUp: cc.Label,
    },

    socketIOManager: null,

    onLoad() {
        this.notificationPopUp.node.active =false
        this.numberPlayer.string = '4'
        this.content.removeAllChildren();
        console.log('Main Scene: onLoad');
        this.uiCreateRoom.active = false;
        this.uiNamePlayerInput.active = false;
        this.roomInfoLabel.string = "Đang tải thông tin phòng...";
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300;
    },

    start() {
        this.socketIOManager.connectToSocketIOServer("http://localhost:3000");

        this.socketIOManager.room.setOnRoomInfoReceivedCallback(this.onRoomInfoUpdated.bind(this));
        this.socketIOManager.room.getRoomInformation();
    },

    onRoomInfoUpdated(data) {
        if (data && data.totalRooms !== undefined) {
            this.roomInfoLabel.string = `Total Rooms: ${data.totalRooms}\n`;
            this.displayRoomList(data.rooms);
        } else {
            this.roomInfoLabel.string = "Không có thông tin phòng.";
        }
        console.log("Main Scene: Đã nhận thông tin phòng:", data);
    },

    displayRoomList(rooms) {
        this.content.removeAllChildren();

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
                    roomNameLabelComp.string = `${room.roomName} (${room.memberCount}/${room.maxPlayer})`;
                } else {
                    console.log("Node 'New Label' trong prefabRoomItem không có component cc.Label.");
                }
            } else {
                console.log("Không tìm thấy Node 'New Sprite/New Label' trong prefabRoomItem.");
            }

            const buttonNode = roomItemNode.getComponent(cc.Button);

            if (buttonNode) {
                roomItemNode.on('click', () => {
                    this.onDoubleClick(room.roomName);
                }, this);
            } else {
                console.log("Prefab không có component Button.");
            }

            const buttonJoinRoom = cc.find("New Button", roomItemNode)
            if (buttonJoinRoom) {
                buttonJoinRoom.on('click',async () => {
                    try{
                        await this.socketIOManager.room.checkRoomFull(room.roomName)
                        this.onOpenNameInputUI(room.roomName)
                    }catch(error){
                        console.error("Loi khi join phong", error)
                        this.onOpenNotificationPopUp(error)
                    }
                    
                })
            } else {
                console.log("Khong co Component Button")
            }


            this.content.addChild(roomItemNode);
        });
    },

    async onDoubleClick(roomName) {
        const currentTime = Date.now();

        if (currentTime - this.lastClickTime <= this.doubleClickThreshold) {
            try{
                await this.socketIOManager.room.checkRoomFull(roomName)
                this.onOpenNameInputUI(roomName);
            }catch (error){
                console.error("Loi khi join phong", error)
                this.onOpenNotificationPopUp(error)
            }            
        }

        this.lastClickTime = currentTime;
    },

    async onSubmitRoomButton() {
        const roomName = this.roomNameInput.string.trim();
        if(!roomName ){
            this.onOpenNotificationPopUp('Tên Phòng không được để trống');
            return
        }
        if (this.numberPlayer.string == 0) {
            this.onOpenNotificationPopUp('Số lượng player không hợp lệ');
            return
        }
        try {
            await this.socketIOManager.room.checkRoomExist(roomName)
            this.onCloseCreateRoomUI();
            this.onOpenNameInputUI(roomName);
        } catch (error) {
            console.error("Loi khi tao phong", error)
            this.onOpenNotificationPopUp(error)
        }
    },

    async onSubmitPlayerNameButton() {
        const roomName = this.roomNameInput.string.trim();
        const maxPlayer = +this.numberPlayer.string;
        const namePlayer = this.namePlayerInput.string.trim();
 
        if(!namePlayer){
            this.onOpenNotificationPopUp('Tên Player không được để trống')
        }
        if (roomName && namePlayer && maxPlayer) {
            try {
                await this.socketIOManager.room.createRoom(roomName, maxPlayer, namePlayer);
                cc.director.loadScene('WaitingRoom');
            } catch (error) {
                console.error("Lỗi khi tạo phòng:", error);
                this.onOpenNotificationPopUp(error)

            }
        } else if (this.roomNameJoin && namePlayer) {
            try {
                this.socketIOManager.room.joinRoom(this.roomNameJoin, namePlayer);
                cc.director.loadScene('WaitingRoom');
            } catch (error) {
                console.error("Lỗi khi tham gia phòng:", error);
                this.onOpenNotificationPopUp(error)
            }
        }
    },

    onOpenNotificationPopUp(noti){
        this.notificationPopUp.node.active = true
        this.notificationPopUp.string = noti
        this.scheduleOnce(()=>{
            this.notificationPopUp.string = ''
            this.notificationPopUp.node.active = false
        },2)
    },

    onOpenNameInputUI(roomName) {
        this.roomNameJoin = roomName
        this.uiNamePlayerInput.active = true
    },

    onCloseNameInputUI() {
        this.uiNamePlayerInput.active = false
    },

    onOpenCreateRoomUI() {
        this.uiCreateRoom.active = true;
    },

    onCloseCreateRoomUI() {
        this.uiCreateRoom.active = false;
    },

    decreasePlayerButton() {
        if (this.numberPlayer.string == 0) {
            return
        }
        this.count = +this.numberPlayer.string
        this.count -= 1
        this.numberPlayer.string = `${this.count}`
    },

    increasePlayerButton() {
        if (this.numberPlayer.string == 4) {
            return
        }
        this.count = +this.numberPlayer.string
        this.count += 1
        this.numberPlayer.string = `${this.count}`
    }
});