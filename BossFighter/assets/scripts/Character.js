// import GAME_DATA from './Game/GameData';
// import 
import GAME_DATA from './Game/GameData'
// import CharacterJsonData from '../data/json/character'
// const CharacterJsonData = required('../data/json/character')

cc.Class({
    extends: cc.Component,

    properties: {
        imageSprite: cc.Sprite,
        hpBar: cc.ProgressBar,

        // health: 100,
        // maxHp: 100,
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
        console.log('123 json data', CharacterJsonData);
    },

    initData(characterNameId) {
        console.log('123 json data', CharacterJsonData);
    },

    takeDame(dame) {
        console.log(this.node.name, "taking damage:", dame);
        
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