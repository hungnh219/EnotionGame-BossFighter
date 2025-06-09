import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        uploadButton: cc.Button,
        statusLabel: cc.Label,
        targetNode: cc.Node, 
    },

    socketIOManager: null,
    onLoad: function () {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }

        if (this.uploadButton) {
            this.uploadButton.node.on('click', this.onUploadButtonClick, this);
        } else {
            cc.error("uploadButton không được gán!");
        }

        if (this.statusLabel) {
            this.statusLabel.string = "Sẵn sàng tải lên.";
        }
    },

    async onUploadButtonClick() {
        cc.log("Button clicked! Đang chuẩn bị tải lên ảnh màn hình...");
        if (this.statusLabel) {
            this.statusLabel.string = "Đang chụp màn hình...";
        }

        setTimeout(async () => {
            let imageBase64 = '';
            try {
                // Kiểm tra lại targetNode trước khi chụp
                if (!this.targetNode || !cc.isValid(this.targetNode)) {
                    throw new Error("Node mục tiêu để chụp ảnh không hợp lệ hoặc chưa được gán.");
                }

                // Gọi hàm chụp ảnh với targetNode
                imageBase64 = await this.captureScreenshotToBase64(this.targetNode);
                if (!imageBase64) {
                    throw new Error("Không thể chụp màn hình hoặc tạo ảnh Base64.");
                }
                cc.log("Đã chụp màn hình và tạo Base64 thành công.");
                if (this.statusLabel) {
                    this.statusLabel.string = "Đã chụp màn hình, đang gửi...";
                }
            } catch (error) {
                cc.error("Lỗi khi chụp màn hình:", error);
                if (this.statusLabel) {
                    this.statusLabel.string = "Lỗi chụp màn hình: " + error.message; // Hiển thị chi tiết lỗi hơn
                }
                return;
            }

            const playerName = `Player_${Math.floor(Math.random() * 5000) + 1000}`;
            const score = Math.floor(Math.random() * 5000) + 1000;
            const dataToSend = {
                playerName: playerName,
                score: score,
                imageBase64: imageBase64
            };

            try {
                let result;
                // Đảm bảo this.socketIOManager.scoreTable tồn tại trước khi gọi hàm
                if (this.socketIOManager && this.socketIOManager.scoreTable && typeof this.socketIOManager.scoreTable.sendDataToBackend === 'function') {
                    result = await this.socketIOManager.scoreTable.sendDataToBackend(dataToSend);
                    if (result) {
                        if (this.statusLabel) {
                            this.statusLabel.string = "Tải lên thành công! " + result;
                        }
                    }
                } else {
                    throw new Error("SocketIOManager hoặc scoreTable không sẵn sàng, hoặc hàm sendDataToBackend không tồn tại.");
                }
            } catch (error) {
                if (this.statusLabel) {
                    this.statusLabel.string = "Lỗi tải lên: " + error.message;
                }
                cc.error("Lỗi khi gửi dữ liệu lên server:", error);
            }
        }, 0); // Kết thúc setTimeout
        // --- Kết thúc phần setTimeout ---
    },


    async captureScreenshotToBase64(targetNode) { // Hàm nhận vào targetNode
        return new Promise((resolve, reject) => {
            // Kiểm tra node có hợp lệ không
            if (!targetNode || !cc.isValid(targetNode)) {
                cc.error("Node không hợp lệ để chụp ảnh.");
                return reject(new Error("Node không hợp lệ hoặc đã bị hủy."));
            }

            // Lấy kích thước của targetNode
            const width = Math.floor(targetNode.width);
            const height = Math.floor(targetNode.height);

            if (width <= 0 || height <= 0) {
                cc.warn("Node có kích thước bằng 0 hoặc âm, không thể chụp.");
                return reject(new Error("Node có kích thước không hợp lệ."));
            }

            // 1. Tạo một RenderTexture với kích thước của targetNode
            const renderTexture = new cc.RenderTexture();
            // Sử dụng FMT_RGBA8888 để đảm bảo chất lượng và kênh alpha
            renderTexture.initWithSize(width, height, cc.gfx.FMT_RGBA8888);


            // 2. Tạo một Camera tạm thời
            const cameraNode = new cc.Node();
            // Thêm camera vào Scene gốc để đảm bảo nó hoạt động
            cc.director.getScene().addChild(cameraNode);
            const camera = cameraNode.addComponent(cc.Camera);

            // 3. Cấu hình Camera
            camera.targetTexture = renderTexture;
            camera.backgroundColor = cc.color(0, 0, 0, 0); // Đặt nền trong suốt
            camera.clearFlags = cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH;

            // ✨ Dòng này đã được loại bỏ ✨
            // camera.projection = cc.Camera.Projection.ORTHO; 
            
            camera.zoomRatio = 1;

            // Đảm bảo camera render TẤT CẢ các group (layer)
            camera.cullingMask = 0xFFFFFFFF; // Chụp tất cả các bit của culling mask


            // 4. Định vị camera để chụp đúng targetNode
            // Lấy vị trí trung tâm của targetNode trong không gian thế giới
            const worldPos = targetNode.convertToWorldSpaceAR(
                cc.v2(targetNode.anchorX * targetNode.width, targetNode.anchorY * targetNode.height)
            );
            // Đặt vị trí cameraNode vào vị trí đó trong không gian cục bộ của parent cameraNode
            cameraNode.position = cameraNode.parent.convertToNodeSpaceAR(worldPos);


            // 5. Render CHỈ targetNode vào camera
            camera.render(targetNode);

            // 6. Đọc dữ liệu pixel và chuyển sang Base64
            // Sử dụng scheduleOnce để đảm bảo việc render hoàn tất trước khi đọc pixel
            this.scheduleOnce(() => {
                let data = null;
                try {
                    data = renderTexture.readPixels();
                } catch (e) {
                    cc.error("Lỗi đọc pixel từ RenderTexture:", e);
                    // Dọn dẹp ngay cả khi lỗi
                    if (cc.isValid(cameraNode)) cameraNode.destroy();
                    if (cc.isValid(renderTexture)) renderTexture.destroy();
                    return reject(new Error("Không đọc được pixel từ RenderTexture: " + e.message));
                }

                if (!data || data.length === 0) {
                    // Dọn dẹp ngay cả khi dữ liệu rỗng
                    if (cc.isValid(cameraNode)) cameraNode.destroy();
                    if (cc.isValid(renderTexture)) renderTexture.destroy();
                    return reject(new Error("Không đọc được pixel từ RenderTexture hoặc dữ liệu rỗng."));
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;

                const imageData = ctx.createImageData(width, height);
                const rowBytes = width * 4;

                // Đảo ngược dữ liệu pixel (Cocos Creator đọc từ dưới lên trên, HTML Canvas từ trên xuống)
                for (let row = 0; row < height; row++) {
                    let srow = height - 1 - row; // Hàng nguồn (từ dưới lên)
                    let dataSrc = new Uint8Array(data.buffer, srow * rowBytes, rowBytes);
                    let dataDst = new Uint8Array(imageData.data.buffer, row * rowBytes, rowBytes);
                    dataDst.set(dataSrc);
                }

                ctx.putImageData(imageData, 0, 0);
                const base64String = canvas.toDataURL("image/png");

                // 7. Dọn dẹp tài nguyên
                // Kiểm tra tính hợp lệ trước khi destroy để tránh lỗi nếu đã bị destroy trước đó
                if (cc.isValid(renderTexture)) {
                    renderTexture.destroy();
                }
                if (cc.isValid(cameraNode)) {
                    cameraNode.destroy();
                }

                resolve(base64String);
            }, 0); // Lên lịch cho frame tiếp theo để đảm bảo quá trình render hoàn tất
        });
    }
});