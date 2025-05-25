import GameController from "./GameController";
const ANIMATION_NAME = {
    MELEE_ATTACK: 'tanker-bottom-attack',
    BOTTOM_WALK: 'tanker-bottom-walk',
    TOP_WALK: 'tanker-top-walk',
    LEFT_WALK: 'tanker-left-walk',
    RIGHT_WALK: 'tanker-right-walk',
    TOP_LEFT_WALK: 'tanker-top-left-walk',
    TOP_RIGHT_WALK: 'tanker-top-right-walk',
    BOTTOM_LEFT_WALK: 'tanker-bottom-left-walk',
    BOTTOM_RIGHT_WALK: 'tanker-bottom-right-walk',
    HURT: 'tanker-hurt',
    DEATH: 'tanker-death',
}

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
        attackCooldown: 1,

        hpBar: cc.ProgressBar,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
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
        sprite.angle = sprite.angle + 45; // Rotate the sprite by 90 degrees
        this.playAnimation(ANIMATION_NAME.MELEE_ATTACK, false);
        this.playSoundEffect();
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
        console.log('1', sprite.angle);
        sprite.angle = 90;
        console.log('2', sprite.angle);

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
    getCurrentHp() {
        return this.hp;
    },

    die(){
        this.node.destroy();
    },

    getAttackRange() {
        return this.attackRange;
    },

    playAnimation(animationName, loop = false) {
        if (!this.anim) {
            this.anim = this.imageSprite.node.getComponent(cc.Animation);
            // this.playSoundEffect();
        }

        this.anim.play(animationName);

        if (loop) {
            
            this.anim.once('finished', () => {
                this.playAnimation(animationName);
            });
        }
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
    },

    getAttackDame() {
        return this.normalAttackPower;
    },

    getAttackCooldown() {
        return this.attackCooldown;
    },

    getSkillCooldown() {
        return this.skillCooldown;
    },

    playSoundEffect() {
        let audioSource = this.imageSprite.node.getComponent(cc.AudioSource);
        if (audioSource) {
            audioSource.play();
        } else {
            cc.log("AudioSource component not found on the node.");
        }
    }
});
