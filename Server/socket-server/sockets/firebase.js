function firebaseEvents(io, socket, db, admin) {
    console.log('Có client kết nối:', socket.id);
    socket.on('uploadScreenshot', async (data, callback) => {
        console.log('up anh', data, callback)
        const { playerName, score, imageBase64 } = data;

        if (!playerName || !score || !imageBase64) {
            if (callback) {
                callback({ success: false, message: 'Thiếu field' });
            }
            return;
        }

        try {
            await db.collection('leaderboard').add({
                playerName,
                score: Number(score),
                imageBase64,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            if (callback) {
                callback({ success: true, message: 'Lưu ảnh thành công.' });
            }
            console.log(`Ảnh của ${playerName} (score: ${score}) đã được lưu .`);

        } catch (error) {
            console.error('Lỗi khi lưu ảnh:', error);
            if (callback) {
                callback({ success: false, message: 'Lỗi server khi lưu ảnh.' });
            }
        }
    });

    socket.on('requestLeaderboard', async (callback) => {
        try {
            const leaderboardSnapshot = await db.collection('leaderboard')
                .orderBy('score', 'desc')
                .limit(20)
                .get();

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