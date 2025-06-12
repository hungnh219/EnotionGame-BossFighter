module.exports = function (socket) {

    return {

        sendMessage(roomName, message) {
            return new Promise((resolve, reject) => {
                if (!socket) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    return null;
                }
                socket.emit('SEND_MESSAGE', roomName, message);

                resolve({ success: true, message: "Tin nhắn đã được gửi đi." });
            })
        },

        receiveMessages(callback) {
            const chatCallbacks = {};
            if (typeof callback !== 'function') {
                cc.error("Callback cho tin nhắn phải là một hàm.");
                return;
            }

            if (!chatCallbacks.messageListenerRegistered) {
                chatCallbacks.messageListenerRegistered = true;
                socket.on('RECEIVED_MESSAGE', (data) => {
                    if (chatCallbacks.activeMessageCallback) {
                        chatCallbacks.activeMessageCallback(data);
                    }
                });
            }
            chatCallbacks.activeMessageCallback = callback;
        },

        leaveRoom(roomName) {
            return new Promise((resolve, reject) => {
                if (!socket) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    return null;
                }
                socket.emit('LEAVE_ROOM', roomName)

                socket.on('LEAVE_ROOM_RESULT', (data) => {
                    if (data.success) {
                        resolve(data)
                    } else {
                        reject({
                            message: data.message,
                            type: data.type || 'error'
                        });
                    }
                })
            })
        },

        checkRoomExist(roomName) {
            return new Promise((resolve, reject) => {
                if (!socket) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    return null;
                }
                socket.emit('CHECK_ROOM_EXIST', roomName);

                socket.on('CHECK_ROOM_EXIST_RESULT', (data) => {
                    if (data.success) {
                        resolve(data)
                    } else {
                        reject({
                            message: data.message,
                            type: data.type || 'error'
                        });
                    }
                })
            })
        },

        checkRoomFull(roomName) {
            return new Promise((resolve, reject) => {
                if (!socket) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    return null;
                }
                socket.emit('CHECK_ROOM_FULL', roomName);

                socket.on('CHECK_ROOM_FULL_RESULT', (data) => {
                    if (data.success) {
                        resolve(data)
                    } else {
                        reject({
                            message: data.message,
                            type: data.type || 'error'
                        });
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
                socket.emit('CREATE_ROOM', roomName, maxPlayer, namePlayer);

                socket.on('CREATE_ROOM_RESULT', (data) => {
                    if (data.success) {
                        resolve(data)
                    }
                    else {
                        reject({
                            message: data.message,
                            type: data.type || 'error'
                        });
                    }
                })
            })
        },

        joinRoom(roomName, namePlayer) {
            return new Promise((resolve, reject) => {
                if (!socket) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    resolve({ success: false, message: "Chưa kết nối đến server" });
                    return;
                }

                socket.emit('JOIN_ROOM', roomName, namePlayer);

                socket.on('JOIN_ROOM_RESULT', (data) => {
                    if (data.success) {
                        resolve(data);
                    }
                    else {
                        reject({
                            message: data.message,
                            type: data.type || 'error'
                        });
                    }

                });
            });
        },

        getRoomInformation() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.off('ROOM_INFO');
            socket.on('ROOM_INFO', (data) => {
                console.log("Thông tin phòng đã nhận được:", data);
                if (this.onRoomInfoReceivedCallback) {
                    this.onRoomInfoReceivedCallback(data);
                }
            });

            console.log('Yêu cầu thông tin phòng hiện tại từ server...');
            socket.emit('REQUEST_ROOM_INFO');
        },

        setOnRoomInfoReceivedCallback(callback) {
            this.onRoomInfoReceivedCallback = callback;
        },

        gameStart() {
            return new Promise((resolve, reject) => {
                if (!socket || !socket.connected) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    return reject({ success: false, message: "Chưa kết nối đến Socket.IO server." });
                }

                socket.emit('GAME_START', (response) => {
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(response.message);
                    }
                });
            });
        },

        listenGameStart(moveToSelectSceneCallback) {
            socket.on('GAME_START_DATA', (data) => {
                console.log('312321Trò chơi đã bắt đầu với dữ liệu:', data);
                if (moveToSelectSceneCallback) {
                    moveToSelectSceneCallback(data);
                }
            });
        },

        clearListeners() {
            socket.off('RECEIVED_MESSAGE');
            socket.off('LEAVE_ROOM_RESULT');
            socket.off('CHECK_ROOM_EXIST_RESULT');
            socket.off('CHECK_ROOM_FULL_RESULT');
            socket.off('CREATE_ROOM_RESULT');
            socket.off('JOIN_ROOM_RESULT');
            socket.off('ROOM_INFO');
            socket.off('GAME_START_DATA');

            console.log("[RoomModule] Đã clear toàn bộ socket listeners.");
        },
    };
};