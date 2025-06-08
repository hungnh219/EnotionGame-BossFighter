import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        leaderboardContent: cc.Node,
        leaderboardEntryPrefab: cc.Prefab,
        statusLabel: cc.Label,
    },

    socketIOManager: null,

    onLoad() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        if (!this.socketIOManager.getSocketIO() || !this.socketIOManager.getSocketIO().connected) {
            this.socketIOManager.connectToSocketIOServer("http://localhost:3000");
        }

        if (this.statusLabel) {
            this.statusLabel.string = "Loading leaderboard...";
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
                    this.statusLabel.string = "Not connected to server.";
                }
                throw new Error("Socket.IO not connected, cannot fetch leaderboard.");
            }

            cc.log("Requesting leaderboard data from server...");
            const result = await new Promise((resolve, reject) => {
                this.socketIOManager.getSocketIO().emit('requestLeaderboard', (response) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message || "Failed to fetch leaderboard data."));
                    }
                });
            });

            cc.log("Leaderboard data received:", result);
            if (this.statusLabel) {
                this.statusLabel.string = "Leaderboard loaded!";
            }
            this.displayLeaderboard(result);

        } catch (error) {
            cc.error("Error fetching leaderboard data:", error);
            if (this.statusLabel) {
                this.statusLabel.string = "Error loading leaderboard: " + error.message;
            }
        }
    },

    async displayLeaderboard(leaderboardEntries) {
        this.leaderboardContent.removeAllChildren();

        if (!leaderboardEntries || leaderboardEntries.length === 0) {
            if (this.statusLabel) {
                this.statusLabel.string = "No leaderboard data available.";
            }
            return;
        }

        // Sort by score in descending order
        leaderboardEntries.sort((a, b) => b.score - a.score);

        for (const entryData of leaderboardEntries) {
            if (!this.leaderboardEntryPrefab) {
                cc.warn("Leaderboard entry prefab is not assigned!");
                continue;
            }

            const entryNode = cc.instantiate(this.leaderboardEntryPrefab);
            entryNode.parent = this.leaderboardContent;

            const playerNameLabel = entryNode.getChildByName("PlayerNameLabel");
            const scoreLabel = entryNode.getChildByName("ScoreLabel");
            const thumbnailSpriteNode = entryNode.getChildByName("ThumbnailSprite");

            if (playerNameLabel && playerNameLabel.getComponent(cc.Label)) {
                playerNameLabel.getComponent(cc.Label).string = entryData.playerName || "Unknown Player";
            }
            if (scoreLabel && scoreLabel.getComponent(cc.Label)) {
                scoreLabel.getComponent(cc.Label).string = `Score: ${entryData.score}`;
            }

            if (thumbnailSpriteNode && thumbnailSpriteNode.getComponent(cc.Sprite) && entryData.imageBase64) {
                try {
                    const spriteFrame = await this.createBase64SpriteFrame(entryData.imageBase64);
                    thumbnailSpriteNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                    thumbnailSpriteNode.width = 40;
                    thumbnailSpriteNode.height = 40;
                } catch (e) {
                    cc.error("Failed to load thumbnail for", entryData.playerName, e);
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
                cc.error("Error loading image from Base64:", error);
                reject(error);
            };
        });
    },

    onBackButtonClick() {
        cc.director.loadScene("MainMenuScene");
    },
});