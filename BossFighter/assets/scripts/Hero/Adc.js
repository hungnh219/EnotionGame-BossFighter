import Character from "../Character";

cc.Class({
    extends: Character,

    properties: {
        characterId: "hero002",

        ultimatePrefab: cc.Prefab,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.initData(this.characterId);
    },

    start () {
        // this._super.initData('123');
    },

    initData(characterNameId) {
        this._super(characterNameId);

        console.log("ADC initData with characterId:", characterNameId);
        console.log("ADC properties:", this);
    },

    ultimate(enemy) {
        let dame = this.ultimateDame;
        console.log("Ultimate skill activated with damage:", dame);
        if (this.ultimatePrefab) {
            const ultimate = cc.instantiate(this.ultimatePrefab);
            ultimate.setPosition(this.node.getPosition());
            this.node.parent.addChild(ultimate);
            ultimate.mainScript = ultimate.getComponents(cc.Component).find(c => typeof c.initDirection === 'function');

            if (ultimate.mainScript) {
                ultimate.mainScript.initDirection(enemy, this.ultimateDame);
            }
        } else {
            cc.error("Ultimate prefab is not set for ADC.");
        }
    }

    // update (dt) {},
});
