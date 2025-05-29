import Character from "../Character";

cc.Class({
    extends: Character,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        characterId: "hero003",
        damage: 10, // Damage dealt by the ultimate skill
        range: 1, // Range of the ultimate skill
        ultimatePrefab: cc.Prefab, // Prefab for the ultimate skill effect
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
    },

    initData(characterNameId) {
        this._super(characterNameId);
        console.log("Vampire initData with characterId:", characterNameId);
        console.log("Vampire properties:", this);
    },

    ultimate(centerGridPos, spawnAnimationCallback) {
        this.damage = this.ultimateDame || this.damage; // Ensure damage is set to ultimate damage

        console.log('Vampire ultimate skill used at position:', centerGridPos, this.damage);
        const affactedTile = [];
        for (let i = -this.range; i <= this.range; i++) {
            for (let j = -this.range; j <= this.range; j++) {
                // const tilePos = cc.v2(centerGridPos.x + i, centerGridPos.y + j);
                const tile = {
                    x: centerGridPos.x + i,
                    y: centerGridPos.y + j
                }
                affactedTile.push(tile);
                let times = (i == 0 && j == 0) ? 4 : 2;

                console.log(this.damage)
                spawnAnimationCallback(this.ultimatePrefab ,tile, times, this.ultimateDame);
            }
        }
    }

    // update (dt) {},
});
