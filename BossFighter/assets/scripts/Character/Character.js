// import GAME_DATA from './Game/GameData';
// import 
import GAME_DATA from '../Game/GameData';
import SocketIOManager from '../SocketIO/SocketIOManager'
import EventBus from '../EventBus';

cc.Class({
    extends: cc.Component,

    properties: {
        imageSprite: cc.Sprite,
        hpBar: cc.ProgressBar,
        avatar: cc.Sprite,
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

    async initData(characterNameId) {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();

        console.warn('fetching character data for:', characterNameId);
        let characterData = await this.socketIOManager.game.getCharacterData(characterNameId);
        console.warn('get data:', characterNameId, characterData.name);
        this.health = characterData.maxHp ?? 100;
        this.maxHp = characterData.maxHp ?? 100;
        this.attackDame = characterData.attackDamage ?? 10; 
        this.attackRange = characterData.attackRange ?? 1;
        this.name = characterData.name ?? "Unknown Character";
    },

    takeDame(newHealth) {
        console.log("Taking damage:", newHealth);
        this.health = newHealth;
        this.health = Math.max(this.health, 0);
        if (this.hpBar) {
            this.hpBar.progress = this.health / this.maxHp;
        }

        if (this.health <= 0) {
            this.die();
        }
    },


    async updateHpBar() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();
        let newHealth = await this.socketIOManager.game.getCurrentHp(this.characterId);
        console.log("Updating HP bar with new health:", newHealth, this.characterId);
        this.health = newHealth;
        this.health = Math.max(this.health, 0);
        EventBus.emit(EventBus.events.UPDATE_LEADER_BOARD)
        if (this.hpBar) {
            this.hpBar.progress = this.health / this.maxHp;
        }
        if (this.health <= 0) {
            this.die();
        }
    },

    dealDame(characterNode, dame) {
        characterNode.emit(GAME_DATA.EVENT_NAME.TAKE_DAME, dame);
    },

    getCharacterInfo() {
        console.log("Character Info:", {
            characterId: this.characterId,
            name: this.name,
            role: this.role,
            health: this.health,
            maxHp: this.maxHp,
            attackDame: this.attackDame,
            attackRange: this.attackRange,
            imageSprite: this.imageSprite,
            avatar: this.avatar,
        });
        return {
            characterId: this.characterId,
            name: this.name,
            role: this.role,
            // description: CHARACTER_DATA[this.characterId]?.description || "No description available",
            health: this.health,
            maxHp: this.maxHp,

            attackDame: this.attackDame,
            attackRange: this.attackRange,

            imageSprite: this.imageSprite,
            avatar: this.avatar,
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
    },
});