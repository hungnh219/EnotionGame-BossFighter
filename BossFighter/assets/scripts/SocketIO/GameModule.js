module.exports = function(socket) {
    return {
    // ============= init =============
    // ================================
        initData(handleInitDataCallback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            new Promise((resolve, reject) => {
                socket.on('DATA_INITIALIZED', (data) => {
                    console.log('init data:', data);
                    if (handleInitDataCallback) {
                        handleInitDataCallback(data.heroData);
                    }
                    resolve();
                });
                socket.emit('INIT_DATA');
                
            });

        }, 

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
                socket.on('MAP_DATA', (data) => {
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

        updateWalkableGridMap(data) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            console.log("Cập nhật lưới ô có thể đi được:", data);
            socket.emit('UPDATE_WALKABLE_GRID_MAP', data);
        },

        listenWalkableGridMapUpdated(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.on('WALKABLE_GRID_MAP_UPDATED', (data) => {
                console.log('Nhận lưới ô có thể đi được đã cập nhật:', data.walkableGridMap);
                if (callback) {
                    callback(data.walkableGridMap);
                }
            });
        },

        getWalkableGridMap() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            return new Promise((resolve, reject) => {
                socket.on('RETURN_WALKABLE_GRID_MAP', (data) => {
                    resolve(data.walkableGridMap);
                });
                socket.emit('GET_WALKABLE_GRID_MAP');
            });
        },

        findPath(data) {
            return new Promise((resolve, reject) => {
                socket.on('RETURN_PATH', (data) => {
                    resolve(data.path);
                });
                socket.emit('FIND_PATH', data);
            });
        },

        getAttackDame(data) {
            return new Promise((resolve, reject) => {
                socket.on('RETURN_ATTACK_DAME', (data) => {
                    console.log('Nhận sát thương tấn công:', data.attackDamage);
                    resolve(data.attackDamage);
                });
                socket.emit('GET_ATTACK_DAME', data);
            });
        },

        listenOtherAttack(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            socket.on('LISTEN_ATTACK', (data) => {
                console.log('Nhận yêu cầu tấn công:', data);
                if (callback) {
                    callback(data);
                }
            });
        },

        otherPlayerAttack(data) {
            console.log('Gửi yêu cầu tấn công đến server:', data);
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            console.log('Gửi yêu cầu tấn công đến server:', data);
            socket.emit('OTHER_PLAYER_ATTACK', data);
        },

        nextMap() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            socket.emit('NEXT_MAP');
        },

        listenNextMap(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            socket.on('LISTEN_NEXT_MAP', () => {
                console.log('Nhận yêu cầu chuyển sang bản đồ mới từ server');
                if (callback) {
                    callback();
                }
            });
        },  
    };
}