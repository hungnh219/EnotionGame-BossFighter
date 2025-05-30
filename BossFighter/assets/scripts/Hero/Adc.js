import Character from "../Character";

const ADC_ANIMATION = {
    "attack_front": "AdcFrontAttack",
    "attack_back": "AdcBackAttack",
    "attack_left": "AdcLeftAttack",
    "attack_right": "AdcRightAttack",

    "walk_front": "AdcBackRun",
    "walk_back": "AdcFrontRun",
    "walk_left": "AdcLeftRun",
    "walk_right": "AdcRightRun",

    "idle": "idle",
}

cc.Class({
    extends: Character,

    properties: {
        characterId: "hero002",

        ultimatePrefab: cc.Prefab,
        attackPrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
        // this._super.initData('123');
    },

    initData(characterNameId) {
        this._super(characterNameId);

        console.log("ADC initData with characterId:", characterNameId);
        console.log("ADC properties:", this);
    },

    attack(enemy){
        console.log('Damge cua tuong', this.attackDame)
        if(this.attackPrefab){
            const attackNode = cc.instantiate(this.attackPrefab);
            attackNode.setPosition(this.node.getPosition());
            this.node.parent.addChild(attackNode)
            attackNode.mainScript = attackNode.getComponents(cc.Component).find(c=> typeof c.initDirection === 'function')

            if(attackNode.mainScript){
                attackNode.mainScript.initDirection(enemy, this.attackDame)
            }
        }
        else{
            cc.error('Attack prefab is not set for ADC')
        }
    },

    ultimate(enemy) {
        let dame = this.ultimateDame;
        console.log("Ultimate skill activated with damage:", dame);
        if (this.ultimatePrefab) {
            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            ultimate.mainScript = ultimate.getComponents(cc.Component).find(c => typeof c.initDirection === 'function');

            if (ultimate.mainScript) {
                ultimate.mainScript.initDirection(enemy, this.ultimateDame);
            }

            this.resetUltimateCooldown();
        } else {
            cc.error("Ultimate prefab is not set for ADC.");
        }
    },

    playAnimation(animationName, moveTime) {
        const clipName = ADC_ANIMATION[animationName];
        if (!clipName) {
            cc.error("Invalid animation name:", animationName);
            return;
        }
        const imageNode = this.node.getChildByName('Image');
        if (!imageNode) {
            cc.error("Không tìm thấy node con 'image' trên ADC.");
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
    attackAnimation(direction) {
        this.playAnimation("attack_" + direction, 0.5);
    },
    attack(enemy, direction){
        console.log('Damge cua tuong', this.attackDame)
        if(this.attackPrefab){
            this.attackAnimation(direction);
            const attackNode = cc.instantiate(this.attackPrefab);
            attackNode.setPosition(this.node.getPosition());
            this.node.parent.addChild(attackNode)
            attackNode.mainScript = attackNode.getComponents(cc.Component).find(c=> typeof c.initDirection === 'function')

            if(attackNode.mainScript){
                attackNode.mainScript.initDirection(enemy, this.attackDame)
            }
        }
        else{
            cc.error('Attack prefab is not set for ADC')
        }
    },

    // update (dt) {},
});
