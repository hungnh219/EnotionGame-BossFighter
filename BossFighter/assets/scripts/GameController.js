const DEFAULT_DATA = {
    MOVEMENT_DELAY_TIME: 0.4, // time to move between cells
}

import GAME_DATA from './GameData'

const GameController = cc.Class({
    extends: cc.Component,

    statics: {
        instance: null,
        getInstance: function () {
            if (GameController.instance === null) {
                GameController.instance = new GameController();
            }
            return GameController.instance;
        },
        destroyInstance: function () {
            if (GameController.instance !== null) {
                GameController.instance = null;
            }
        },
    },

    properties: {
        gameWonIndex: 0
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        if (GameController.instance === null) {
            GameController.instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
        }

        // variables
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
        this.listenMoveNode = null;

        this.focusedHero = null;
        this.heros = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
        this.isAutoMode = false;
        this.isUsingSkill = false;
        this.isTurnOnMusic = true;

    },

    start() {
    },

    // update (dt) {},
    setMapPicked(mapPick) {
        this.mapPick = mapPick;
    },

    getMapPicked() {
        return this.mapPick;
    },

    setHeroPick(heroPick) {
        this.heroPick = heroPick;
    },

    getHeroPick() {
        return this.heroPick;
    },

    /* select hero */
    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = [];
        this.selectedHeroPrefabs.push(prefab);
    },

    getHeroPrefabs() {
        return this.selectedHeroPrefabs;
    },

    setTileSize(tileWidth, tileHeight) {
        this.mapTileWidth = tileWidth;
        this.mapTileHeight = tileHeight;
    },

    listenKeyDown(listenNode) {
        if (this.mapTileWidth == undefined) {
            this.mapTileWidth = 64;
        }

        if (this.mapTileHeight == undefined) {
            this.mapTileHeight = 64;
        }
        this.listenMoveNode = listenNode;
        this.pressedKeys = new Set();
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },
    onKeyDown(event) {
        this.pressedKeys.add(event.keyCode);

        // delay to wait set of keys down
        this.scheduleOnce(() => {
            this.checkMove();
        }, 0.1);
    },
    onKeyUp(event) {
        this.pressedKeys.delete(event.keyCode);
    },
    checkMove() {
        if (this.isMoving) return;
        if (this.heros.length == 0) return;

        let dx = 0;
        let dy = 0;

        if (this.pressedKeys.has(cc.macro.KEY.w) || this.pressedKeys.has(cc.macro.KEY.up)) {
            dy += 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.s) || this.pressedKeys.has(cc.macro.KEY.down)) {
            dy -= 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.a) || this.pressedKeys.has(cc.macro.KEY.left)) {
            dx -= 1;
        }
        if (this.pressedKeys.has(cc.macro.KEY.d) || this.pressedKeys.has(cc.macro.KEY.right)) {
            dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.moveCharacter(dx, dy);
        }
    },
    moveCharacter(dx, dy) {
        const newX = this.listenMoveNode.x + dx * this.mapTileWidth;
        const newY = this.listenMoveNode.y + dy * this.mapTileHeight;

        // check if the new position is walkable use newX, newY, firstCellPos and lastCellPos
        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            return;
        }

        // check if the new position is walkable
        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[gridX][gridY] == false) {
            return;
        }

        // move the character
        this.isMoving = true;
        const moveAction = cc.moveTo(DEFAULT_DATA.MOVEMENT_DELAY_TIME, newX, newY);
        // const moveAction = cc.moveTo(0.5, newX, newY).easing(cc.easeCubicActionOut());
        const finishCallback = cc.callFunc(() => {
            this.isMoving = false;
            this.checkMove();
        });
        const sequence = cc.sequence(moveAction, finishCallback);
        this.listenMoveNode.runAction(sequence);

        // set old position to walkable and new position to not walkable
        const oldGridX = Math.floor((this.listenMoveNode.x - this.firstCellPos.x) / this.mapTileWidth);
        const oldGridY = Math.floor((this.listenMoveNode.y - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[oldGridX][oldGridY] !== undefined) {
            this.gridMap[oldGridX][oldGridY] = true;
            this.gridMap[gridX][gridY] = false;
        }
    },


    /* game scene */
    setFocusedHero(heroIndex) {
        this.focusedHero = this.heros[heroIndex];
        this.listenKeyDown(this.focusedHero);
        // set the other heroes scale to 1
        for (let i = 0; i < this.heros.length; i++) {
            if (i == heroIndex) {
                this.heros[i].focusEffect.active = true;
            } else {
                this.heros[i].focusEffect.active = false;
            }
        }
    },
    getFocusedHero() {
        return this.focusedHero;
    },

    addHero(hero) {
        if (this.heros == undefined) this.heros = [];
        this.heros.push(hero);
    },
    addBoss(boss) {
        this.boss = boss;
    },
    heroAttack(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        // check attack cooldown
        if (hero.isAttacking) return;

        hero.isAttacking = true;

        if (this.checkAttackRangeHero(hero) && hero) {
            // const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');
            if (hero.mainScript) {
                let attackDame = hero.mainScript.getAttackDame();

                if (attackDame <= 0) return;

                hero.mainScript.attackAnimation();

                this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (this.boss.mainScript) {
                    // this.bossTakeDame(attackDame);
                    // this.boss.mainScript.takeDamage(attackDame);
                    // // this.checkWin();
                    // // boss die
                    // if (this.boss.mainScript.getHp() == 0) {
                    //     // player win
                    //     this.setWonMap();
                    //     this.winner = GAME_DATA.ROLE.PLAYER;
                    //     this.checkWin();
                    // }
                } else {
                    console.log('no takeDamage function');
                }

            } else {
                console.log('no attack function');
            }
        }

        this.scheduleOnce(() => {
            hero.isAttacking = false;
        }, this.getAttackCooldown(hero))
    },

    checkAttackRangeHero(hero) {
        let boss = this.boss;

        const distance = cc.v2(boss.x - hero.x, boss.y - hero.y).mag();
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attack === 'function');

        if (distance <= hero.mainScript.getAttackRange()) {
            return true;
        }

        return false;
    },

    getAttackCooldown(hero) {
        if (hero == undefined || hero == null) hero = this.getFocusedHero();
        // const hero = this.getFocusedHero();
        if (!hero.mainScript) hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');

        if (hero.mainScript) {
            let attackCooldown = hero.mainScript.getAttackCooldown();
            if (attackCooldown >= 0) {
                return attackCooldown;
            }
        }
    },

    getSkillCooldown(hero) {
        if (hero == undefined || hero == null) hero = this.getFocusedHero();
        // const hero = this.getFocusedHero();
        if (!hero.mainScript) hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');

        if (hero.mainScript) {
            let skillCooldown = hero.mainScript.getSkillCooldown();
            if (skillCooldown >= 0) {
                return skillCooldown;
            }
        }
    },

    heroMoveAnimation(keyCode, hero) {
        if (hero == undefined || hero == null) hero = this.getFocusedHero();

        if (hero) {
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.skillAnimation === 'function');
            if (hero.mainScript) {
                hero.mainScript.moveAnimation(keyCode);
            }
        }
    },

    heroSkill() {
        if (this.isUsingSkill) return;
        this.isUsingSkill = true;

        if (this.focusedHero) {
            const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.skillAnimation === 'function');
            if (hero.mainScript) {
                hero.mainScript.skillAnimation();
                let damage = hero.mainScript.affectDamage();
                if (damage <= 0) return;

                this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (this.boss.mainScript) {

                    setTimeout(() => {
                        this.isUsingSkill = false;
                    }, this.getSkillCooldown(hero) * 1000);

                    // this.bossTakeDame(damage);
                    // this.boss.mainScript.takeDamage(damage);

                    // // if (this.boss.mainScript.get)
                    // // this.winner = GAME_DATA.ROLE.PLAYER;
                    // // console.log('hero skill klekeke')
                    // // this.checkWin();
                    // if (this.boss.mainScript.getHp() == 0) {
                    //     // player win
                    //     console.log('boss die')
                    //     this.setWonMap();
                    //     this.winner = GAME_DATA.ROLE.PLAYER;
                    //     this.checkWin();
                    // }
                } else {
                    console.log('no takeDamage function');
                }

            } else {
                console.log('no skill function');
            }
        }
    },

    turnOnAutoMode() {
        this.isAutoMode = true;
        this.executeAutoMode();
    },

    executeAutoMode() {
        if (!this.isAutoMode) return;
        if (cc.director.isPaused()) return;
        this.scheduleOnce(() => {
            if (!this.boss || this.heros.length == 0) return;

            let bossPos = cc.v2(this.boss.x, this.boss.y);

            this.heros.forEach((hero, index) => {
                // check attack range hero
                // if enough -> attack
                // else -> move
                if (this.checkAttackRangeHero(hero)) {
                    this.heroAttack(hero);
                } else {
                    // move
                    if (hero === this.focusedHero) return;
                    if (hero.isMoving) return;

                    let heroPos = cc.v2(hero.x, hero.y);
                    let dx = 0;
                    let dy = 0;

                    let diffX = bossPos.x - heroPos.x;
                    let diffY = bossPos.y - heroPos.y;
                    diffX = Math.round(diffX);
                    diffY = Math.round(diffY);

                    if (index == 1) {
                        // console.log(diffX, diffY);
                    }
                    if (Math.abs(diffX) > Math.abs(diffY)) {
                        dx = diffX > 0 ? 1 : -1;
                    } else {
                        dy = diffY > 0 ? 1 : -1;
                    }
                    this.moveCharacterBot(hero, dx, dy);

                    // play animation move
                    let keyCode = null;
                    if (dx === 0 && dy === 1) {
                        keyCode = cc.macro.KEY.w;
                    } else if (dx === 0 && dy === -1) {
                        keyCode = cc.macro.KEY.s;
                    } else if (dx === -1 && dy === 0) {
                        keyCode = cc.macro.KEY.a;
                    } else if (dx === 1 && dy === 0) {
                        keyCode = cc.macro.KEY.d;
                    }

                    if (keyCode != null) {
                        this.heroMoveAnimation(keyCode, hero);
                    }
                }

            })

            this.executeAutoMode();
        }, DEFAULT_DATA.MOVEMENT_DELAY_TIME)
    },
    moveCharacterBot(heroBot, dx, dy) {
        // if (!heroBot || heroBot.isMoving) return false;  
        const newX = heroBot.x + dx * this.mapTileWidth;
        const newY = heroBot.y + dy * this.mapTileHeight;

        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            return false;
        }

        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);

        if (!this.gridMap[gridX] || !this.gridMap[gridX][gridY] || this.gridMap[gridX][gridY] === false) {
            return false;
        }

        // move the character
        heroBot.isMoving = true;

        const oldGridX = Math.floor((heroBot.x - this.firstCellPos.x) / this.mapTileWidth);
        const oldGridY = Math.floor((heroBot.y - this.firstCellPos.y) / this.mapTileHeight);

        const moveAction = cc.moveTo(0.5, newX, newY);
        const finishCallback = cc.callFunc(() => {
            heroBot.isMoving = false;
            // this.checkMove();
            this.gridMap[oldGridX][oldGridY] = true;
            this.gridMap[gridX][gridY] = false;
        });

        const sequence = cc.sequence(moveAction, finishCallback);
        heroBot.runAction(sequence);
    },

    // moveHeroNotFocusesToBoss() {
    //     if (!this.boss || this.heros.length === 0) return;

    //     let bossPos = cc.v2(this.boss.x, this.boss.y);
    //     let boss = this.boss;

    //     this.heros.forEach((hero, index) => {
    //         if (hero === this.focusedHero) return;
    //         if (hero.isMoving) return;

    //         let heroPos = cc.v2(hero.x, hero.y);
    //         let dx = 0;
    //         let dy = 0;

    //         let diffX = bossPos.x - heroPos.x;
    //         let diffY = bossPos.y - heroPos.y;
    //         diffX = Math.round(diffX);
    //         diffY = Math.round(diffY);

    //         if (index == 1) {
    //             // console.log(diffX, diffY);
    //         }
    //         if (Math.abs(diffX) > Math.abs(diffY)) {
    //             dx = diffX > 0 ? 1 : -1;
    //         } else {
    //             dy = diffY > 0 ? 1 : -1;
    //         }
    //         this.moveCharacterBot(hero, dx, dy);
    //         // this.scheduleOnce(() => {
    //         //     // this.checkMove();
    //         //     this.moveCharacterBot(hero, dx, dy);
    //         // }, 0.1);
    //     });
    // },

    // nonFocusedHeroesAttackBoss() {
    //     if (!this.boss || this.heros.length === 0) return;

    //     this.heros.forEach(hero => {
    //         if (hero === this.focusedHero) return;

    //         let heroScript = hero.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');
    //         if (heroScript) {

    //             console.log(this.checkAttackRangeHero(hero), hero, '321')
    //             if (this.checkAttackRangeHero(hero)) {
    //                 heroScript.attackAnimation();

    //                 let bossScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');

    //                 if (bossScript) {
    //                     console.log('boss tack dame')
    //                     bossScript.takeDamage(2);
    //                     if (bossScript.getHp() <= 0) {
    //                         this.winner = GAME_DATA.ROLE.PLAYER;
    //                     }
    //                 } else {
    //                     console.log('Boss không có hàm takeDamage');
    //                 }
    //             }
    //             return;
    //         }
    //     });
    // },

    updateWalkable(x, y, walkable) {
        if (!this.gridMap) this.gridMap = [];
        if (this.gridMap[x] == undefined) {
            this.gridMap[x] = [];
        }
        this.gridMap[x][y] = walkable;
    },

    setCellPosition(firstCellPos, lastCellPos) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
    },

    getBoss() {
        return this.boss;
    },

    // boss attack nearest hero
    bossAttack() {
        // calculate the distance between the boss and the heroes, take the nearest hero
        const boss = this.boss;
        const heroes = this.heros;
        let nearestHero = null;
        let minDistance = Infinity;

        for (let i = 0; i < heroes.length; i++) {
            const hero = heroes[i];
            const distance = cc.v2(boss.x - hero.x, boss.y - hero.y).mag();

            if (distance < minDistance) {
                minDistance = distance;
                nearestHero = hero;
            }
        }

        if (nearestHero) {
            // attack the nearest hero
            boss.mainScript = boss.getComponents(cc.Component).find(c => typeof c.attack === 'function');
            if (boss.mainScript) {
                let dame = boss.mainScript.attack();
                // if (dame <= 0 || dame == undefined) return;
                // this.characterTakeDame(nearestHero, dame);
                this.checkWin();
            } else {
                console.log('no attack function');
            }
        }

    },

    // boss skill
    bossCastSkill(gridX, gridY, size) {
        // check if is there is a hero in the area
        if (this.gridMap[gridX] == undefined) {
            this.gridMap[gridX] = [];
        }
        if (this.gridMap[gridX][gridY] == undefined) {
            this.gridMap[gridX][gridY] = [];
        }

        for (let i = gridX - size; i <= gridX + size; i++) {
            for (let j = gridY - size; j <= gridY + size; j++) {
                if (this.gridMap[i] == undefined) {
                    this.gridMap[i] = [];
                }
                if (this.gridMap[i][j] == undefined) {
                    this.gridMap[i][j] = [];
                }
                if (this.gridMap[i][j] == false) {
                    // check if there is a hero in the area
                    const hero = this.heros.find(hero => {
                        const heroX = Math.floor((hero.x - this.firstCellPos.x) / this.mapTileWidth);
                        const heroY = Math.floor((hero.y - this.firstCellPos.y) / this.mapTileHeight);
                        return heroX == i && heroY == j;
                    });
                    if (hero) {
                        // attack the hero
                        // this.characterTakeDame(hero, 10);
                    }
                }
            }
        }
    },



    checkWalkableMove(hero, dx, dy) {
        const newX = hero.x + dx * this.mapTileWidth;
        const newY = hero.y + dy * this.mapTileHeight;

        // check if the new position is walkable use newX, newY, firstCellPos and lastCellPos
        if (newX < this.firstCellPos.x || newX > this.lastCellPos.x || newY < this.firstCellPos.y || newY > this.lastCellPos.y) {
            return false;
        }

        // check if the new position is walkable
        const gridX = Math.floor((newX - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((newY - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[gridX][gridY] == false) {
            return false;
        }

        this.gridMap[gridX][gridY] == false;
        return true;
    },




    getWinner() {
        if (this.winner == undefined || this.winner == null) {
            return;
        }

        return this.winner;
    },

    getNumberOfHero() {
        return this.heros.length;
    },


    /* game system */

    // reset
    resetGame() {
        this.listenMoveNode = null;
        this.focusedHero = null;
        this.heros = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
        this.isMoving = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
    },

    // new game
    newGame() {
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
        this.listenMoveNode = null;

        this.focusedHero = null;
        this.heros = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'

        this.setFocusedHero(0)
        this.isMoving = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
    },

    checkWin() {
        console.log('check win')
        if (this.heros.length == 0) {
            this.setWonMap();
            this.isMoving = false;
            this.isAttacking = false;
            this.isUsingSkill = false;
            this.winner = GAME_DATA.ROLE.BOSS;
        }
        let bossScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
        if (!bossScript) {
            if (bossScript.getHp() <= 0) {
                this.setWonMap();
                this.isMoving = false;
                this.isAttacking = false;
                this.isUsingSkill = false;
                this.winner = GAME_DATA.ROLE.PLAYER;
            }
        }
    },

    // handle back button
    // backToMainMenu() {
    //     this.mapPick = null;
    // }

    backToMapSelect() {
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
    },


    characterTakeDame(hero, dame) {
        if (hero.mainScript == undefined) hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
        if (hero.mainScript) {
            hero.mainScript.takeDamage(dame);

            if (hero.mainScript.getCurrentHp() <= 0) {
                this.handleHeroDie(hero);
            }
        } else {
            console.log('no takeDamage function');
        }
    },

    handleHeroDie(hero) {
        // remove hero from the list
        this.heros[this.heros.indexOf(hero)].focusEffect.active = false;
        this.heros.splice(this.heros.indexOf(hero), 1);
        if (hero == this.focusedHero) this.setFocusedHero(0);

        // set the hero to not walkable
        const gridX = Math.floor((hero.x - this.firstCellPos.x) / this.mapTileWidth);
        const gridY = Math.floor((hero.y - this.firstCellPos.y) / this.mapTileHeight);
        if (this.gridMap[gridX] == undefined) {
            this.gridMap[gridX] = [];
        }
        this.gridMap[gridX][gridY] = true;

        this.checkWin();
    },

    getWonMap() {
        if (this.gameWonIndex == undefined || this.gameWonIndex == null) this.gameWonIndex = 0;
        return this.gameWonIndex;
    },

    setWonMap() {
        if (this.mapPick < this.gameWonIndex) return;
        this.gameWonIndex = this.gameWonIndex + 1;

        // if (this.gameWonIndex == undefined || this.gameWonIndex == null) this.gameWonIndex = 0;
        // if (this.mapPick < this.gameWonIndex) return;
        // this.gameWonIndex = this.mapPick;
    },

    bossTakeDame(dame) {
        if (this.boss.mainScript == undefined) this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
        if (this.boss.mainScript) {
            // this.boss.mainScript.takeDamage(dame);
            if (this.boss.mainScript.getHp() <= 0) {
                this.setWonMap();
                this.winner = GAME_DATA.ROLE.PLAYER;
                this.isMoving = false;
                this.isAttacking = false;
                this.isUsingSkill = false;
            }
        } else {
            console.log('no takeDamage function');
        }
    },

    getTurnOnMusic() {
        if (this.isTurnOnMusic == undefined || this.isTurnOnMusic == null) this.isTurnOnMusic = true;
        return this.isTurnOnMusic;
    },

    setIsTurnOnMusic(isTurnOn) {
        this.isTurnOnMusic = isTurnOn;
    }


});

export default GameController;