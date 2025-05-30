import Character from "../Character";

const VAMPIRE_ANIMATION = {
    "attack_front": "VampireFrontAttack",
    "attack_left": "VampireLeftAttack",
    "attack_back": "VampireBackAttack",
    "attack_right": "VampireRightAttack",

    "walk_front": "VampireBackRun",
    "walk_back": "VampireFrontRun",
    "walk_left": "VampireLeftRun",
    "walk_right": "VampireRightRun",

    "idle": "VampireIdle",
}

cc.Class({
    extends: Character,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        characterId: "hero003",
        damage: 10, // Damage dealt by the ultimate skill
        range: 1, // Range of the ultimate skill
        ultimatePrefab: cc.Prefab, // Prefab for the ultimate skill effect
        attackPrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
    },

    initData(characterNameId) {
        this._super(characterNameId);
        console.log("Vampire initData with characterId:", characterNameId);
        console.log("Vampire properties:", this);
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

    ultimate(centerGridPos, spawnAnimationCallback) {
        this.damage = this.ultimateDame || this.damage; // Ensure damage is set to ultimate damage

        console.log('Vampire ultimate skill used at position:', centerGridPos, this.damage);
        const affactedTile = [];
        for (let i = -this.range; i <= this.range; i++) {
            for (let j = -this.range; j <= this.range; j++) {
                // const tilePos = cc.v2(centerGridPos.x + i, centerGridPos.y + j);
                const tile = {
                    x: centerGridPos.x + i,
                    y: centerGridPos.y + j
                }
                affactedTile.push(tile);
                let times = (i == 0 && j == 0) ? 4 : 2;

                console.log(this.damage)
                spawnAnimationCallback(this.ultimatePrefab ,tile, times, this.ultimateDame);
                
            }
        }

        this.resetUltimateCooldown();
    },

    playAnimation(animationName, moveTime) {
        const clipName = VAMPIRE_ANIMATION[animationName];
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
    attacAnimation(direction) {
        this.playAnimation("attack_" + direction, 0.5);
    },
    attack(enemy, direction){
        console.log('Damge cua tuong', this.attackDame)
        if(this.attackPrefab){
            this.attacAnimation(direction);
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
