// Learn cc.Class:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import GameController from "./GameController";
cc.Class({
    extends: cc.Component,

    properties: {
        role: 'Tanker',

        maxHp: 100,
        maxMana: 100,
        moveSpeed: 200,
        attackRange: 100,
        normalAttackPower: 10,
        manaPerAttack: 10,
        imageSprite: cc.Sprite,
        skillPrefab: cc.Prefab,

        skillCost: 30,
        ultimateCost: 80,
        skillCooldown: 5,
        ultimateCooldown: 12,

        hpBar: cc.ProgressBar,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        // const sprite = this.node.getChildByName('Image')
        // const animation = sprite.getComponent(cc.Animation);
        // if (animation) {
        //     const intervalId = setInterval(() => {
        //         animation.play('bottom-attack'); 
        //     }, 1000); 
        // }
        this.hp = this.maxHp;
    },

    start() {

    },
    attack() {
        this.attackAnimation();
    },
    attackAnimation() {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        animation.play('tanker-bottom-attack');
    },

    moveAnimation(event) {
        const sprite = this.node.getChildByName('Image')
        const animation = sprite.getComponent(cc.Animation);
        if (event === cc.macro.KEY.w) {
            animation.play('tanker-top-walk');
        } else if (event === cc.macro.KEY.s) {
            animation.play('tanker-bottom-walk');
        } else if (event === cc.macro.KEY.a) {
            animation.play('tanker-left-walk');
        } else if (event === cc.macro.KEY.d) {
            animation.play('tanker-right-walk');
        } else if (event === cc.macro.KEY.w && event === cc.macro.KEY.a) {
            animation.play('tanker-top-left-walk');
        } else if (event === cc.macro.KEY.w && event === cc.macro.KEY.d) {
            animation.play('tanker-top-right-walk');
        } else if (event === cc.macro.KEY.s && event === cc.macro.KEY.a) {
            animation.play('tanker-bottom-left-walk');
        } else if (event === cc.macro.KEY.s && event === cc.macro.KEY.d) {
            animation.play('tanker-bottom-right-walk');
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
            skill.getComponent('Skill').initDirection(bossPos);
        } else {
            console.log('No boss found');
        }

    },
    affectDamage() {
        this.castSkill();
        return this.normalAttackPower * 2;
    },

    takeDamage(damage) {
        this.hp -= damage;
        this.hp = Math.max(this.hp, 0);
        if (this.hpBar) this.hpBar.progress = this.hp / this.maxHp;

        if (this.hp <= 0) {
            console.log('tanker die');
        }
    },
    getCurrentHp() {
        return this.hp;
    },

    die() {
        this.onDestroy.destroy();
        // console.log('die');
        // const sprite = this.node.getChildByName('Image')
        // const animation = sprite.getComponent(cc.Animation);
        // animation.play('bottom-die'); 
    },

    getAttackRange() {
        return this.attackRange;
    },

    // update (dt) {},
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
    }
});
