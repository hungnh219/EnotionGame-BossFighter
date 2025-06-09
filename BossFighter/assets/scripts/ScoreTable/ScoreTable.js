import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        uploadButton: cc.Button,
        statusLabel: cc.Label,
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

        let imageBase64 = '';
        try {
            imageBase64 = await this.captureScreenshotToBase64();
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
                this.statusLabel.string = "Lỗi chụp màn hình: " + error;
            }
            return;
        }

        const playerName = `Player_ ${Math.floor(Math.random() * 5000) + 1000}`;
        const score = Math.floor(Math.random() * 5000) + 1000;
        const dataToSend = {
            playerName: playerName,
            score: score,
            imageBase64: imageBase64
        };

        try {
            result = await this.socketIOManager.scoreTable.sendDataToBackend(dataToSend)
            if (result) {
                if (this.statusLabel) {
                    this.statusLabel.string = "Tải lên thành công! " + result;
                }
            }
        } catch (error) {
            if (this.statusLabel) {
                this.statusLabel.string = "Lỗi tải lên: " + error.message;
            }
        }

    },

    async captureScreenshotToBase64() {

        return new Promise((resolve, reject) => {

            const width = cc.Canvas.instance.node.width;
            const height = cc.Canvas.instance.node.height;

            // Tạo một texture render mới để lưu trữ ảnh chụp
            let renderTexture = new cc.RenderTexture();
            renderTexture.initWithSize(width, height);
            let cameraNode = new cc.Node();
            cameraNode.parent = cc.Canvas.instance.node;
            let camera = cameraNode.addComponent(cc.Camera);
            camera.zoomRatio = 1;
            // Chụp tất cả các layer
            camera.cullingMask = 0xFFFFFFFF;
            camera.targetTexture = renderTexture;
            camera.render(cc.Canvas.instance.node);
            let data = renderTexture.readPixels();
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            let imageData = ctx.createImageData(width, height);

            let rowBytes = width * 4;

            for (let row = 0; row < height; row++) {

                let srow = height - 1 - row;
                let dataSrc = new Uint8Array(data.buffer, srow * rowBytes, rowBytes);

                let dataDst = new Uint8Array(imageData.data.buffer, row * rowBytes, rowBytes);

                dataDst.set(dataSrc);

            }

            ctx.putImageData(imageData, 0, 0);

            // Chuyển canvas thành chuỗi Base64 

            const base64String = canvas.toDataURL("image/png");

            renderTexture.destroy();

            cameraNode.destroy();

            resolve(base64String);

        });

    },
});