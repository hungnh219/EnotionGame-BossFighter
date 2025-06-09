import Character from "../Character";

const VAMPIRE_ANIMATION = {
    "attack_front": "VampireBackAttack",
    "attack_left": "VampireLeftAttack",
    "attack_back": "VampireFrontAttack",
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
        characterId: "hero004",
        damage: 10, // Damage dealt by the ultimate skill
        range: 1, // Range of the ultimate skill
        ultimatePrefab: cc.Prefab, // Prefab for the ultimate skill effect
        attackPrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        // this.initData(this.characterId);
    },

    start() {
    },

    initData(heroData) {
        console.warn('vampire initData with heroData:', heroData);

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

    async ultimate(centerGridPos, spawnAnimationCallback) {
        this.damage = this.ultimateDame || this.damage; // Ensure damage is set to ultimate damage

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
                spawnAnimationCallback(this.ultimatePrefab, tile, times, this.ultimateDame);

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
    attackAnimation(direction) {
        this.playAnimation("attack_" + direction, 0.5);
    },
    async attack(enemy, direction) {
        console.log("Vampire attack with direction:", direction, enemy.name);
        if (this.attackPrefab) {
            this.attackAnimation(direction);
            const attackNode = cc.instantiate(this.attackPrefab);
            attackNode.setPosition(this.node.getPosition());
            this.node.parent.addChild(attackNode)
            attackNode.mainScript = attackNode.getComponents(cc.Component).find(c => typeof c.initDirection === 'function')

            if (attackNode.mainScript) {
                attackNode.mainScript.initDirection(enemy, this.attackDame)

                let dame = new Promise((resolve) => {
                    enemy.on('VAMPIRE_ATTACK', () => {
                        console.log('Enemy attacked by VAMPIRE with damage:', this.attackDame)
                        resolve(this.attackDame)
                    })
                })

                return dame;
            }


        }
        else {
            cc.error('Attack prefab is not set for Vampire')
        }
    },

    // update (dt) {},
});
