import SocketIOManager from "../SocketIOManager";

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
        filterRoom: cc.EditBox
    },

    socketIOManager: null,
    currentRoom: '',

    onLoad() {
        this.numberPlayer.string = '0'
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
                    this.onDoubleClick(room);
                }, this);
            } else {
                console.log("Prefab không có component Button.");
            }

            const buttonJoinRoom = cc.find("New Button", roomItemNode)
            if(buttonJoinRoom){
                buttonJoinRoom.on('click', ()=>{
                    this.onJoinRoomButton(room)
                })
            } else {
                console.log("Khong co Component Button")
            }


            this.content.addChild(roomItemNode);
        });
    },

    onDoubleClick(room) {
        const currentTime = Date.now();

        if (currentTime - this.lastClickTime <= this.doubleClickThreshold) {
            this.onJoinRoomButton(room);
        }

        this.lastClickTime = currentTime;
    },

    

    async onSubmitRoomButton() {
        if (this.numberPlayer.string == 0) {
            console.log('So luong player khong hop le')
            return
        }
    
        this.onCloseCreateRoomUI();
        this.onOpenNameInputUI();
       
    },

    async onSubmitPlayerNameButton(){
        const roomName = this.roomNameInput.string.trim();
        const maxPlayer = +this.numberPlayer.string;
        const namePlayer = +this.namePlayerInput.string.trim();
         if (roomName && namePlayer) {
            try {
                await this.socketIOManager.createRoom(roomName, maxPlayer, namePlayer);
                cc.director.loadScene('WaitingRoom');
            } catch (error) {
                console.error("Lỗi khi tạo phòng:", error);

            }
        }
    },

    async onJoinRoomButton(selectRoom) {
        if (selectRoom == 'undefined' || selectRoom == null) {
            console.log('Chua chon phong')
            return
        }
        const roomName = selectRoom.roomName;

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

    onOpenNameInputUI(){
        this.uiNamePlayerInput.active = true
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