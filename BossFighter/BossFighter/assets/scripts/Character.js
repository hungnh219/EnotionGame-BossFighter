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
            console.log('Character ', this.node.name ," received damage event:", dame);
            this.takeDame(dame);
        }, this);
        this.attackRange = 1;
        // this.health = this.health ?? 100;
        
    },

    start() {
        console.log("Character started");
        console.log("Character info:", this.getCharacterInfo());
    },

    initData() {
        

        console.log("Character data initialized");
    },

    takeDame(dame) {
        console.log("Taking damage:", dame);
        console.log('name', this.node.name); 

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
        console.log("Dealing damage:", dame, "to character: ", characterNode.name);
        const comps = characterNode.getComponents(cc.Component);
        console.log("CharacterNode components: ", comps.map(c => c.constructor.name));
        characterNode.emit(GAME_DATA.EVENT_NAME.TAKE_DAME, dame);
    },

    getCharacterInfo() {
        return {
            health: this.health ?? 100,
            attackPower: this.attackPower,
            moveSpeed: this.moveSpeed,
            attackRange: this.attackRange,
            attackCooldown: this.attackCooldown,
            skillCooldown: this.skillCooldown,
            ultimateCooldown: this.ultimateCooldown,
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
        this.node.destroy();
    },
});