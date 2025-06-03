cc.Class({
    extends: cc.Component,

    properties: {
        // statusLabel: cc.Label,
        roomNameInput: cc.EditBox,
        createRoomButton: cc.Button,
        joinRoomButton: cc.Button,
        // sendRoomMessageButton: cc.Button,
        roomInfoLabel: cc.Label,
        uiCreateRoom: cc.Node
    },

    socket: null, 
    currentRoom: '', 

    onLoad() {
        this.uiCreateRoom.active = false
        // this.statusLabel.string = "Đang kết nối...";
        this.createRoomButton.interactable = false;
        this.joinRoomButton.interactable = false;
        // this.sendRoomMessageButton.interactable = false;
        this.roomInfoLabel.string = "Tổng số phòng: 0\n";
    },

    start() {
        this.connectToSocketIOServer("http://localhost:3000");
    },

    connectToSocketIOServer(url) {
        this.socket = io(url, {
            transports: ['websocket', 'polling'],
            cors: { origin: "*", methods: ["GET", "POST"] },
        });

        this.socket.on('connect', () => {
            // this.statusLabel.string = `Đã kết nối! ID: ${this.socket.id}`;
            this.createRoomButton.interactable = true;
            this.joinRoomButton.interactable = true;
            // this.sendRoomMessageButton.interactable = true;
        });

        this.socket.on('disconnect', (reason) => {
            // this.statusLabel.string = `Đã ngắt kết nối: ${reason}`;
            this.createRoomButton.interactable = false;
            this.joinRoomButton.interactable = false;
            // this.sendRoomMessageButton.interactable = false;
        });

        this.socket.on('roomInfo', (data) => {
            console.log("Nhận thông tin phòng từ server:", data);
            let roomInfoText = `Tổng số phòng: ${data.totalRooms}\n`;
            data.rooms.forEach((room) => {
                roomInfoText += `Phòng: ${room.roomName}, Số user: ${room.memberCount}\n`;
            });
            this.roomInfoLabel.string = roomInfoText;
        });

        this.socket.on('error', (error) => {
            // this.statusLabel.string = `Lỗi: ${error}`;
        });
    },

    onCreateRoomButtonClicked() {
        this.uiCreateRoom.active = true
        const roomName = this.roomNameInput.string.trim();
        if (roomName) {
            this.socket.emit('createRoom', roomName);
            // this.statusLabel.string = `Đã gửi yêu cầu tạo phòng: ${roomName}`;
        } else {
            // this.statusLabel.string = "Vui lòng nhập tên phòng!";
        }
    },

    onJoinRoomButtonClicked() {
        const roomName = this.roomNameInput.string.trim();
        if (roomName) {
            this.socket.emit('joinRoom', roomName);
            // this.statusLabel.string = `Đã gửi yêu cầu tham gia phòng: ${roomName}`;
        } else {
            // this.statusLabel.string = "Vui lòng nhập tên phòng!";
        }
    },

    onCloseCreateRoomUI(){
        this.uiCreateRoom.active = false
    },

    // onSendRoomMessageButtonClicked() {
    //     const message = this.messageInput.string.trim();
    //     if (message && this.currentRoom) {
    //         this.socket.emit('roomMessage', { room: this.currentRoom, message: message });
    //         this.statusLabel.string = `Đã gửi: ${message}`;
    //     } else {
    //         this.statusLabel.string = "Vui lòng nhập tin nhắn và tham gia phòng!";
    //     }
    // },
});