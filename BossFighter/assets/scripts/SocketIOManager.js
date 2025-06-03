// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const SocketIOManager = cc.Class({
    extends: cc.Component,

    statics: {
        getInstance () {
            if (!this.instance) {
                this.instance = new SocketIOManager();
            }
            return this.instance;
        }
    },

    properties: {
    },


    onLoad () {
        
    },

    start () {

    },

    connectToSocketIOServer (url) {
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
        // console.log(this.socketIO);

        console.log("Kết nối thanh cong Socket.IO server:", url);
    },

    getSocketIO() {
        return this.socketIO;
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
    },

    clickHero(heroIndex) {
        this.socketIO.emit('SELECT_HERO', heroIndex);
    },

    lockHero(heroIndex) {
        this.socketIO.emit('LOCK_HERO', heroIndex);
    },

    listenHeroSelection() {
        this.socketIO.on('HERO_SELECTED', (data) => {
            console.log('Hero selected by client:', data.socketId, 'Hero Index:', data.heroIndex);
        })
    },

    listenHeroLock() {
        this.socketIO.on('HERO_LOCKED', (data) => {
            console.log('Hero locked by client:', data.socketId, 'Hero Index:', data.heroIndex);
        })
    },

    listenWalkableGridUpdate() {
        this.socketIO.on('WALKABLE_GRID_UPDATED', (data) => {
            console.log('Cập nhật lưới đi bộ từ server:', data.tileX, data.tileY, 'isWalkable:', data.isWalkable);
        });
    },

    updateWalkableGrid(x, y, isWalkable) {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return;
        }
        console.log("Cập nhật ô đi được tại vị trí:", x, y, "với trạng thái:", isWalkable);

        this.socketIO.emit('UPDATE_WALKABLE_GRID', {
            tileX: x,
            tileY: y,
            isWalkable: isWalkable
        });
    },

    getWalkableGridMap() {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }
        console.log("Yêu cầu gridmap từ server...");

        return new Promise(async (resolve) => {
            await this.socketIO.emit('GET_WALKABLE_GRID_MAP');
            this.socketIO.on('WALKABLE_GRID_MAP', (data) => {
                console.log("Nhận gridmap từ server:", data.walkableGridMap);
                resolve(data.walkableGridMap);
            });
        })
    }   

    // update (dt) {},
});

export default SocketIOManager;
