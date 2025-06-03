// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const SocketIOManager = cc.Class({
    extends: cc.Component,

    statics: {
        getInstance() {
            if (!this.instance) {
                this.instance = new SocketIOManager();
            }
            return this.instance;
        }
    },

    properties: {
    },


    onLoad() {
        this.roomName = null
        this.playerId = null
     },

    start() {

    },

    connectToSocketIOServer(url) {
        console.log("Kết nối đến Socket.IO server tại...:", url);
        if (this.socketIO && this.socketIO.connected) {
            console.warn("socketIO đã kết nối rồi.");
            return;
        }

        this.socketIO = io(url, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        console.log(this.socketIO);

        console.log("Kết nối thanh cong Socket.IO server:", url);
    },

    getSocketIO() {
        return this.socketIO;
    },

    setSocketId(playerId){
        this.playerId = playerId
    },

    getSocketId(){
        return this.playerId
    },

    setRoomName(roomName){
        this.roomName = roomName
    },

    getRoomName(){
        return this.roomName
    },

    getCreateRoom(){
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }
        this.socketIO.emit('createRoom', this.roomName);
        return
    },

    getJoinRoom(){
        console.log('afssdfsadfsad')
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }
        this.socketIO.emit('joinRoom', this.roomName, this.playerId);
        return
    },

    getJoinRoomResult() {
        return new Promise((resolve, reject) => {
            if (!this.socketIO) {
                console.error("Chưa kết nối đến Socket.IO server.");
                reject("Không kết nối socket");
                return;
            }
    
            this.socketIO.once('joinRoomResult', (data) => {
                if (data.success) {
                    console.log('data',data)
                    resolve(data);
                } else {
                    reject(data.message);
                }
            });
        });
    },

    getMapData() {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }
        console.log("Yêu cầu dữ liệu bản đồ từ server...");

        return new Promise((resolve, reject) => {
            console.log("Gửi yêu cầu GET_MAP_DATA đến server...");
            this.socketIO.emit('GET_MAP_DATA');
            this.socketIO.on('MAP_1_DATA', (data) => {
                resolve(data.mapData);
            });
        });
    }

    // update (dt) {},
});

export default SocketIOManager;
