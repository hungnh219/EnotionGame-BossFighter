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

    createRoom(roomName) {
        return new Promise((resolve, reject) => {
            if (!this.socketIO) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            this.socketIO.emit('createRoom', roomName);

            this.socketIO.on('createRoomResult', (data) => {
                if (data.success) {
                    resolve(data)
                }
                else {
                    reject(data.message)
                }
            })
        })
    },

    joinRoom(roomName) {
        return new Promise((resolve, reject) => {
            if (!this.socketIO) {
                console.error("Chưa kết nối đến Socket.IO server.");
                resolve({ success: false, message: "Chưa kết nối đến server" });
                return;
            }

            this.socketIO.emit('joinRoom', roomName);

            this.socketIO.on('joinRoomResult', (data) => {
                if (data.success) {
                    resolve(data);
                }
                else {
                    reject(data.message)
                }

            });
        });
    },

    getRoomInformation() {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }

        this.socketIO.off('roomInfo');
        this.socketIO.on('roomInfo', (data) => {
            console.log("Thông tin phòng đã nhận được:", data);
            if (this.onRoomInfoReceivedCallback) {
                this.onRoomInfoReceivedCallback(data);
            }
        });

        console.log('Yêu cầu thông tin phòng hiện tại từ server...');
        this.socketIO.emit('requestRoomInfo');
    },

    setOnRoomInfoReceivedCallback(callback) {
        this.onRoomInfoReceivedCallback = callback;
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

    gameStart(moveToSelectSceneCallback) {
        if (!this.socketIO) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }

        this.socketIO.emit('GAME_START')
        
        // this.socketIO.emit('GAME_START', );
    },

    // getRoomName() {}
    getGameStartData() {
        return new Promise((resolve, reject) => {
            this.socketIO.on('GAME_START_DATA_SELECT', (data) => {
                console.log('Nhận dữ liệu bắt đầu trò chơi:', data);
                resolve(data);
            });

            this.socketIO.emit('GET_GAME_START_DATA');
        });
    },

    clickHero(heroIndex) {
        this.socketIO.emit('SELECT_HERO', heroIndex);
    },

    lockHero(heroIndex) {
        console.log('Yêu cầu khóa hero với chỉ số:', heroIndex);
        this.socketIO.emit('LOCK_HERO', heroIndex);
    },

    listenHeroSelection(updateHeroSelectionCallback) {
        this.socketIO.on('HERO_SELECTED', (data) => {
            console.log('Hero selected by client:', data.clickHeroArray);
            updateHeroSelectionCallback(data.clickHeroArray);
        })
    },

    listenHeroLock(updateHeroLockCallback) {
        this.socketIO.on('HERO_LOCKED', (data) => {
            console.log('Hero locked by client:', data.lockedHeroArray);
            updateHeroLockCallback(data.lockedHeroArray);
        })
    },

    listenGameStart(moveToSelectSceneCallback) {
        this.socketIO.on('GAME_START_DATA', (data) => {
            console.log('312321Trò chơi đã bắt đầu với dữ liệu:', data);
            if (moveToSelectSceneCallback) {
                moveToSelectSceneCallback(data);
            }
        });
    },

    getPlayerIndex(startGameData) {
        let currentSocketId = this.socketIO.id;

        console.log(startGameData, "startGameData");
        if (!startGameData || !startGameData.players) {
            console.error("Dữ liệu bắt đầu trò chơi không hợp lệ:", startGameData);
            return null;
        }

        for (let i = 0; i < startGameData.players.length; i++) {
            if (startGameData.players[i].id === currentSocketId) {
                return startGameData.players[i].order;
            }
        }

        console.warn("Không tìm thấy người chơi với socket ID:", currentSocketId);
        return null;
    }

    // update (dt) {},
});