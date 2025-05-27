const DEFAULT_DATA = {
    MOVEMENT_DELAY_TIME: 0.4, // time to move between cells
}

import EventBus from '../EventBus';
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

    // properties: {
    //     gameWonIndex: 0,
    //     playerTurnCount: 1,
    //     isPlayerTurn: true,
    //     bossTurnCount: 1,
    // },

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
        this.enemies = [];

        this.isTurnOnMusic = true;

        this.mapHeight = null;
        this.mapWidth = null;
        this.mapTileWidth = null;
        this.mapTileHeight = null;
        
    },

    consumePlayerTurn() {
        this.playerTurnCount--;
        this.updateTurnLabels();
        if (this.playerTurnCount <= 0) {
            this.isPlayerTurn = false;
            // this.enemyAutoMode();
            EventBus.emit(EventBus.events.BOSS2_SPAWN_ENEMY);
            this.bossAttack();
        }
    },


    start() {
    },

    getPlayerTurnCount() {
        if (this.playerTurnCount == undefined || this.playerTurnCount == null) this.playerTurnCount = 3;
        return this.playerTurnCount;
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

    setMapSetting(mapHeight, mapWidth, mapTileWidth, mapTileHeight, endGameCallback) {
        this.mapHeight = mapHeight;
        this.mapWidth = mapWidth;
        this.mapTileWidth = mapTileWidth;
        this.mapTileHeight = mapTileHeight;
        this.endGameCallback = endGameCallback;
    },

    getMapSetting() {
        return {
            mapHeight: this.mapHeight,
            mapWidth: this.mapWidth,
            mapTileWidth: this.mapTileWidth,
            mapTileHeight: this.mapTileHeight,
        };
    },
    // =================== Enemy Logic: Start ===================
    setNewEmemy(newEnemy) {
        if (this.enemies == null || this.enemies == undefined) this.enemies = [];


        this.enemies.push(newEnemy);
    },

    getEnemy() {
        return this.enemies;
    },

    // each enemy moves to nearest hero and attack if their attack range is enough
    // execute in boss turn, before boss attack
    enemyAutoMode() {
        if (this.enemies == undefined || this.enemies == null) return;
        if (this.enemies.length == 0) return;

        this.enemies.forEach((enemy, index) => {
            // if (this.getWinner() != undefined && this.getWinner() != null) return;
            // check attack range hero
            // if enough -> attack
            // else -> move
            let nearestHero = this.findNearestHero(enemy);
            if (!nearestHero) return;

            // distance between enemy and nearest hero
            let enemyPos = cc.v2(enemy.x, enemy.y);
            let heroPos = cc.v2(nearestHero.x, nearestHero.y);

            let dis = cc.v2(enemyPos.x - heroPos.x, enemyPos.y - heroPos.y).mag();

            // let enemyAttackRange = this.getAttackRange(enemies);
            let enemyAttackRange = 100;

            if (dis <= enemyAttackRange) {
                // attack
                console.log('attack')
                enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

                if (enemy.mainScript) {
                    enemy.mainScript.dealDame(nearestHero, 40);

                    // check if hero is dead
                    nearestHero.mainScript = nearestHero.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
                    if (nearestHero.mainScript && nearestHero.mainScript.getCurrentHp() <= 0) {
                        this.handleHeroDie(nearestHero);
                    }

                }
            } else {
                // move to nearest hero
                EventBus.emit(EventBus.events.ENEMY_AUTO_MODE, enemy, nearestHero);
            }
        })
    },

    findNearestHero(enemy) {
        if (!this.heros || this.heros.length === 0) return null;

        let nearestHero = null;

        let minDistance = Infinity;

        this.heros.forEach(hero => {
            const distance = cc.v2(enemy.x - hero.x, enemy.y - hero.y).mag();
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestHero = hero;
            }
        });
        return nearestHero;
    },
    // =================== Enemy Logic: End ===================
    heroClick(node) {
        this.setFocusedHero(this.heros.indexOf(node));
        EventBus.emit(EventBus.events.DISPLAY_WALKABLE_AREA, this.firstCellPos, this.lastCellPos, this.gridMap, node);
    },



    /* select hero */
    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = [];
        this.selectedHeroPrefabs.push(prefab);
    },

    getHeroPrefabs() {
        return this.selectedHeroPrefabs;
    },

    bossAttack() {
        if (!this.boss) return;

        // update the turn labels
        this.updateTurnLabels();
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

        boss.mainScript = boss.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');
        if (boss.mainScript && minDistance > boss.mainScript.getAttackRange()) {
            // this.boss
            this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.secondarySkill === 'function');

            if (this.boss.mainScript) {
                // use secondary skill
                this.boss.mainScript.secondarySkill();
                
                // update the cooldown UI
                if (this.gameScript && typeof this.gameScript.updateCooldownUI === 'function') {
                    this.gameScript.updateCooldownUI(this.getFocusedHero());
                }
            }
        } else {
            if (nearestHero) {
                // attack the nearest hero
                boss.mainScript = boss.getComponents(cc.Component).find(c => typeof c.attackAnimation === 'function');
                if (boss.mainScript) {
                    let dame = boss.mainScript.getAttackDame();
                    // handle the case when dame is 0 or undefined
                    if (nearestHero.mainScript === undefined) {
                        nearestHero.mainScript = nearestHero.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                    }
                    if (nearestHero.mainScript) {
                        nearestHero.mainScript.takeDamage(dame);

                        if (this.gameScript && typeof this.gameScript.updateHeroInfoUI === 'function') {
                            this.gameScript.updateHeroInfoUI(nearestHero);
                        }
                        // check if hero is dead
                        if (nearestHero.mainScript.getCurrentHp() <= 0) {
                            this.handleHeroDie(nearestHero);
                        }
                    }
                    this.checkWin();
                }
            }
        }

        

        // after boss attack, set isPlayerTurn to true
        this.scheduleOnce(() => {
            this.startPlayerTurn();
        }, 1); // wait 1 second before next player turn
    },

    startPlayerTurn() {
        this.isPlayerTurn = true;
        this.playerTurnCount = 3;

        // Giảm cooldown lượt của tất cả hero
        this.heros.forEach(hero => {
            if (hero.mainScript && typeof hero.mainScript.startTurn === 'function') {
                hero.mainScript.startTurn();
            }
        });

        this.updateTurnLabels();

        if (this.gameScript && typeof this.gameScript.updateCooldownUI === 'function') {
        this.gameScript.updateCooldownUI(this.getFocusedHero());
    }
    },


    updateTurnLabels() {
        if (this.gameScript) {
            this.gameScript.updatePlayerTurnLabel(this.playerTurnCount);
            this.gameScript.updateBossTurnLabel(this.isPlayerTurn ? 0 : this.bossTurnCount);
        }
    },



    /* game scene */
    setFocusedHero(heroIndex) {
        this.focusedHero = this.heros[heroIndex];
        // this.listenKeyDown(this.focusedHero);
        // set the other heroes scale to 1
        for (let i = 0; i < this.heros.length; i++) {
            if (i == heroIndex) {
                this.heros[i].focusEffect.active = true;
            } else {
                this.heros[i].focusEffect.active = false;
            }
        }

        // update the hero info UI
        if (this.gameScript && typeof this.gameScript.updateHeroInfoUI === 'function') {
            this.gameScript.updateHeroInfoUI(this.focusedHero);
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

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

        if (hero.mainScript) {
            let enemiesInRange = this.checkAttackRangeHero(hero);
            if (enemiesInRange.length == 0) {
                console.log('no enemy in range');
                return;
            }
            
            this.showEnemySelection(enemiesInRange, (selectedEnemy) => {
                this.heroAttackTarget(hero, selectedEnemy);
            });
        }
    },
    heroAttackTarget(hero, enemy) {
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return;
        }

        hero.mainScript.dealDame(enemy, 20);

        this.consumePlayerTurn();
        this.checkWin();
    },

    showEnemySelection(enemies, onEnemySelected) {
        enemies.forEach(enemy => {
            this.highlightEnemy(enemy);

            enemy.once(cc.Node.EventType.TOUCH_END, () => {
                this.clearEnemyHighlights();
                onEnemySelected(enemy);
            });
        });
    },

    highlightEnemy(enemy) {
        enemy.scale = enemy.scale * 1.5;
    },

    clearEnemyHighlights() {
        this.enemies.forEach(enemy => {
            enemy.scale = enemy.scale / 1.5; // reset scale
            enemy.off(cc.Node.EventType.TOUCH_END); // xóa listener cũ
        });
    },

    checkAttackRangeHero(hero) {
        let enemiesInRange = [];
        if (hero == undefined || hero == null) hero = this.getFocusedHero();

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');
        if (!hero.mainScript) {
            console.log('no getAttackRange function');
            return enemiesInRange;
        }

        let attackRange = hero.mainScript.getAttackRange() * this.mapTileWidth;

        console.log('attack range: ', attackRange);

        if (attackRange <= 0) {
            console.log('attack range is 0');
            return enemiesInRange;
        }

        let currentEnemies = this.enemies ? this.enemies : [];
        currentEnemies.push(this.boss); // add boss to the enemies list

        currentEnemies.forEach(enemy => {
            let enemyPos = cc.v2(enemy.x, enemy.y);
            let heroPos = cc.v2(hero.x, hero.y);
            
            let dis = cc.v2(enemyPos.x - heroPos.x, enemyPos.y - heroPos.y).mag();

            if (enemy == this.boss) dis += 48;
            if (dis <= attackRange) {
                enemiesInRange.push(enemy);
            }
        });

        console.log('enemies in range: ', currentEnemies, enemiesInRange);
            

        return enemiesInRange;
    },

    getAttackRange(object) {
        if (object == undefined || object == null) return 0;

        object.mainScript = object.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');

        if (object.mainScript) {
            let attackRange = object.mainScript.getAttackRange();
            if (attackRange > 0) {
                return attackRange;
            }
        }

        return 0;
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

    heroSkill() {
        if (this.isUsingSkill) return;
        this.isUsingSkill = true;

        if (this.focusedHero) {
            const hero = this.getFocusedHero();
            hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.skillAnimation === 'function');

            

            if (!hero.mainScript.canUseSkill()) {
                console.log('Chưa hết cooldown skill');
                this.isUsingSkill = false;
                return;
            }

            hero.mainScript.skillCooldownRemaining = Math.ceil(hero.mainScript.skillCooldown);

            if (hero.mainScript) {
                let damage = hero.mainScript.getSkillDame();

                hero.mainScript.useSkill();

                if (damage <= 0) {
                    this.isUsingSkill = false;
                    return;
                }


                this.boss.mainScript = this.boss.getComponents(cc.Component).find(c => typeof c.takeDamage === 'function');
                if (this.boss.mainScript) {

                    // this.consumePlayerTurn();

                    setTimeout(() => {
                        this.isUsingSkill = false;
                    }, 0.1);

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
            this.endGameCallback();
        }
        let bossScript = this.boss.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
        if (bossScript) {
            if (bossScript.getCurrentHp() <= 0) {
                console.log('boss die')
                this.setWonMap();
                this.isMoving = false;
                this.isAttacking = false;
                this.isUsingSkill = false;
                this.winner = GAME_DATA.ROLE.PLAYER;
                this.endGameCallback();
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