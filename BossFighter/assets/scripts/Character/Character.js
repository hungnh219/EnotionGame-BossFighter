// import GAME_DATA from './Game/GameData';
// import 
import GAME_DATA from '../Game/GameData';
import SocketIOManager from '../SocketIO/SocketIOManager'

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

        let characterData = await this.socketIOManager.game.getCharacterData(characterNameId);
        this.health = characterData.maxHp ?? 100;
        this.maxHp = characterData.maxHp ?? 100;
        this.attackDame = characterData.attackDamage ?? 10; 
        this.attackRange = characterData.attackRange ?? 1;
        this.name = characterData.name ?? "Unknown Character";
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
    },

    dealDame(characterNode, dame) {
        // const comps = characterNode.getComponents(cc.Component);
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
        // this.node.destroy();
    },
});