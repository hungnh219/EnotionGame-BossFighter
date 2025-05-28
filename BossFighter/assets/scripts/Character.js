// import GAME_DATA from './Game/GameData';
import GAME_DATA from './Game/GameData'

cc.Class({
    extends: cc.Component,

    properties: {
        imageSprite: cc.Sprite,
        hpBar: cc.ProgressBar,

        // health: cc.Integer,
        // maxHp: cc.Integer,
        // attackPower: cc.Integer,
        // moveSpeed: cc.Float,
        // attackRange: cc.Float,
        // attackCooldown: cc.Float,
        // skillCooldown: cc.Float,
        // ultimateCooldown: cc.Float,
    },

    onLoad() {
        this.health = 100;
        this.maxHp = 100;
        this.node.on(GAME_DATA.EVENT_NAME.TAKE_DAME, (dame) => {
            this.takeDame(dame);
        }, this);
        this.attackRange = 1;
    },

    start() {
    },

    initData() {
        

    },

    takeDame(dame) {

        this.health -= dame;
        this.health = Math.max(this.health, 0);
        if (this.hpBar) {
            this.hpBar.progress = this.health / this.maxHp;
        }

        if (this.health <= 0) {
            this.die();
        }

        console.log("Current health:", this.health);
    },

    dealDame(characterNode, dame) {
        // const comps = characterNode.getComponents(cc.Component);
        characterNode.emit(GAME_DATA.EVENT_NAME.TAKE_DAME, dame);
    },

    getCharacterInfo() {
        return {
            health: this.health ?? 100,
            attackDame: this.attackDame,
            attackRange: this.attackRange,
            // attackCooldown: this.attackCooldown,
            // skillCooldown: this.skillCooldown,
            // ultimateCooldown: this.ultimateCooldown,
            imageSprite: this.imageSprite,
        };
    },

    getCurrentHp () {
        return this.health;
    },

    getAttackRange () {
        return this.attackRange;
    },
    die() {
        console.log("Character died");
        // this.node.destroy();
    },
});