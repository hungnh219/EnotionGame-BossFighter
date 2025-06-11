// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import Character from "../../Character";

const BOSS3_ANIMATION = {
    "attack_front": "boss3-back-attack",
    "attack_left": "boss3-left-attack",
    "attack_back": "boss3-front-attack",
    "attack_right": "boss3-right-attack",

    "walk_front": "boss3-back-run",
    "walk_back": "boss3-front-run",
    "walk_left": "boss3-left-run",
    "walk_right": "boss3-right-run",
};

cc.Class({
    extends: Character,

    properties: {
        characterId: "boss003",

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // this.initData(this.characterId);
    },

    start () {
    },

    initData(heroData) {
        this.characterId = heroData.bossId || "boss003";
        this.name = heroData.name || "Boss 3";
        this.attackDame = heroData.attackDamage || 10;
        this.attackRange = heroData.attackRange || 1;
        this.maxHp = heroData.maxHp || 100;
        this.health = heroData.hp;


        // await this._super(characterNameId);

        // console.log("ADC initData with characterId:", characterNameId);
        // console.log("ADC properties:", this);
    },

    playAnimation(animationName, moveTime) {
        const clipName = BOSS3_ANIMATION[animationName];
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

    // handle collision with skills
    // onCollisionEnter: function (other, self) {
    //     console.log('Boss3 collided with:', other.node.name);
        
    //     // Check if the other node has a skill component
    //     if (other.node.getComponent('AdcSkill')) {
    //         console.log('Boss3 hit by ADC skill:', other.node.name);
    //         // Call takeDamage on the boss with the skill's damage
    //         this.takeDamage(other.node.getComponent('AdcSkill').damage);
    //     }
    // }

    // update (dt) {},
});
