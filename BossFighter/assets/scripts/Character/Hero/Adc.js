import Character from "../Character";

const ADC_ANIMATION = {
    "attack_front": "AdcBackAttack",
    "attack_back": "AdcFrontAttack",
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
        characterId: "hero001",

        ultimatePrefab: cc.Prefab,
        attackPrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // this.initData(this.characterId);
    },

    start () {
    },

    initData(heroData) {
        console.warn('ADC initData with heroData:', heroData);

        this.characterId = heroData.characterId || "hero002";
        this.name = heroData.name || "ADC Hero";
        this.attackDame = heroData.attackDamage || 10;
        this.attackRange = heroData.attackRange || 1;
        this.maxHp = heroData.maxHp || 100;
        this.health = this.maxHp;


        // await this._super(characterNameId);

        // console.log("ADC initData with characterId:", characterNameId);
        // console.log("ADC properties:", this);
    },

    async attack(enemy, direction) {
        this.attackAnimation(direction);
        if(this.attackPrefab){
            const attackNode = cc.instantiate(this.attackPrefab);
            attackNode.setPosition(this.node.getPosition());
            this.node.parent.addChild(attackNode)
            attackNode.mainScript = attackNode.getComponents(cc.Component).find(c=> typeof c.initDirection === 'function')

            if(attackNode.mainScript) {
                attackNode.mainScript.initDirection(enemy, this.attackDame)

                let dame = new Promise((resolve) => {
                    enemy.on('ADC_ATTACK', () => {
                        console.log("Enemy attacked by ADC with damage:", this.attackDame);
                        resolve(this.attackDame);
                    })
                })

                return dame;
            }
        }
        else{
            cc.error('Attack prefab is not set for ADC')
        }
    },

    async ultimate(enemy) {
        if (this.ultimatePrefab) {
            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            ultimate.mainScript = ultimate.getComponents(cc.Component).find(c => typeof c.initDirection === 'function');

            if (ultimate.mainScript) {
                ultimate.mainScript.initDirection(enemy, this.ultimateDame);

                let dame = new Promise((resolve) => {
                    enemy.on('ADC_ULTIMATE', () => {
                        resolve(this.ultimateDame);
                    });
                });
                
                this.resetUltimateCooldown();

                return dame;    
            }

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
        console.log("ADC attackAnimation with direction:", direction);
        this.playAnimation("attack_" + direction, 0.5);
    },

    // update (dt) {},
});
