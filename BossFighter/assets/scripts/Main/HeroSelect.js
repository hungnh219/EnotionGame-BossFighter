import GameController from "../Game/GameController";
import GAME_DATA from "../Game/GameData";
import SocketIOManager from "../SocketIO/SocketIOManager";

cc.Class({
    extends: cc.Component,

    properties: {
        customFont: cc.Font,
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
        // selectedHero: cc.Sprite,
        // selectedHeroes: [cc.Sprite],
        selectedHeroes: [cc.Sprite],
        lockHeroButton: cc.Button,
        numberOfHeros: [cc.Integer]
    },

    async onLoad() {
        this.setupGameController();
        await this.setupSocketIO();
        this.heroLocked = [];
        this.selectedHeroes = this.selectedHeroes || [];

        this.selectedHeroes.forEach((hero, index) => {
            let playerLabel = new cc.Node(`PlayerLabel-${index}`);
            let labelComponent = playerLabel.addComponent(cc.Label);

            labelComponent.string = `Player ${index + 1}`;
            labelComponent.fontSize = 24;
            labelComponent.lineHeight = 24;
            labelComponent.font = this.customFont;
            playerLabel.color = (index == this.playerIndex) ? cc.Color.WHITE : cc.Color.BLACK;
            // playerLabel.font = this.customFont;
            playerLabel.setPosition(0, 160);
            hero.node.addChild(playerLabel);

            // add hero name label
            let nameLabel = new cc.Node(`NameLabel-${index}`);
            let nameLabelComponent = nameLabel.addComponent(cc.Label);
            nameLabelComponent.string = "";
            nameLabelComponent.fontSize = 32;
            nameLabelComponent.lineHeight = 24;
            nameLabelComponent.font = this.customFont;
            nameLabel.color = cc.Color.BLACK;

            nameLabel.setPosition(0, -108);
            hero.node.addChild(nameLabel);

            // this.heroLocked[index] = null;
        })

    },

    start() {
        this.initVariables();
        this.hideInformation();
        this.loadHeroPrefabs();
    },

    setupGameController() {
        this.gameController = GameController.getInstance() || new GameController();
        if (!GameController.getInstance()) {
            cc.game.addPersistRootNode(this.node);
        }
    },

    async setupSocketIO() {
        this.socketIOManager = SocketIOManager.getInstance() || new SocketIOManager();

        this.socketIOManager.selectHero.listenHeroSelection((heroClickIndexArray) => {
            this.updateClickHero(heroClickIndexArray);
        });
        this.socketIOManager.selectHero.listenHeroLock((heroLockIndexArray) => {
            this.updateHeroLock(heroLockIndexArray);
        });
        this.socketIOManager.selectHero.listenPlayGame(() => {
            this.moveToGameScene();
        })

        this.startGameData = await this.socketIOManager.selectHero.getGameStartData();
        this.playerIndex = this.socketIOManager.selectHero.getPlayerIndex(this.startGameData);

    },

    initVariables() {
        this.heroPicked = { index: 0, prefab: null };
        this.heros = [];
        this.heroLockList = [];
        this.maxHero = 4;
        const heroPrefabScript = this.node.getComponent("PrefabFactory");
        this.heroPrefabs = heroPrefabScript.getAllPrefab();
    },

    loadHeroPrefabs() {
        const tempNode = new cc.Node();
        cc.director.getScene().addChild(tempNode);

        this.heroPrefabs.forEach((prefab, index) => {
            const hero = cc.instantiate(prefab);
            tempNode.addChild(hero);

            setTimeout(() => {
                hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getCharacterInfo === 'function');
                if (hero.mainScript) {
                    const info = hero.mainScript.getCharacterInfo();
                    this.heros[index] = info;
                    this.createHeroThumbnail(index, info);
                }
                hero.removeFromParent(true);
            }, 0);
        });
    },

    createHeroThumbnail(index, info) {
        const heroImageNode = new cc.Node('HeroImageNode');
        const sprite = heroImageNode.addComponent(cc.Sprite);
        sprite.spriteFrame = info.imageSprite.getComponent(cc.Sprite).spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        heroImageNode.width = 60;
        heroImageNode.height = 60;
        heroImageNode.customIndex = index;

        heroImageNode.on(cc.Node.EventType.TOUCH_END, () => {
            this.heroClick(index, this.heroPrefabs[index]);
        }, heroImageNode);

        this.heroScrollViewContent.addChild(heroImageNode);
    },

    heroClick(index, prefab) {
        if (this.heroLocked[this.playerIndex] != null)  return;
        if (!prefab) return;
        if (this.heroLockedList.node.childrenCount >= this.maxHero + 1) return;

        this.showInformation();

        this.socketIOManager.selectHero.clickHero(index);

        this.heroPicked = { index, prefab };
        this.applyHeroInfoToUI(index);
    },

    applyHeroInfoToUI(index) {
        const info = this.heros[index];
        this.heroName.string = info.name;
        this.heroRole.string = info.role;
        this.heroHealth.string = info.health;
        this.heroMana.string = info.mana;
        this.heroAttackRange.string = info.attackRange;
        this.heroImageSprite.spriteFrame = info.imageSprite.getComponent(cc.Sprite).spriteFrame;
        this.displaySelectedHero(info);
    },


    displaySelectedHero(info) {
        // Set sprite frame for the selected hero slot
        this.selectedHeroes[this.playerIndex].spriteFrame = info.imageSprite.getComponent(cc.Sprite).spriteFrame;

        // Find the existing name label node by name
        const nameLabelNode = this.selectedHeroes[this.playerIndex].node.getChildByName(`NameLabel-${this.playerIndex}`);
        if (nameLabelNode) {
            const nameLabel = nameLabelNode.getComponent(cc.Label);
            if (nameLabel) {
                nameLabel.string = info.name;
            }
        }
    },

    lockHero() {
        if (!this.heroPicked.prefab || this.heroLockedList.node.childrenCount >= this.maxHero + 1) return;

        // const info = this.heros[this.heroPicked.index];
        // const heroNode = new cc.Node('HeroImageNode');
        // const sprite = heroNode.addComponent(cc.Sprite);
        // sprite.spriteFrame = info.imageSprite.getComponent(cc.Sprite).spriteFrame;
        // sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        // heroNode.width = 150;
        // heroNode.height = 150;

        // this.heroLockedList.node.insertChild(heroNode, this.heroLockedList.node.childrenCount - 1);
        // if (this.heroLockedList.node.childrenCount == this.maxHero + 1) {
        //     let last = this.heroLockedList.node.children[this.heroLockedList.node.childrenCount - 1];
        //     last.active = false;
        // }

        // this.addHeroNameLabel(heroNode, info.name);
        // this.saveHeroData(info);

        console.log("Heroselect: Locking hero:", this.heroPicked.index, this.heroPicked.prefab);
        // this.gameController.addSelectedHeroPrefab(this.heroPicked.prefab);
        this.socketIOManager.selectHero.lockHero(this.heroPicked.index);
        this.playSoundEffect();
    },

    addHeroNameLabel(parentNode, name) {
        const labelNode = new cc.Node('NameLabelNode');
        const label = labelNode.addComponent(cc.Label);
        label.string = name;
        label.fontSize = 30;
        label.lineHeight = 24;
        label.font = this.customFont;
        labelNode.color = cc.Color.BLACK;
        labelNode.setPosition(0, -180);
        parentNode.addChild(labelNode);
    },

    saveHeroData(info) {
        const heroData = {
            name: info.name,
            role: info.role,
            health: info.health,
            mana: info.mana,
            attackRange: info.attackRange
        };

        let saved = JSON.parse(cc.sys.localStorage.getItem('selectedHeroes')) || [];
        saved.push(heroData);
        cc.sys.localStorage.setItem('selectedHeroes', JSON.stringify(saved));
    },

    hideInformation() {
        const nodes = [
            this.heroImageSprite, this.heroName, this.heroRole, this.heroHealth,
            this.heroMana, this.heroAttackRange, this.heroRoleIcon,
            this.heroHealthIcon, this.heroManaIcon, this.heroAttackRangeIcon
        ];
        nodes.forEach(n => n.node.active = false);
    },

    showInformation() {
        const nodes = [
            this.heroImageSprite, this.heroName, this.heroRole, this.heroHealth,
            this.heroMana, this.heroAttackRange, this.heroRoleIcon,
            this.heroHealthIcon, this.heroManaIcon, this.heroAttackRangeIcon
        ];
        nodes.forEach(n => n.node.active = true);
    },

    playGame() {
        // check if heroLockedList is full
        if (this.startGameData.host === false) return;
        let flag = true;
        for (let i = 0; i < this.heroLocked.length; i++) {
            if (this.heroLocked[i] == null) {
                flag = false;
                break;
            }
        }

        if (!flag) {
            cc.log("HeroSelect: Vui lòng khóa hero trước khi bắt đầu trò chơi.");
            return;
        }
        
        console.log('start play game');
        this.socketIOManager.selectHero.playGame();
        // add heroLocked to gameController
        // this.scheduleOnce(() => {
        //     cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME);
        // }, 0.2);

    },

    moveToGameScene() {
        cc.director.loadScene(GAME_DATA.GAME_SCENE.GAME);
    },

    backToMapSelect() {
        cc.director.loadScene(GAME_DATA.GAME_SCENE.MAP_SELECT);
    },

    playSoundEffect() {
        const audio = this.lockHeroButton.node.getComponent(cc.AudioSource);
        if (audio) audio.play();
    },

    playPickSoundEffect() {
        const audio = this.node.getComponent(cc.AudioSource);
        if (audio) audio.play();
    },

    // updateClickHero(heroClickIndexArray) {
    //     this.selectedHeroes.forEach((hero, index) => {
    //         let heroClickIndex = heroClickIndexArray[index];
    //         if (heroClickIndex !== undefined && heroClickIndex !== null) {
    //             this.applyHeroInfoToUI(heroClickIndex);
    //         }
    //     }); 
    // }
    updateClickHero(heroClickIndexArray) {
        heroClickIndexArray.forEach((heroIndex, playerIdx) => {
            if (heroIndex !== undefined && heroIndex !== null && this.heros[heroIndex]) {
                const info = this.heros[heroIndex];

                // Cập nhật spriteFrame cho đúng player slot
                this.selectedHeroes[playerIdx].spriteFrame = info.imageSprite.getComponent(cc.Sprite).spriteFrame;

                // Cập nhật tên hero cho đúng label
                const nameLabelNode = this.selectedHeroes[playerIdx].node.getChildByName(`NameLabel-${playerIdx}`);
                if (nameLabelNode) {
                    const nameLabel = nameLabelNode.getComponent(cc.Label);
                    if (nameLabel) {
                        nameLabel.string = info.name;
                    }
                }
            }
        });
    },

    updateHeroLock(heroLockIndexArray) {
        console.log("updateHeroLockList", heroLockIndexArray);
        this.heroLocked[this.playerIndex] = heroLockIndexArray[this.playerIndex];
    },

    
});