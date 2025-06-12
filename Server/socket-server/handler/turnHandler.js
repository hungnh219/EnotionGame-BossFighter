module.exports = {
    isPlayerTurn(roomData, roomName) {
        if (!roomData || !roomData[roomName]) {
            console.error("Không tìm thấy dữ liệu phòng.");
            return false;
        }

        const gameState = roomData[roomName].gameState;
        if (!gameState) {
            console.error("Không tìm thấy trạng thái trò chơi hoặc người chơi hiện tại.");
            return false;
        }

        // const currentPlayerId = gameState.currentPlayer.id;
        // const playerList = roomData[roomName].player;

        // for (const player of playerList) {
        //     const playerId = Object.keys(player)[0];
        //     if (playerId === currentPlayerId) {
        //         return true;
        //     }
        // }
        // return false;

        return gameState.turn.isPlayerTurn;
    },

    getRemainActions(roomData, roomName) {
        if (!roomData || !roomData[roomName]) {
            console.error("Không tìm thấy dữ liệu phòng.");
            return 0;
        }

        const gameState = roomData[roomName].gameState;

        if (gameState.turn.isPlayerTurn === false) {
            console.error("Hiện tại không phải lượt của người chơi.");
            return 0;
        }
        
        return gameState.turn.remainingPlayerActions;
    },
}