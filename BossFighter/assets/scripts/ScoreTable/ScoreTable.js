import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        targetNode: cc.Node
    },

    socketIOManager: null,
    onLoad() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }

    },

    async start() {
        await this.onAutoUploadImage()
    },

    async onAutoUploadImage() {
        cc.log("Button clicked! Đang chuẩn bị tải lên ảnh màn hình...");
        let renderTextureResult = null;
        let imageBase64 = '';
        try {
            renderTextureResult = await this.captureUINode(this.targetNode);
            console.log('renderTextureResult', renderTextureResult)

            if (!renderTextureResult) {
                throw new Error("Không thể chụp node UI hoặc RenderTexture bị null.");
            }

            imageBase64 = await this.renderTextureToBase64(renderTextureResult)

            if (!imageBase64) {
                throw new Error("Không thể chụp màn hình hoặc tạo ảnh Base64.");
            }

            cc.log("Đã chụp màn hình và tạo Base64 thành công.");
            console.log(imageBase64)
        } catch (error) {
            cc.error("Lỗi khi chụp màn hình:", error);

            if (renderTextureResult && renderTextureResult instanceof cc.RenderTexture) {
                renderTextureResult.destroy();
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
            cc.log("Đã chụp màn hình và tạo Base64 thành công." + result);
        } catch (error) {
            cc.log("Lỗi tải lên." + error.message);
        }

    },
    async captureUINode(targetNode) {
        if (!targetNode || targetNode.width <= 0 || targetNode.height <= 0) {
            cc.error("Node UI không hợp lệ hoặc kích thước không phù hợp để chụp:", targetNode);
            return null;
        }

        const width = targetNode.width;
        const height = targetNode.height;

        const renderTexture = new cc.RenderTexture();

        renderTexture.initWithSize(width, height, cc.gfx.FMT_RGBA8888, cc.RenderTexture.DepthStencilFormat.NONE);

        const cameraNode = new cc.Node("TempCaptureCamera");
        cc.director.getScene().addChild(cameraNode);
        const camera = cameraNode.addComponent(cc.Camera);

        camera.zoomRatio = 1.5;
        camera.cullingMask = 0xFFFFFFFF;
        camera.targetTexture = renderTexture;
        camera.enabled = true;

        const worldPos = targetNode.convertToWorldSpaceAR(cc.v2(0, 0));
        cameraNode.x = worldPos.x;
        cameraNode.y = worldPos.y;

        console.log('cameraNode.x', cameraNode.x)
        console.log('cameraNode.y', cameraNode.y)

        cameraNode.zIndex = cc.macro.MAX_Z_INDEX;

        camera.render(targetNode);

        return new Promise((resolve) => {
            this.scheduleOnce(() => {
                camera.targetTexture = null;
                cameraNode.destroy();
                resolve(renderTexture);
            }, 0.1);
        });
    },

    renderTextureToBase64(renderTexture) {
        console.log('renderTexture duoc truyen vao ', renderTexture)

        if (!renderTexture || !(renderTexture instanceof cc.RenderTexture)) {
            console.error("renderTexture không hợp lệ.");
            return null;
        }

        const width = renderTexture.width;
        const height = renderTexture.height;
        const pixels = renderTexture.readPixels();

        if (!pixels) {
            console.error("Không đọc được pixel từ RenderTexture.");
            return null;
        }

        // Tạo canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        console.log('width ', canvas.width, 'height ', canvas.height)

        if (!ctx) {
            console.error("Không tạo được context 2D.");
            return null;
        }

        // Cocos trả pixel dạng RGBA, ngược chiều Y => cần đảo ngược hàng
        const imageData = ctx.createImageData(width, height);
        const rowBytes = width * 4;

        for (let y = 0; y < height; y++) {
            const srow = height - 1 - y; // Hàng nguồn (ngược)
            const dataSrc = new Uint8Array(pixels.buffer, srow * rowBytes, rowBytes);
            const dataDst = new Uint8Array(imageData.data.buffer, y * rowBytes, rowBytes);
            dataDst.set(dataSrc);
        }

        ctx.putImageData(imageData, 0, 0);

        // Trả về Base64 PNG
        return canvas.toDataURL("image/png");
    }
});