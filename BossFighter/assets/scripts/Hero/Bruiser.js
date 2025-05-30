import Character from "../Character";

const BRUISER_ANIMATION = {
    "attack_front": "BruiserFrontAttack",
    "attack_left": "BruiserLeftAttack",
    "attack_back": "BruiserBackAttack",
    "attack_right": "BruiserRightAttack",

    "walk_front": "BruiserBackRun",
    "walk_back": "BruiserFrontRun",
    "walk_left": "BruiserLeftRun",
    "walk_right": "BruiserRightRun",

    "idle": "BruiserIdle",
}

cc.Class({
    extends: Character,

    properties: {
        characterId: "hero001",
        ultimatePrefab: cc.Prefab
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);

    },

    start () {
    },

    initData(characterNameId) {
        this._super(characterNameId);
    },

    ultimate(targetTile, gameCtrl) {
        // const newPos = targetTile

        const newPosX = gameCtrl.firstTile.x + targetTile.x * gameCtrl.tileWidth + gameCtrl.tileWidth / 2;
        const newPosY = gameCtrl.firstTile.y + targetTile.y * gameCtrl.tileHeight + gameCtrl.tileHeight / 2;

        const oldPosX = this.node.x;
        const oldPosY = this.node.y;

        const oldGridX = Math.floor((oldPosX - gameCtrl.firstTile.x) / gameCtrl.tileWidth);
        const oldGridY = Math.floor((oldPosY - gameCtrl.firstTile.y) / gameCtrl.tileHeight);
        
        const ultimate = cc.instantiate(this.ultimatePrefab);
        ultimate.setPosition(this.node.getPosition());
        this.node.parent.addChild(ultimate);

        this.scheduleOnce(() => {
            this.node.x = newPosX;
            this.node.y = newPosY;

            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            gameCtrl.updateWalkable(targetTile.x, targetTile.y,1 , false);
            gameCtrl.updateWalkable(oldGridX, oldGridY, 1, true);
            this.resetUltimateCooldown();
        }, 0.5);
        
    },

    attack(direction) {
        this.playAnimation("attack_" + direction, 0.5);
    },

    playAnimation(animationName, moveTime) {
        const clipName = BRUISER_ANIMATION[animationName];
        if (!clipName) {
            cc.error("Invalid animation name:", animationName);
            return;
        }
        const imageNode = this.node.getChildByName('Image');
        if (!imageNode) {
            cc.error("Không tìm thấy node con image.");
            return;
        }
        const anim = imageNode.getComponent(cc.Animation);
        if (!anim) {
            cc.error("Node 'image' không có component cc.Animation.");
            return;
        }
        const clip = anim.getClips().find(c => c.name === clipName);
        if (!clip) {
            cc.error("Không tìm thấy animation clip:", clipName);
            return;
        }
        if (moveTime && clip.duration > 0) {
            anim.speed = clip.duration / moveTime;
        } else {
            anim.speed = 1;
        }
        anim.play(clipName);
    }

    // update (dt) {},
});
