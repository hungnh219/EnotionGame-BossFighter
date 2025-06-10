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

        initializeGame() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.emit('INITIALIZE_GAME');
        },

        getCurrentGameData() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('CURRENT_GAME_DATA', (data) => {
                    resolve(data);
                });
                socket.emit('GET_CURRENT_GAME_DATA');
            });
        },

        sendGameMessage(roomName, message) {
            return new Promise((resolve, reject) => {
                if (!socket) {
                    console.error("Chưa kết nối đến Socket.IO server.");
                    return null;
                }
                socket.emit('sendGameMessage', roomName, message);

                resolve({ success: true, message: "Tin nhắn đã được gửi đi." });
            })
        },

        receiveGameMessages(callback) {
            const chatCallbacks = {};
            if (typeof callback !== 'function') {
                cc.error("Callback cho tin nhắn phải là một hàm.");
                return;
            }

            if (!chatCallbacks.messageListenerRegistered) {
                chatCallbacks.messageListenerRegistered = true;
                socket.on('receiveGameMessages', (data) => {
                    if (chatCallbacks.activeMessageCallback) {
                        chatCallbacks.activeMessageCallback(data);
                    }
                });
            }
            chatCallbacks.activeMessageCallback = callback;
        },

        getPlayerOrder() {
            console.log("Yêu cầu thứ tự người chơi từ server...");
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
            return new Promise((resolve, reject) => {
                socket.on('PLAYER_ORDER', (data) => {
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
            return new Promise((resolve, reject) => {
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
            socket.emit('UPDATE_WALKABLE_GRID_MAP', data);
        },

        listenWalkableGridMapUpdated(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.on('WALKABLE_GRID_MAP_UPDATED', (data) => {
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
                if (callback) {
                    callback(data);
                }
            });
        },

        otherPlayerAttack(data) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            
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
                if (callback) {
                    callback();
                }
            });
        },

        async getCharacterData(characterId) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('RETURN_CHARACTER_DATA', (data) => {
                    resolve(data.characterData);
                });
                socket.emit('GET_CHARACTER_DATA', {
                    characterId: characterId
                 });
            });
        },

        getLeaderBoard() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('RETURN_LEADER_BOARD', (data) => {
                    resolve(data.leaderBoard);
                });
                socket.emit('GET_LEADER_BOARD');
            });
        },

        takeDame(dealerId, characterId, dame) {
            console.log('Yêu cầu take dame:', dealerId, characterId, dame);
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('LISTEN_TAKE_DAME', (data) => {
                    resolve(data.newHp);
                });
                socket.emit('TAKE_DAME', {
                    dealerId: dealerId,
                    characterId: characterId,
                    dame: dame
                });
            });
        },
         
        listenBossDie(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.on('BOSS_DIE', (data) => {
                if (callback) {
                    callback(data);
                }
            });
        },

        getCurrentHp(characterId) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('RETURN_CURRENT_HP', (data) => {
                    resolve(data.currentHp);
                });
                socket.emit('GET_CURRENT_HP', { characterId: characterId });
            });
        },

        quitGame() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('QUIT_GAME_SUCCESS', () => {
                    resolve();
                });
                socket.emit('QUIT_GAME');
            });
        },

        bossAttack(enemyId, heroId) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.emit('BOSS_ATTACK', { enemyId: enemyId, heroId: heroId });
        },

        listenBossAttack(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.on('LISTEN_BOSS_ATTACK', (data) => {
                if (callback) {
                    callback(data);
                }
            });
        },

        getHeroes() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('RETURN_HEROES', (data) => {
                    resolve(data.heroes);
                });
                socket.emit('GET_HEROES');
            });
        },

        getBosses() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('RETURN_BOSSES', (data) => {
                    resolve(data.bosses);
                });
                socket.emit('GET_BOSSES');
            });
        },

        getMapIndex() {
            if (!socket) {
                return null;
            }

            return new Promise((resolve, reject) => {
                socket.on('RETURN_MAP_INDEX', (data) => {
                    console.log('Nhận map index:', data.currentMapIndex);
                    resolve(data.currentMapIndex);
                });
                socket.emit('GET_MAP_INDEX');
            });
        },

        handleCharacterDeath(characterId) {
            if (!socket) {
                return null;
            }

            socket.emit('HANDLE_CHARACTER_DEATH', { characterId: characterId });
        },

        checkWin() {
            console.log("Yêu cầu kiểm tra chiến thắng...");
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.emit('CHECK_WIN');
        },

        listenGameOver(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.on('GAME_OVER', (data) => {
                if (callback) {
                    callback(data);
                }
            });
        },

        listenCharacterDeath(callback) {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.on('LISTEN_CHARACTER_DEATH', (data) => {
                if (callback) {
                    callback(data);
                }
            });
        },

        setPosition(characterId, position) {
            console.warn('position: ', characterId, position);
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.emit('SET_POSITION', {
                characterId: characterId,
                x: position.x,
                y: position.y
            });
        }
    };
}