import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        targetNode: cc.Node,

        scoreTableContent: cc.Node
    },

    socketIOManager: null,
    async onLoad() {
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

            if (!renderTextureResult) {
                throw new Error("Không thể chụp node UI hoặc RenderTexture bị null.");
            }

            imageBase64 = await this.renderTextureToBase64(renderTextureResult)

            if (!imageBase64) {
                throw new Error("Không thể chụp màn hình hoặc tạo ảnh Base64.");
            }
        } catch (error) {
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
        // this.scoreTableContent.node.removeAllChildren();
        console.log('scoreTable', scoreTable)
        if (!scoreTable || scoreTable.length === 0) {
            cc.log("Không có dữ liệu bảng điểm để hiển thị.");
            return;
        }

        scoreTable.forEach((score, index) => {
            // cc.log(`Hạng ${index + 1}: ${score.playerName} - Điểm: ${score.totalScore}`);
            let heroAvatarSprite = this.getHeroAvatar(score.heroId);
            let heroName = score.playerName || `Unknown Hero`;
            let heroScore = score.totalScore || 0;


            // truyền data vào prefab
            
            // let avatarSprite = new cc.Node("AvatarSprite");
            // let spriteComponent = heroAvatarSprite.addComponent(cc.Sprite);
            // spriteComponent.spriteFrame = heroAvatarSprite.spriteFrame;
            // avatarSprite.addComponent(cc.Sprite).spriteFrame = spriteComponent.spriteFrame;
            // // avatarSprite.setContentSize(24, 24); // Set size for avatar
            // avatarSprite.width = 8;
            // avatarSprite.height = 8;
            // // avatarSprite.scale = 0.05; // Scale down the avatar

            // let nameLabel = new cc.Node("NameLabel");
            // let labelComponent = nameLabel.addComponent(cc.Label);
            // labelComponent.string = `${heroName} - Hạng ${index + 1}`;

            // let scoreLabel = new cc.Node("ScoreLabel");
            // let scoreLabelComponent = scoreLabel.addComponent(cc.Label);
            // scoreLabelComponent.string = `Điểm: ${heroScore}`;


            // this.scoreTableContent.addChild(avatarSprite);
            // this.scoreTableContent.addChild(nameLabel);
            // this.scoreTableContent.addChild(scoreLabel);
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
                    return info.avatar;
                }
            }
        }
        return null;
    }
});