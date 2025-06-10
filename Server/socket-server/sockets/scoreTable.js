const logicHandler = require('../handler/logicHandler');

function scoreTableEvents(io, socket) {
    socket.on('GET_SCORE_TABLE', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;
        let players = roomData[roomName].player;



        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        // add player name to heroes
        let scoreTable = heroes.map(hero => ({
            totalScore: hero.stats.totalScore,
            // lockedHero: hero.lockedHero,
            heroId: hero.heroId,
        }));

        // add player name to scoreTable
        scoreTable.forEach((score, index) => {
            const playerObj = players.find(p =>
                Object.values(p)[0].order === index
            );
            if (playerObj) {
                const playerInfo = Object.values(playerObj)[0]; // Truy xuất thông tin người chơi
                score.playerName = playerInfo.name;
            } else {
                console.warn('Không tìm thấy người chơi với order:', index);
            }
        });


        scoreTable.sort((a, b) => b.totalScore - a.totalScore);

        io.to(roomName).emit('RETURN_SCORE_TABLE', {
            scoreTable: scoreTable,
        });
    }) 
}

module.exports = scoreTableEvents;