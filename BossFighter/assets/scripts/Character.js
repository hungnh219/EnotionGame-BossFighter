// import GAME_DATA from './Game/GameData';
// import 
import GAME_DATA from './Game/GameData'
const CHARACTER_DATA = {
    "hero001" : {
        "name": "Đấu sĩ",
        "role": "Bruiser",
        "description": "A strong and resilient fighter who excels in close combat, able to withstand heavy damage while dealing significant blows to enemies.",
        "properties": {
            "health": 1500,

            "attackDame": 200,
            "attackRange": 1,
            "attackCooldown": 1,

            "ultimateCooldown": 2,

        }
    },

    "hero002" : {
        "name": "Xạ thủ",
        "role": "Adc",
        "description": "A ranged damage dealer who can inflict high damage from a distance, specializing in taking down enemies quickly with precise attacks.",
        "properties": {
            "health": 1000,
            
            "attackDame": 250,
            "attackRange": 4,
            "attackCooldown": 1,

            "ultimateCooldown": 2,
            "ultimateDame": 1500,
            "ultimateRange": 999,
        }
    },

    "hero003" : {
        "name": "Ma cà rồng",
        "role": "Mage",
        "description": "A powerful mage who uses dark magic to drain the life from enemies, restoring health while dealing damage.",
        "properties": {
            "health": 1200,

            "attackDame": 300,
            "attackRange": 3,
            "attackCooldown": 1,

            "ultimateCooldown": 2,
            "ultimateDame": 450,
            "ultimateRange": 999,
        }
    },

    "hero004" : {
        "name": "Đỡ đòn",
        "role": "Tanker",
        "description": "A heavily armored warrior who can absorb massive amounts of damage, protecting allies and controlling the battlefield.",
        "properties": {
            "health": 2000,

            "attackDame": 150,
            "attackRange": 1,
            "attackCooldown": 1,

            "ultimateCooldown": 2,
            "ultimateDame": 1000,
            "ultimateRange": 2,
        }
    },

    "boss001": {
        "name": "Boss 001",
        "role": "Boss",
        "description": "A formidable enemy that poses a significant challenge, requiring teamwork and strategy to defeat. It has high health and devastating attacks.",
        "properties": {
            "health": 1000,
            "attackDame": 400,
            "attackRange": 2,

            "ultimateCooldown": 2,
            "ultimateDame": 1000,
            "ultimateRange": 2,
        }
    },

    "boss002": {
        "name": "Boss 002",
        "role": "Boss",
        "description": "An even more powerful boss that tests the limits of the players' abilities, with unique attacks and mechanics that require careful planning to overcome.",
        "properties": {
            "health": 1000,
            "attackDame": 500,
            "attackRange": 3,

            "ultimateCooldown": 2,
            "ultimateDame": 1000,
            "ultimateRange": 2,
        }
    },

    "boss003": {
        "name": "Boss 003",
        "role": "Boss",
        "description": "The ultimate challenge, this boss combines devastating attacks with complex mechanics, requiring the best strategies and teamwork to defeat.",
        "properties": {
            "health": 1000,
            "attackDame": 600,
            "attackRange": 3,

            "ultimateCooldown": 2,
            "ultimateDame": 1000,
            "ultimateRange": 2,
        }
    }
}

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
    },

    initData(characterNameId) {
        console.log('Character data:', CHARACTER_DATA[characterNameId]);
        this.health = CHARACTER_DATA[characterNameId].properties.health ?? 100;
        this.maxHp = this.health;

        this.attackDame = CHARACTER_DATA[characterNameId].properties.attackDame ?? 10; 
        this.attackRange = CHARACTER_DATA[characterNameId].properties.attackRange ?? 1;
        this.attackCooldown = CHARACTER_DATA[characterNameId].properties.attackCooldown ?? 1;

        this.ultimateDame = CHARACTER_DATA[characterNameId].properties.ultimateDame ?? 0;
        this.ultimateRange = CHARACTER_DATA[characterNameId].properties.ultimateRange ?? 0;
        this.ultimateCooldown = CHARACTER_DATA[characterNameId].properties.ultimateCooldown ?? 0;

        this.name = CHARACTER_DATA[characterNameId].name ?? "Unknown Character";
        this.role = CHARACTER_DATA[characterNameId].role ?? "Unknown Role";

        this.roundCountToUltimate = this.ultimateCooldown ?? 100;
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
            name: this.name,
            role: this.role,
            // description: CHARACTER_DATA[this.characterId]?.description || "No description available",
            health: this.health,

            attackDame: this.attackDame,
            attackRange: this.attackRange,
            attackCooldown: this.attackCooldown,

            ultimateDame: this.ultimateDame,
            ultimateRange: this.ultimateRange,
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

    getAttackDame() {
        return this.attackDame;
    },

    getUltimateCooldown() {
        return this.roundCountToUltimate;
    },

    resetUltimateCooldown() {
        this.roundCountToUltimate = this.ultimateCooldown;
    },

    countUltimateCooldown() {
        if (this.roundCountToUltimate > 0) {
            this.roundCountToUltimate--;
        }
        if (this.roundCountToUltimate < 0) {
            this.roundCountToUltimate = 0;
        }
    },

    die() {
        console.log("Character died");
        // this.node.destroy();
    },
});