import EventBus from "../EventBus"
cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    onLoad() {
        console.log("Character loaded");
    },

    initData() {
        this.health = 100;
        this.attackPower = 10;
        this.moveSpeed = 200;
        this.attackRange = 150;
        this.attackCooldown = 1;
        this.skillCooldown = 3;
        this.ultimateCooldown = 6;

        this.attackCooldownRemaining = 0;
        this.skillCooldownRemaining = 0;
        this.ultimateCooldownRemaining = 0;

        console.log("Character data initialized");
    },

    takeDame(dame) {
        this.health -= dame;
        this.health = Math.max(this.hp, 0);
        if (this.hpBar) {
            this.hpBar.progress = this.health / this.maxHp;
        }

        if (this.health <= 0) {
            this.die();
        }
    },

    test() {
        console.log("test function called");
    },

    dealDame(characterNode, dame) {
        console.log("Dealing damage:", dame);
        characterNode.emit(EventBus.events.TAKE_DAME, dame);
    },

    getData() {
        return {
            health: this.health,
            attackPower: this.attackPower,
            moveSpeed: this.moveSpeed,
            attackRange: this.attackRange,
            attackCooldown: this.attackCooldown,
            skillCooldown: this.skillCooldown,
            ultimateCooldown: this.ultimateCooldown
        };
    },

    die() {
        console.log("Character died");
        this.node.destroy();
    },
});