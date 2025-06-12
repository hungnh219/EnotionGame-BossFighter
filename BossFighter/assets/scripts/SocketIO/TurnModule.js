module.exports = function(socket) {
    return {
        consumeAction() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }
            socket.emit('CONSUME_ACTION');
        },

        getRemainingActions() {
            return new Promise((resolve, reject) => {
                if (!socket || !socket.connected) {
                    return reject(new Error("Socket.IO chưa kết nối!"));
                }
                socket.emit('GET_REMAINING_ACTIONS');

                socket.once('REMAINING_ACTIONS_RESPONSE', (data) => {
                    resolve(data.remainingActions);
                });
            });
        },

        isPlayerTurn() {
            return new Promise((resolve, reject) => {
                if (!socket || !socket.connected) {
                    return reject(new Error("Socket.IO chưa kết nối!"));
                }
                socket.emit('IS_PLAYER_TURN');

                socket.once('IS_PLAYER_TURN_RESPONSE', (data) => {
                    resolve(data.isPlayerTurn);
                });
            });
        },

        endBossTurn() {
            if (!socket) {
                return null;
            }
            socket.emit('END_BOSS_TURN');
        },

        listenEndBossTurn(callback) {
            if (!socket) {
                return null;
            }
            socket.on('END_BOSS_TURN_RESPONSE', () => {
                callback();
            });
        },

        listenBossTurn(callback) {
            if (!socket) {
                return null;
            }
            socket.on('BOSS_TURN', () => {
                callback();
            });
        },

        listenSpawnHealthOrb(callback) {
            if (!socket) {
                return null;
            }
            socket.on('SPAWN_HEALTH_ORB', (data) => {
                console.log('Received health orb spawn data:', data);
                callback(data.healthOrbPosition);
            });
        }

    };
};