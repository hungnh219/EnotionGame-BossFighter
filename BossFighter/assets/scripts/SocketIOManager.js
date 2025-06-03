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

    getSocketIO() {
        return this.socketIO
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

    // createRoom(roomName) {
    //     return new Promise((resolve, reject) => {
    //         if (!this.socketIO) {
    //             console.error("Chưa kết nối đến Socket.IO server.");
    //             return null;
    //         }
    //         this.socketIO.emit('createRoom', roomName);

    //         this.socketIO.on('createRoomResult', (data) => {
    //             if (data.success) {
    //                 resolve(data)
    //             }
    //             else {
    //                 reject(data.message)
    //             }
    //         })
    //     })


    // },

    // joinRoom(roomName) {
    //     return new Promise((resolve) => {
    //         if (!this.socketIO) {
    //             console.error("Chưa kết nối đến Socket.IO server.");
    //             resolve({ success: false, message: "Chưa kết nối đến server" });
    //             return;
    //         }

    //         this.socketIO.emit('joinRoom', roomName);

    //         this.socketIO.on('joinRoomResult', (data) => {
    //             if (data.success) {
    //                 resolve(data);
    //             }
    //             else {
    //                 reject(data.message)
    //             }

    //         });
    //     });
    // },

    // getRoomInformation() {
    //     console.log('ấdfádfádfs')
    //     if (!this.socketIO) {
    //         console.error("Chưa kết nối đến Socket.IO server.");
    //         return null;
    //     }
    //     this.socketIO.on('roomInfo', (data) => {
    //         console.log("Thông tin phòng:", data);

    //     });
    // },

    createRoom(roomName, moveToWaitingRoomCallback) {
        console.log("Yêu cầu tạo phòng với tên:", roomName);
        this.socketIO.emit('CREATE_ROOM', roomName);

        this.socketIO.on('CREATE_ROOM_SUCCESS', (data) => {
            console.log("Phòng đã được tạo thành công:", data);
            moveToWaitingRoomCallback();
        });
    },

    getRooms() {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }
        console.log("Yêu cầu danh sách phòng từ server...");

        return new Promise((resolve, reject) => {
            this.socketIO.on('ROOM_LIST', (data) => {
                console.log("Nhận danh sách phòng:", data.rooms);
                resolve(data.rooms);
            });

            this.socketIO.emit('GET_ROOM');
            
        });
    },

    setUpdateRoomInfoCallback(callback) {
        this.updateRoomInfoCallback = callback;
    },

    joinRoom(roomName, moveToWaitingRoomCallback) {
        console.log("Yêu cầu tham gia phòng:", roomName);
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return;
        }

        return new Promise((resolve, reject) => {
            this.socketIO.on('JOIN_ROOM_SUCCESS', (data) => {
                console.log("Đã tham gia phòng thành công:", data);
                moveToWaitingRoomCallback();
                resolve();
            });

            this.socketIO.emit('JOIN_ROOM', roomName);
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

    listenGetRooms(callback) {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return;
        }
        console.log("Lắng nghe sự kiện GET_ROOM từ server...");

        this.socketIO.on('UPDATE_ROOM_INFO', (data) => {
            console.log("Nhận danh sách phòng:", data.rooms);
            if (callback) {
                callback();
            }
        });
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