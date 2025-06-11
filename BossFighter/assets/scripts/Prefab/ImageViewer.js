cc.Class({
    extends: cc.Component,

    properties: {
        bgOverlay: cc.Node,
        zoomedImageSprite: cc.Sprite
    },

    onLoad() {
        this.node.active = false;

        if (this.bgOverlay) {
            this.bgOverlay.on(cc.Node.EventType.TOUCH_END, this.hide, this);
        }
    },

    show(imageSource) {
        if (!this.zoomedImageSprite) {
            cc.error("ZoomedImageSprite chưa được gán!");
            return;
        }

        let spriteFrame = null;
        if (imageSource instanceof cc.RenderTexture) {
            spriteFrame = new cc.SpriteFrame();
            spriteFrame.setTexture(imageSource);
        } else if (imageSource instanceof cc.SpriteFrame) {
            spriteFrame = imageSource;
        } else if (imageSource instanceof cc.Texture2D) {
            spriteFrame = new cc.SpriteFrame(imageSource);
        } else {
            cc.error("Loại nguồn ảnh không được hỗ trợ để hiển thị!");
            return;
        }

        this.zoomedImageSprite.spriteFrame = spriteFrame;

        const imageWidth = spriteFrame.getOriginalSize().width;
        const imageHeight = spriteFrame.getOriginalSize().height;

        const screenWidth = cc.director.getWinSize().width;
        const screenHeight = cc.director.getWinSize().height;

        let scaleFactor = Math.min(screenWidth / imageWidth, screenHeight / imageHeight) * 0.8;

        this.zoomedImageSprite.node.width = imageWidth * scaleFactor;
        this.zoomedImageSprite.node.height = imageHeight * scaleFactor;

        this.node.active = true;
        this.node.opacity = 0;
        this.node.runAction(cc.fadeTo(0.2, 255));

        this.zoomedImageSprite.node.scale = 0.5;
        this.zoomedImageSprite.node.runAction(cc.scaleTo(0.2, 1.0).easing(cc.easeBackOut()));
    },

    hide() {
        if (!this.node.active) return;

        this.node.runAction(cc.sequence(
            cc.fadeTo(0.2, 0),
            cc.callFunc(() => {
                this.node.active = false;
                this.zoomedImageSprite.spriteFrame = null;
            })
        ));
        this.zoomedImageSprite.node.runAction(cc.scaleTo(0.2, 0.5).easing(cc.easeBackIn()));
    },
});