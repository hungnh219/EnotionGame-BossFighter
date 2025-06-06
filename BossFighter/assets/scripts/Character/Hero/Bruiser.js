import Character from "../Character"

const BRUISER_ANIMATION = {
    "attack_front": "BruiserBackAttack",
    "attack_left": "BruiserLeftAttack",
    "attack_back": "BruiserFrontAttack",
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

    onLoad() {
        this.initData(this.characterId);
    },

    start() {
    },

    async initData(characterNameId) {
        await this._super(characterNameId);
    },

    ultimate(targetTile, gameCtrl) {
        const newPosX = targetTile.x * gameCtrl.tileWidth + gameCtrl.tileWidth / 2;
        const newPosY = targetTile.y * gameCtrl.tileHeight + gameCtrl.tileHeight / 2;

        const oldPosX = this.node.x;
        const oldPosY = this.node.y;

        const oldGridX = Math.floor((oldPosX) / gameCtrl.tileWidth);
        const oldGridY = Math.floor((oldPosY) / gameCtrl.tileHeight);

        const ultimate = cc.instantiate(this.ultimatePrefab);
        ultimate.setPosition(this.node.getPosition());
        this.node.parent.addChild(ultimate);

        this.scheduleOnce(() => {
            this.node.x = newPosX;
            this.node.y = newPosY;

            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            this.resetUltimateCooldown();
        }, 0.5);

    },

    async attack(enemy, direction) {
        this.playAnimation("attack_" + direction, 0.5);

        return this.attackDame;
    },

    playAnimation(animationName, moveTime) {
        console.log("Bruiser playAnimation with name:", animationName, "and moveTime:", moveTime);
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
