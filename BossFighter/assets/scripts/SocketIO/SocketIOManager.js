// const RoomModule = require('RoomModule');
import RoomModule from "./RoomModule";
import GameModule from "./GameModule";
import SelectHeroModule from "./SelectHeroModule";

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

        this.room = RoomModule(this.socketIO);
        this.selectHero = SelectHeroModule(this.socketIO);
        this.game = GameModule(this.socketIO);

        console.log(this.socketIO);
        console.log("Kết nối thanh cong Socket.IO server:", url);
    },

    getSocketIO() {
        return this.socketIO
    },
});