module.exports = function (socket) {

    return {
        async sendDataToBackend(data) {
            try {

                const result = await new Promise((resolve, reject) => {
                    if (!socket || !socket.connected) {
                        return reject(new Error("Socket.IO chưa kết nối!"));
                    }
                    socket.emit('UPLOAD_SCREEN_SHOT', data, (response) => {
                        if (response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response.message || "Lỗi không xác định từ server."));
                        }
                    });
                });

                cc.log("Dữ liệu đã được gửi thành công:", result);

            } catch (error) {
                cc.error("Lỗi khi gửi dữ liệu lên backend qua Socket.IO:", error);
            }
        },

        getScoreTable() {
            if (!socket || !socket.connected) {
                return reject(new Error("Socket.IO chưa kết nối!"));
            }
            
            return new Promise((resolve) => {
                socket.on('RETURN_SCORE_TABLE', (data) => {
                    console.log('Received score table data:', data);
                    resolve(data.scoreTable);
                });
                socket.emit('GET_SCORE_TABLE');
            });    
        }
    };
};