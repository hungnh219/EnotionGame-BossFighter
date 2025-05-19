import GameController from "./GameController";
import GameScene from "./GameScene";

cc.Class({
    extends: cc.Component,

    properties: {
        mapPicked: cc.Label,

        heroScrollViewContent: cc.Node,

        heroImageSprite: cc.Sprite,
        heroName: cc.Label,
        heroRole: cc.Label,
        heroHealth: cc.Label,
        heroMana: cc.Label,
        heroAttackRange: cc.Label,

        heroRoleIcon: cc.Sprite,
        heroHealthIcon: cc.Sprite,
        heroManaIcon: cc.Sprite,
        heroAttackRangeIcon: cc.Sprite,


        heroLockedList: cc.Layout,
        selectedHero: cc.Sprite,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.gameController = GameController.getInstance();
        this.hideInformation();
        this.heroPicked = {
            index: 0,
            prefab: null
        };
        this.heros = [];
        this.heroLockList = [];

        // get all prefab
        const heroPrefabScript = this.node.getComponent("PrefabFactory");
        this.heroPrefabs = heroPrefabScript.getAllPrefab();
        console.log(this.heroPrefabs);
        this.heroPrefabs.forEach((heroPrefab, index) => {
            const hero = cc.instantiate(heroPrefab);

            // const heroScript = hero.getComponent('Character') || hero.getComponent('Enemy');
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getCharacterInfo === 'function');
            
            // const heroInfo = heroScript.getCharacterInfo();
            const heroInfo = hero.mainScript.getCharacterInfo();
            this.heros[index] = heroInfo;
            const heroImageNode = new cc.Node('HeroImageNode');
            const sprite = heroImageNode.addComponent(cc.Sprite);
            sprite.spriteFrame = heroInfo.imageSprite.getComponent(cc.Sprite).spriteFrame;

            heroImageNode.customIndex = index;

            // heroImageNode.on(cc.Node.EventType.TOUCH_END, function () {
            //     console.log('Hero clicked at index:', this.customIndex);
            // }, heroImageNode);

            heroImageNode.on(cc.Node.EventType.TOUCH_END, () => {
                console.log('check', index);

                this.heroClick(index, heroPrefab);
            }, heroImageNode);

            this.heroScrollViewContent.addChild(heroImageNode);
        });

        // add to scrollview

        // handle onclick
    },

    start() {

    },

    // update (dt) {},
    playGame() {
        console.log("playGame");
        cc.director.loadScene(GameScene.GAME);
    },

    initPrefabData(data) {

    },

    hideInformation() {
        this.heroImageSprite.node.active = false
        this.heroName.node.active = false
        this.heroRole.node.active = false
        this.heroHealth.node.active = false
        this.heroMana.node.active = false
        this.heroAttackRange.node.active = false
        this.heroRoleIcon.node.active = false
        this.heroHealthIcon.node.active = false
        this.heroManaIcon.node.active = false
        this.heroAttackRangeIcon.node.active = false
    },

    showInformation() {
        this.heroImageSprite.node.active = true
        this.heroName.node.active = true
        this.heroRole.node.active = true
        this.heroHealth.node.active = true
        this.heroMana.node.active = true
        this.heroAttackRange.node.active = true
        this.heroRoleIcon.node.active = true
        this.heroHealthIcon.node.active = true
        this.heroManaIcon.node.active = true
        this.heroAttackRangeIcon.node.active = true
    },

    heroClick(clickIndex, heroPrefab) {
        this.showInformation();
        // console.log(this.customIndex)
        // console.log(this.heros[this.customIndex])
        this.heroPicked.index = clickIndex;
        this.heroPicked.prefab = heroPrefab;


        // view information panel
        console.log(this.heros[clickIndex])
        this.heroName.string = this.heros[clickIndex].name;
        this.heroRole.string = this.heros[clickIndex].role;
        this.heroHealth.string = this.heros[clickIndex].health;
        this.heroMana.string = this.heros[clickIndex].mana;
        this.heroAttackRange.string = this.heros[clickIndex].attackRange;
        this.heroImageSprite.spriteFrame = this.heros[clickIndex].imageSprite.getComponent(cc.Sprite).spriteFrame;

        // add hero lock list
        const heroImageNode = new cc.Node('HeroImageNode');
        const sprite = heroImageNode.addComponent(cc.Sprite);
        sprite.spriteFrame = this.heros[clickIndex].imageSprite.getComponent(cc.Sprite).spriteFrame;
        this.selectedHero.spriteFrame = this.heros[clickIndex].imageSprite.getComponent(cc.Sprite).spriteFrame;
        // this.heroLockedList.node.addChild(
        //     heroImageNode
        // )
    },

    clockHero() {
        if (this.heroPicked != null) {
            const heroImageNode = new cc.Node('HeroImageNode');
            const sprite = heroImageNode.addComponent(cc.Sprite);
            sprite.spriteFrame = this.heros[this.heroPicked.index].imageSprite.getComponent(cc.Sprite).spriteFrame;

            this.heroLockedList.node.insertChild(heroImageNode, this.heroLockedList.node.childrenCount - 1);

            this.gameController.addSelectedHeroPrefab(this.heroPicked.prefab);
        }
    },

    playGame() {
        // this.gameController.set
        cc.director.loadScene(GameScene.GAME)
    }
});
