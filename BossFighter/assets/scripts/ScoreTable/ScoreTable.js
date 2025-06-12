import SocketIOManager from "../SocketIO/SocketIOManager";
import scoreTableItem from "../Prefab/ScoreTableItem";

cc.Class({
    extends: cc.Component,

    properties: {
        targetNode: cc.Node,
        scoreTableContent: cc.Node,
        scoreTableItem: cc.Prefab
    },

    socketIOManager: null,
    async onLoad() {

        this.scoreTableContent.removeAllChildren();

        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        this.prefabScript = this.node.getComponent("PrefabFactory");

        this.heroPrefabs = this.prefabScript.getAllPrefab();
    },

    async start() {
        this.viewScoreTable();
        await this.onAutoUploadImage()
    },

    async onAutoUploadImage() {
        let renderTextureResult = null;
        let imageBase64 = '';
        try {
            renderTextureResult = await this.captureUINode(this.targetNode);
            console.log('renderTextureResult', renderTextureResult)

            imageBase64 = await this.renderTextureToBase64(renderTextureResult)

        } catch (error) {
            if (renderTextureResult && renderTextureResult instanceof cc.RenderTexture) {
                renderTextureResult.destroy();
            }
            return;
        }
        const dataToSend = {
            imageBase64: imageBase64
        };

        try {
            await this.socketIOManager.scoreTable.sendDataToBackend(dataToSend)
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
    },

    async viewScoreTable() {
        let scoreTable = await this.socketIOManager.scoreTable.getScoreTable();
        console.log('scoreTable', scoreTable)
        // this.scoreTableContent.node.removeAllChildren();
        console.log('scoreTable', scoreTable)
        if (!scoreTable || scoreTable.length === 0) {
            cc.log("Không có dữ liệu bảng điểm để hiển thị.");
            return;
        }

        scoreTable.forEach((score, index) => {
            cc.log(`Hạng ${index + 1}: ${score.playerName} - Điểm: ${score.totalScore} - ${score.heroId}`);
            let heroAvatarSprite = this.getHeroAvatar(score.heroId);
            let heroName = score.playerName || `Unknown Hero`;
            let heroScore = score.totalScore || 0;


            // truyền data vào prefab
            const scoreTableNode = cc.instantiate(this.scoreTableItem)
            console.log(scoreTableNode)



            const scoreTableItemComp = scoreTableNode.getComponent(scoreTableItem);

            if (scoreTableItemComp) {

                const playerNameLabel = scoreTableItemComp.playerNameLabel.getComponent(cc.Label)
                playerNameLabel.string = heroName
                // scoreTableItemComp.playerNameLabel.string = heroName;

                const playerScoreLabel = scoreTableItemComp.playerScoreLabel.getComponent(cc.Label)
                playerScoreLabel.string = heroScore.toString();
                // scoreTableItemComp.playerScoreLabel.string = heroScore.toString();

                const playerImageSprite = scoreTableItemComp.playerImageSprite.getComponent(cc.Sprite)
                playerImageSprite.spriteFrame = heroAvatarSprite.spriteFrame;

                playerImageSprite.type = cc.Sprite.Type.SIMPLE;
                playerImageSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

                playerImageSprite.node.width = 40;
                playerImageSprite.node.height = 40;
            }

            this.scoreTableContent.addChild(scoreTableNode);
        });
    },



    getHeroAvatar(heroId) {
        if (!this.heroPrefabs) {
            return null;
        }
        for (const heroPrefab of this.heroPrefabs) {
            const hero = cc.instantiate(heroPrefab);
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getCharacterInfo === 'function');

            if (hero.mainScript) {
                let info = hero.mainScript.getCharacterInfo();
                if (info.characterId === heroId) {
                    console.warn("hero", hero, "avatar", info.avatar);
                    return info.avatar;
                }
            }
        }
        return null;
    },

    async moveToRoomSelect() {
        await this.socketIOManager.room.leaveRoom()
        cc.director.loadScene("RoomSelect");
    },

    async moveToLeaderBoard() {
        await this.socketIOManager.room.leaveRoom()
        cc.director.loadScene("LeaderBoard");
    }
});