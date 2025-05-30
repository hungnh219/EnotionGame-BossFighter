import Character from "../Character";

const TANKER_ANIMATION = {
    "attack_front": "TankerFrontAttack",
    "attack_back": "TankerBackAttack",
    "attack_left": "TankerLeftAttack",
    "attack_right": "TankerRightAttack",

    "walk_front": "TankerBackRun",
    "walk_back": "TankerFrontRun",
    "walk_left": "TankerLeftRun",
    "walk_right": "TankerRightRun",

    "idle": "TankerIdle",
}

cc.Class({
    extends: Character,

    properties: {
        characterId: "hero004",
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
        
    },

    ultimate() {

    },
    initData(characterNameId) {
        this._super(characterNameId);
    },

    playAnimation(animationName, moveTime) {
        const clipName = TANKER_ANIMATION[animationName];
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
    },

    attack(direction) {
        this.playAnimation("attack_" + direction, 0.5);
    },

    // update (dt) {},
});
