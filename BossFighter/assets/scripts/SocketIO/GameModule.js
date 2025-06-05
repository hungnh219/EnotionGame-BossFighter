module.exports = function(socket) {
    return {
        getPlayerOrder() {
            console.log("Yêu cầu thứ tự người chơi từ server...");
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            return new Promise((resolve, reject) => {
                socket.on('PLAYER_ORDER', (data) => {
                    console.log('Nhận thứ tự người chơi data:', data.order);
                    console.log('Nhận thứ tự người chơi data order:', data.order);
                    resolve(data.order);
                });
                socket.emit('GET_PLAYER_ORDER');
            });
        },

        moveToNewTile(data) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.emit('MOVE_TO_NEW_TILE', data);
        },

        listenMoveToNewTile(moveToNewTileCallback) {
            socket.on('LISTEN_MOVE_TO_NEW_TILE', (data) => {
                console.log('Nhận yêu cầu di chuyển đến ô mới:', data);
                if (moveToNewTileCallback) {
                    moveToNewTileCallback(data);
                }
            });
        },

        getMapData() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            console.log("Yêu cầu dữ liệu bản đồ từ server...");

            return new Promise((resolve, reject) => {
                console.log("Gửi yêu cầu GET_MAP_DATA đến server...");
                socket.emit('GET_MAP_DATA');
                socket.on('MAP_1_DATA', (data) => {
                    resolve(data.mapData);
                });
            });
        },

        getLockedHeroIndex() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('LOCKED_HERO_INDEX', (data) => {
                    console.log('Nhận chỉ số hero đã khóa:', data.lockedHeroArray);
                    resolve(data.lockedHeroArray);
                });

                socket.emit('GET_LOCKED_HERO_INDEX');
            });
        },
    }
}