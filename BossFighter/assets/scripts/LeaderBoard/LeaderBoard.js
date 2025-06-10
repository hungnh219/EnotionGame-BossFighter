import SocketIOManager from "../SocketIO/SocketIOManager";
import ImageViewer from "./ImageViewer"

cc.Class({
    extends: cc.Component,

    properties: {
        leaderboardContent: cc.Node,
        leaderboardEntryPrefab: cc.Prefab,
        statusLabel: cc.Label,
        imageViewerPrefab: cc.Prefab,
    },

    socketIOManager: null,
    _imageViewerInstance: null,

    onLoad() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }

        if (this.statusLabel) {
            this.statusLabel.string = "Đang tải bảng xếp hạng...";
        }
        this.leaderboardContent.removeAllChildren();
    },

    start() {
        this.fetchLeaderboardData();
    },

    async fetchLeaderboardData() {
        try {
            if (!this.socketIOManager || !this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
                if (this.statusLabel) {
                    this.statusLabel.string = "Không kết nối được đến máy chủ.";
                }
                throw new Error("Socket.IO không kết nối, không thể tải bảng xếp hạng.");
            }

            cc.log("Đang yêu cầu dữ liệu bảng xếp hạng từ máy chủ...");
            const result = await new Promise((resolve, reject) => {
                this.socketIOManager.getSocketIO().emit('REQUEST_LEADER_BOARD', (response) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message || "Không thể tải dữ liệu bảng xếp hạng."));
                    }
                });
            });

            cc.log("Đã nhận dữ liệu bảng xếp hạng:", result);
            if (this.statusLabel) {
                this.statusLabel.string = "Đã tải bảng xếp hạng!";
            }
            this.displayLeaderboard(result);

        } catch (error) {
            cc.error("Lỗi khi tải dữ liệu bảng xếp hạng:", error);
            if (this.statusLabel) {
                this.statusLabel.string = "Lỗi tải bảng xếp hạng: " + error.message;
            }
        }
    },

    async displayLeaderboard(leaderboardEntries) {
        this.leaderboardContent.removeAllChildren();

        if (!leaderboardEntries || leaderboardEntries.length === 0) {
            if (this.statusLabel) {
                this.statusLabel.string = "Không có dữ liệu bảng xếp hạng.";
            }
            return;
        }

        leaderboardEntries.sort((a, b) => b.score - a.score);

        for (const entryData of leaderboardEntries) {
            if (!this.leaderboardEntryPrefab) {
                cc.warn("Leaderboard entry prefab chưa được gán!");
                continue;
            }

            const entryNode = cc.instantiate(this.leaderboardEntryPrefab);
            entryNode.parent = this.leaderboardContent;

            const playerNameLabel = entryNode.getChildByName("PlayerNameLabel");
            const scoreLabel = entryNode.getChildByName("ScoreLabel");
            const thumbnailSpriteNode = entryNode.getChildByName("ThumbnailSprite");

            if (playerNameLabel && playerNameLabel.getComponent(cc.Label)) {
                playerNameLabel.getComponent(cc.Label).string = entryData.playerName || "Người chơi ẩn danh";
            }
            if (scoreLabel && scoreLabel.getComponent(cc.Label)) {
                scoreLabel.getComponent(cc.Label).string = `Điểm: ${entryData.score}`;
            }

            if (thumbnailSpriteNode && thumbnailSpriteNode.getComponent(cc.Sprite) && entryData.imageBase64) {
                try {
                    const spriteFrame = await this.createBase64SpriteFrame(entryData.imageBase64);
                    thumbnailSpriteNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                    thumbnailSpriteNode.width = 40;
                    thumbnailSpriteNode.height = 40;


                    thumbnailSpriteNode._fullSizeSpriteFrame = spriteFrame;

                    thumbnailSpriteNode.on(cc.Node.EventType.TOUCH_END, this.onThumbnailClick, this);

                } catch (e) {
                    cc.error("Không thể tải thumbnail cho", entryData.playerName, e);
                    thumbnailSpriteNode.getComponent(cc.Sprite).spriteFrame = null;
                }
            } else if (thumbnailSpriteNode && thumbnailSpriteNode.getComponent(cc.Sprite)) {
                thumbnailSpriteNode.getComponent(cc.Sprite).spriteFrame = null;
            }
        }
    },

    createBase64SpriteFrame(base64String) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                const texture = new cc.Texture2D();
                texture.initWithElement(img);
                const spriteFrame = new cc.SpriteFrame(texture);
                resolve(spriteFrame);
            };
            img.onerror = (error) => {
                cc.error("Lỗi khi tải ảnh từ Base64:", error);
                reject(error);
            };
        });
    },

    onThumbnailClick(event) {
        const clickedThumbnailNode = event.currentTarget;
        const fullSizeSpriteFrame = clickedThumbnailNode._fullSizeSpriteFrame;

        if (!fullSizeSpriteFrame) {
            cc.warn("Không có dữ liệu ảnh kích thước đầy đủ cho thumbnail này.");
            return;
        }

        if (!this.imageViewerPrefab) {
            cc.error("ImageViewerPrefab chưa được gán trong editor!");
            return;
        }

        if (!this._imageViewerInstance) {
            const imageViewerNode = cc.instantiate(this.imageViewerPrefab);
            cc.director.getScene().addChild(imageViewerNode);
            this._imageViewerInstance = imageViewerNode.getComponent(ImageViewer);
            if (!this._imageViewerInstance) {
                cc.error("Không tìm thấy script ImageViewer trên prefab đã khởi tạo!");
                return;
            }
        }

        this._imageViewerInstance.show(fullSizeSpriteFrame);
    },

    onBackButtonClick() {
        cc.director.loadScene("MainMenuScene");
    },

    onDestroy() {
        if (this._imageViewerInstance && this._imageViewerInstance.node) {
            this._imageViewerInstance.node.destroy();
            this._imageViewerInstance = null;
        }
    }
});