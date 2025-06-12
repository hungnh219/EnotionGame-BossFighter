const logicHandler = require('../handler/logicHandler');
const { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } = require('firebase/firestore');

function firebaseEvents(io, socket, db) {
    console.log('Có client kết nối:', socket.id);

    socket.on('UPLOAD_SCREEN_SHOT', async (data, callback) => {
        const { imageBase64 } = data;

        if (!imageBase64) {
            if (typeof callback === 'function') {
                return callback({ success: false, message: 'Thiếu ảnh (imageBase64)' });
            }
            return;
        }

        const roomData = logicHandler.common.readRoomData();

        const roomId = Object.keys(roomData).find(id => {
            const room = roomData[id];
            return room && room.player && room.player.some(p => Object.keys(p)[0] === socket.id);
        });

        if (!roomId) {
            if (typeof callback === 'function') {
                return callback({ success: false, message: 'Không tìm thấy phòng chứa người chơi này.' });
            }
            return;
        }

        const room = roomData[roomId];
        const players = room.player || [];
        const heroes = (room.gameState && room.gameState.heroes) || [];

        const playerEntry = players.find(p => Object.keys(p)[0] === socket.id);
        if (!playerEntry) {
            if (typeof callback === 'function') {
                return callback({ success: false, message: 'Không tìm thấy thông tin người chơi.' });
            }
            return;
        }

        const playerData = playerEntry[socket.id];
        const playerName = (playerData && playerData.name) || `Player_${Math.floor(Math.random() * 10000)}`;

        const hero = heroes.find(h => h.id === socket.id);
        const score = (hero && hero.stats && hero.stats.totalScore) || 0;

        try {
            await addDoc(collection(db, 'leaderboard'), {
                playerName: playerName,
                score: Number(score),
                imageBase64: imageBase64,
                createdAt: serverTimestamp()
            });

            if (typeof callback === 'function') {
                callback({ success: true, message: 'Lưu ảnh thành công.' });
            }
            console.log(`Đã lưu ảnh từ ${playerName} (score: ${score})`);
        } catch (error) {
            console.error('Lỗi khi lưu ảnh:', error);
            if (typeof callback === 'function') {
                callback({ success: false, message: 'Lỗi server khi lưu ảnh.' });
            }
        }
    });

    socket.on('REQUEST_LEADER_BOARD', async (callback) => {
        try {
            const q = query(
                collection(db, 'leaderboard'),
                orderBy('score', 'desc'),
                limit(20)
            );
            const leaderboardSnapshot = await getDocs(q);

            const leaderboardData = [];
            leaderboardSnapshot.forEach(doc => {
                const data = doc.data();

                leaderboardData.push({
                    id: doc.id,
                    playerName: data.playerName,
                    score: data.score,
                    imageBase64: data.imageBase64
                });
            });

            if (callback) {
                callback({ success: true, data: leaderboardData, message: 'Leaderboard loaded successfully.' });
            }
            console.log(`Leaderboard data fetched and sent to client. Total entries: ${leaderboardData.length}`);

        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu Leaderboard từ Firestore:', error);
            if (callback) {
                callback({ success: false, message: 'Lỗi server khi tải bảng xếp hạng.' });
            }
        }
    });
}

module.exports = firebaseEvents;