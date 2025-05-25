import GameController from "../Game/GameController";
const ANIMATION_NAME = {
    MELEE_ATTACK: 'adc-top-walk',
    SKILL: 'adc-bottom-skill',
    ULTIMATE: 'adc-bottom-ultimate',
    BOTTOM_WALK: 'adc-bottom-walk',
    TOP_WALK: 'adc-top-walk',
    LEFT_WALK: 'adc-left-walk',
    RIGHT_WALK: 'adc-right-walk',
    TOP_LEFT_WALK: 'adc-top-left-walk',
    TOP_RIGHT_WALK: 'adc-top-right-walk',
    BOTTOM_LEFT_WALK: 'adc-bottom-left-walk',
    BOTTOM_RIGHT_WALK: 'adc-bottom-right-walk',
    HURT: 'adc-hurt',
    DEATH: 'adc-death',
}
cc.Class({
    extends: cc.Component,

    properties: {
        role: 'Adc',

        maxHp: 100,
        maxMana: 100,
        moveSpeed: 200,
        attackRange: 200,
        normalAttackPower: 5,
        manaPerAttack: 10,

        skillCost: 30,
        ultimateCost: 80,

        attackCooldown: 1,
        skillCooldown: 3,
        ultimateCooldown: 6,

        imageSprite: cc.Sprite,
        skillPrefab: cc.Prefab,
        hpBar: cc.ProgressBar,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.hp = this.maxHp;

        this.attackCooldownTurns = this.attackCooldown;
        this.skillCooldownTurns = this.skillCooldown
        this.ultimateCooldownTurns = this.ultimateCooldown;

        this.attackCooldownRemaining = 0;
        this.skillCooldownRemaining = 0;
        this.ultimateCooldownRemaining = 0;

    },

    startTurn() {
        if (this.attackCooldownRemaining > 0) this.attackCooldownRemaining--;
        if (this.skillCooldownRemaining > 0) this.skillCooldownRemaining--;
        if (this.ultimateCooldownRemaining > 0) this.ultimateCooldownRemaining--;
    },

    canAttack() {
        return this.attackCooldownRemaining <= 0;
    },
    canUseSkill() {
        return this.skillCooldownRemaining <= 0;
    },
    canUseUltimate() {
        return this.ultimateCooldownRemaining <= 0;
    },

    useAttack() {
        this.attackCooldownRemaining = this.attackCooldownTurns;
    },
    useSkill() {
        this.skillCooldownRemaining = this.skillCooldownTurns;
    },
    useUltimate() {
        this.ultimateCooldownRemaining = this.ultimateCooldownTurns;
    },

    moveAnimation(event) {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        if (event === cc.macro.KEY.w) {
            this.playAnimation(ANIMATION_NAME.TOP_WALK, false);
        } else if (event === cc.macro.KEY.s) {
            this.playAnimation(ANIMATION_NAME.BOTTOM_WALK, false);
        } else if (event === cc.macro.KEY.a) {
            this.playAnimation(ANIMATION_NAME.LEFT_WALK, false);
        } else if (event === cc.macro.KEY.d) {
            this.playAnimation(ANIMATION_NAME.RIGHT_WALK, false);
        } else if (event === cc.macro.KEY.w && event === cc.macro.KEY.a) {
            this.playAnimation(ANIMATION_NAME.TOP_LEFT_WALK, false);
        } else if (event === cc.macro.KEY.w && event === cc.macro.KEY.d) {
            this.playAnimation(ANIMATION_NAME.TOP_RIGHT_WALK, false);
        } else if (event === cc.macro.KEY.s && event === cc.macro.KEY.a) {
            this.playAnimation(ANIMATION_NAME.BOTTOM_LEFT_WALK, false);
        } else if (event === cc.macro.KEY.s && event === cc.macro.KEY.d) {
            this.playAnimation(ANIMATION_NAME.BOTTOM_RIGHT_WALK, false);
        } else {
            animation.stop();
        }
    },

    attackAnimation() {
        this.playAnimation(ANIMATION_NAME.MELEE_ATTACK, false);
    },


    skillAnimation() {
        this.playAnimation(ANIMATION_NAME.MELEE_ATTACK, false);
    },

    takeDamage(damage) {
        console.log('adc takeDamage', damage);
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) {
            this.playAnimation(ANIMATION_NAME.HURT, false);
            this.hpBar.progress = this.hp / this.maxHp;
        }

        if (this.hp <= 0) {
            this.playAnimation(ANIMATION_NAME.DEATH, false);
            this.scheduleOnce(() => {
                this.die();
            }, 1);
        }
    },

    die() {
        this.node.destroy();
    },

    getCurrentHp() {
        return this.hp;
    },

    getAttackRange() {
        return this.attackRange;
    },

    playAnimation(animationName, loop = false) {
        if (!this.anim) {
            this.anim = this.imageSprite.node.getComponent(cc.Animation);
        }

        this.anim.play(animationName);

        if (loop) {

            this.anim.once('finished', () => {
                this.playAnimation(animationName);
            });
        }
    },

    getCharacterInfo() {
        return {
            name: this.node.name,
            description: 'hihi hehe',
            imageSprite: this.imageSprite,
            health: this.maxHp,
            mana: this.maxMana,
            attackRange: this.attackRange,
            role: this.role,
        }
    },

    start() {

    },

    getAttackDame() {
        this.attackAnimation();
        return this.normalAttackPower;
    },

    getSkillDame() {
        this.skillAnimation();
        const skill = cc.instantiate(this.skillPrefab);
        skill.parent = this.node.parent;
        skill.x = this.node.x;
        skill.y = this.node.y;

        this.gameController = GameController.getInstance();
        const bossNode = this.gameController.getBoss();
        if (bossNode) {
            const bossPos = bossNode.getPosition();
            skill.getComponent('Adc_Skill').initDirection(bossPos);
        } else {
            console.log('No boss found');
        }
        return this.normalAttackPower * 2;

    },

    getAttackCooldown() {
        return this.attackCooldown;
    },

    getSkillCooldown() {
        return this.skillCooldown;
    },
    // update (dt) {},
});
