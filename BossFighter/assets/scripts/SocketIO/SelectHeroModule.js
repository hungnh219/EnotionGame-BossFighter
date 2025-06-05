module.exports = function(socket) {
    return {
        clickHero(heroIndex) {
            socket.emit('SELECT_HERO', heroIndex);
        },

        lockHero(heroIndex) {
            console.log('Yêu cầu khóa hero với chỉ số:', heroIndex);
            socket.emit('LOCK_HERO', heroIndex);
        },

        listenHeroSelection(updateHeroSelectionCallback) {
            socket.on('HERO_SELECTED', (data) => {
                console.log('Hero selected by client:', data.clickHeroArray);
                updateHeroSelectionCallback(data.clickHeroArray);
            })
        },

        listenHeroLock(updateHeroLockCallback) {
            socket.on('HERO_LOCKED', (data) => {
                console.log('Hero locked by client:', data.lockedHeroArray);
                updateHeroLockCallback(data.lockedHeroArray);
            })
        },

        listenPlayGame(playGameCallback) {
            socket.on('GAME_STARTED', () => {
                console.log('Trò chơi đã bắt đầu!');
                if (playGameCallback) {
                    playGameCallback();
                }
            });
        },

        playGame() {
            if (!socket) {
                console.error("Chưa kết nối đến Socket.IO server.");
                return null;
            }

            socket.emit('PLAY_GAME');
        },
        

        getGameStartData() {
            return new Promise((resolve, reject) => {
                socket.on('GAME_START_DATA_SELECT', (data) => {
                    console.log('Nhận dữ liệu bắt đầu trò chơi:', data);
                    resolve(data);
                });

                socket.emit('GET_GAME_START_DATA');
            }
        )},

        getPlayerIndex(startGameData) {
            let currentSocketId = socket.id;

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
        },

        

    }
}