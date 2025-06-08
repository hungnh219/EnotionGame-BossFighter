module.exports = function (socket) {

    return {
        async sendDataToBackend(data) {
            try {

                const result = await new Promise((resolve, reject) => {
                    if (!socket || !socket.connected) {
                        return reject(new Error("Socket.IO chưa kết nối!"));
                    }
                    socket.emit('uploadScreenshot', data, (response) => {
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
    };
};