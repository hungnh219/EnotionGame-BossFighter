const ANIMATION_NAME = {
    MELEE_ATTACK: 'mage-bottom-attack',
    BOTTOM_WALK: 'mage-bottom-walk',
    TOP_WALK: 'mage-top-walk',
    LEFT_WALK: 'mage-left-walk',
    RIGHT_WALK: 'mage-right-walk',
    TOP_LEFT_WALK: 'mage-top-left-walk',
    TOP_RIGHT_WALK: 'mage-top-right-walk',
    BOTTOM_LEFT_WALK: 'mage-bottom-left-walk',
    BOTTOM_RIGHT_WALK: 'mage-bottom-right-walk',
    HURT: 'mage-hurt',
    DEATH: 'mage-death',
}
import GameController from "./GameController";
cc.Class({
    extends: cc.Component,

    properties: {
        role: 'Mage',

        maxHp: 100,
        maxMana: 100,
        moveSpeed: 200,
        attackRange: 200,
        normalAttackPower: 5,
        manaPerAttack: 10,
        imageSprite: cc.Sprite,
        skillPrefab: cc.Prefab,

        skillCost: 30,
        ultimateCost: 80,
        skillCooldown: 5,
        ultimateCooldown: 12,
        attackCooldown: 1,

        hpBar: cc.ProgressBar,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.hp = this.maxHp;
    },

    attack() {
        this.attackAnimation();
    },
    attackAnimation() {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        this.playAnimation(ANIMATION_NAME.MELEE_ATTACK, false);
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

    skillAnimation() {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        animation.play('bottom-skill');
    },

    castSkill() {
        const skill = cc.instantiate(this.skillPrefab);
        skill.parent = this.node.parent;
        skill.x = this.node.x;
        skill.y = this.node.y;

        this.gameController = GameController.getInstance();
        const bossNode = this.gameController.getBoss();
        if (bossNode) {
            const bossPos = bossNode.getPosition();
            skill.getComponent('Mage_Skill').initDirection(bossPos);
        } else {
            console.log('No boss found');
        }

    },
    affectDamage() {
        this.castSkill();
        return this.normalAttackPower * 2;
    },

    takeDamage(damage) {
        console.log('mage takeDamage', damage);
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar){
            this.playAnimation(ANIMATION_NAME.HURT, false);
            this.hpBar.progress = this.hp / this.maxHp;
        } 

        if (this.hp <= 0) {
            this.playAnimation(ANIMATION_NAME.DEATH, false);
            this.scheduleOnce(() => {
                this.die();
            },1);
        }
    },

    die(){
        this.node.destroy();
    },

    getCurrentHp() {
        return this.hp;
    },

    getAttackRange() {
        return this.attackRange;
    },

    playAnimation(animationName, loop = false) {
        console.log("Animation Name:", animationName);
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

    getAttackDame() {
        return this.normalAttackPower;
    },

    start() {

    },

    getAttackCooldown() {
        return this.attackCooldown;
    },

    // update (dt) {},
});
