module.exports = function(socket) {
  return {
    leaveRoom(roomName){
        return new Promise((resolve, reject)=>{
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            socket.emit('leaveRoom', roomName)

            socket.on('leaveRoomResult', (data)=>{
                if(data.success){
                    resolve(data)
                }else{
                    reject(data.message)
                }
            })
        })
    },

    checkRoomExist(roomName){
        return new Promise((resolve, reject)=>{
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            socket.emit('checkRoomExist', roomName);

            socket.on('checkRoomExistResult', (data)=>{
                if (data.success){
                    resolve(data)
                }else{
                    reject(data.message)
                }
            })
        })
    },

    checkRoomFull(roomName){
        return new Promise((resolve, reject)=>{
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            socket.emit('checkRoomFull', roomName);

            socket.on('checkRoomFullResult', (data)=>{
                if (data.success){
                    resolve(data)
                }else{
                    reject(data.message)
                }
            })
        })
    },

    createRoom(roomName, maxPlayer, namePlayer) {
        return new Promise((resolve, reject) => {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            socket.emit('createRoom', roomName, maxPlayer, namePlayer);

            socket.on('createRoomResult', (data) => {
                if (data.success) {
                    resolve(data)
                }
                else {
                    reject(data.message)
                }
            })
        })
    },

    joinRoom(roomName, namePlayer) {
        console.log("nhan ben roomModul", roomName, namePlayer)
        return new Promise((resolve, reject) => {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                resolve({ success: false, message: "Chưa kết nối đến server" });
                return;
            }

            socket.emit('joinRoom', roomName, namePlayer);

            socket.on('joinRoomResult', (data) => {
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
        if (!socket) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }

        socket.off('roomInfo');
        socket.on('roomInfo', (data) => {
            console.log("Thông tin phòng đã nhận được:", data);
            if (this.onRoomInfoReceivedCallback) {
                this.onRoomInfoReceivedCallback(data);
            }
        });

        console.log('Yêu cầu thông tin phòng hiện tại từ server...');
        socket.emit('requestRoomInfo');
    },

    setOnRoomInfoReceivedCallback(callback) {
        this.onRoomInfoReceivedCallback = callback;
    },

    gameStart(moveToSelectSceneCallback) {
        if (!socket) {
            console.error("Chưa kết nối đến Socket.IO server.");
            return null;
        }

        socket.emit('GAME_START')

        // socket.emit('GAME_START', );
    },

    listenGameStart(moveToSelectSceneCallback) {
        socket.on('GAME_START_DATA', (data) => {
            console.log('312321Trò chơi đã bắt đầu với dữ liệu:', data);
            if (moveToSelectSceneCallback) {
                moveToSelectSceneCallback(data);
            }
        });
    },
  };
};