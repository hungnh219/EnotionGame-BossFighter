import EventBus from '../EventBus';

const GameController = cc.Class({
    extends: cc.Component,

    statics: {
        instance: null,
        getInstance: function () {
            if (GameController.instance === null) {
                GameController.instance = new GameController();
                cc.game.addPersistRootNode(this.node);
            }
            return GameController.instance;
        },
        destroyInstance: function () {
            if (GameController.instance !== null) {
                GameController.instance = null;
            }
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        if (GameController.instance === null) {
            GameController.instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
        }
    },
    //-------------------------------------------------------------------------------//
    startGame(socketIOManager) {
        this.setFocusedHero(this.playerIndex);
        this.socketIOManager = socketIOManager;
    },
    
    updateInfo(hero) {
        // let hero = this.focusedHero;
        // if (!hero) return;
        if (!hero) {
            hero = this.getFocusedHero();
        }
        if (!hero) {
            return;
        }
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getUltimateCooldown === 'function');

        if (hero.mainScript && hero) {
            let ultimateCooldown = hero.mainScript.getUltimateCooldown();
            let heroInfo = hero.mainScript.getCharacterInfo();
            this.updateHeroInfoUI(heroInfo, ultimateCooldown);
        }
    },

    bossTurn() {
        // EventBus.emit(EventBus.events.BOSS2_SPAWN_ENEMY, this.enemies, this.bosses, this.gridMap, this.firstCellPos, this.lastCellPos, this.mapTileWidth, this.mapTileHeight);
        // this.enemyAutoMode();
        setTimeout(() => {
            this.bossAutoMode();
            this.heroes.forEach(hero => {
                hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.countUltimateCooldown === 'function');
                if (hero.mainScript) {
                    hero.mainScript.countUltimateCooldown();
                }
            });
            this.updateInfo();
        }, 1000);
    },

    setFocusedHero(heroIndex) {
        if (heroIndex == undefined || heroIndex == null) return;
        this.focusedHero = this.heroes[heroIndex];
        // this.listenKeyDown(this.focusedHero);
        // set the other heroes scale to 1
        for (let i = 0; i < this.heroes.length; i++) {
            if (i == heroIndex) {
                this.heroes[i].focusEffect.active = true;
            } else {
                this.heroes[i].focusEffect.active = false;
            }
        }

        if (heroIndex == this.playerIndex) {
            this.updateInfo();
        }   
    },

    // =================== Get-Set: Start ===================
    setPlayerIndex(playerIndex) {
        this.playerIndex = playerIndex;
    },
    getPlayerIndex() {
        return this.playerIndex;
    },
    getPlayerByIndex(playerIndex) {
        return this.heroes[playerIndex];
    },
    setCallbacks(playerInfoCallback, updatePlayerTurnCallback) {
        this.updateHeroInfoUI = playerInfoCallback;
        this.updatePlayerTurnCallback = updatePlayerTurnCallback;
    },
    setCellPosition(firstCellPos, lastCellPos) {
        this.firstCellPos = firstCellPos;
        this.lastCellPos = lastCellPos;
    },
    setMapSetting(mapHeight, mapWidth, mapTileWidth, mapTileHeight) {
        this.mapHeight = mapHeight;
        this.mapWidth = mapWidth;
        this.mapTileWidth = mapTileWidth;
        this.mapTileHeight = mapTileHeight;
    },
    getPlayerTurnCount() {
        if (this.playerTurnCount == undefined || this.playerTurnCount == null) {
            this.playerTurnCount = 3;
        }
        return this.playerTurnCount;
    },
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

    getMapSetting() {
        return {
            mapHeight: this.mapHeight,
            mapWidth: this.mapWidth,
            mapTileWidth: this.mapTileWidth,
            mapTileHeight: this.mapTileHeight,
        };
    },

    setNewEmemy(newEnemy) {
        if (this.enemies == null || this.enemies == undefined) this.enemies = [];


        this.enemies.push(newEnemy);
    },

    getEnemy() {
        return this.enemies;
    },


    getSelectedHeroPrefabs() {
        return this.selectedHeroPrefabs;
    },

    addSelectedHeroPrefab(prefab) {
        if (!this.selectedHeroPrefabs) this.selectedHeroPrefabs = [];
        this.selectedHeroPrefabs.push(prefab);
    },

    getBoss() {
        return this.bosses;
    },

    getFocusedHero() {
        return this.focusedHero;
    },

    setHighlightTilePrefab(highlightTilePrefab) {
        this.highlightTilePrefab = highlightTilePrefab;
    },

    setRootNode(node) {
        this.rootNode = node;
    },

    addHero(hero) {
        if (this.heroes == undefined) this.heroes = [];
        this.heroes.push(hero);
    },

    clearHeroes() {
        this.heroes.forEach(hero => {
            hero.destroy();
        })

        this.heroes = [];
    },

    clearBosses() {
        this.bosses.forEach(boss => {
            boss.node.destroy();
        })

        this.bosses = [];
    },

    addBoss(boss, size) {
        // this.boss = boss;
        if (this.bosses == undefined) this.bosses = [];
        this.bosses.push({
            node: boss,
            size: size || 1,
        });
    },
    // =================== Get-Set: End ===================



    // =================== Enemy Logic: Start ===================
    consumePlayerTurn(hero) {
        if (hero == this.getFocusedHero()) {
            this.socketIOManager.turn.consumeAction();
        }
        this.updatePlayerTurnCallback();
    },
    enemyAutoMode() {
        if (this.enemies == undefined || this.enemies == null) return;
        if (this.enemies.length == 0) return;

        this.enemies.forEach((enemy, index) => {
            let nearestHero = this.findNearestHero(enemy);
            if (!nearestHero) return;

            let enemyPos = this.positionToGrid(enemy);
            let heroPos = this.positionToGrid(nearestHero);
            if (!enemyPos || !heroPos) return;
            const dx = Math.abs(enemyPos.x - heroPos.x);
            const dy = Math.abs(enemyPos.y - heroPos.y);

            let enemyAttackRange = 1;

            if (dx + dy <= enemyAttackRange) {
                enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

                if (enemy.mainScript) {
                    let dame = enemy.mainScript.getAttackDame();
                }
            } else {
                EventBus.emit(EventBus.events.ENEMY_AUTO_MODE, enemy, nearestHero);
            }
        })
    },

    async bossAutoMode() {
        if (!this.bosses || this.bosses.length === 0) {
            return;
        }

        let bossArray = this.bosses.map(b => b.node);

        for (let index = 0; index < bossArray.length; index++) {
            let enemy = bossArray[index];
            let nearestHero = this.findNearestHero(enemy);
            if (!nearestHero) continue;

            // distance between enemy and nearest hero
            let enemyPos = this.positionToGrid(enemy);
            let heroPos = this.positionToGrid(nearestHero);
            if (!enemyPos || !heroPos) continue;
            const dx = Math.abs(enemyPos.x - heroPos.x);
            const dy = Math.abs(enemyPos.y - heroPos.y);

            let enemyAttackRange = 1;

            if (dx + dy <= enemyAttackRange) {
                enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

                if (enemy.mainScript) {
                    let heroId = nearestHero.mainScript.characterId;
                    let enemyId = enemy.mainScript.characterId;

                    await this.socketIOManager.game.bossAttack(
                        enemyId, heroId
                    );
                }

                if (index === bossArray.length - 1) {
                    await new Promise(resolve => {
                        setTimeout(() => {
                            this.socketIOManager.turn.endBossTurn();
                            resolve();
                        }, 500);
                    });
                }
            } else {
                await new Promise(resolve => {
                    EventBus.emit(EventBus.events.ENEMY_AUTO_MODE, enemy, nearestHero, resolve);
                });

                if (index === bossArray.length - 1) {
                    await new Promise(resolve => {
                        setTimeout(() => {
                            this.socketIOManager.turn.endBossTurn();
                            resolve();
                        }, 500);
                    });
                }
            }

        }
    },

    async bossAttack(enemy, hero) {
        let dame = enemy.mainScript.getAttackDame();
        // enemy.mainScript.dealDame(nearestHero, dame);
        let heroId = hero.mainScript.characterId;
        let enemyId = enemy.mainScript.characterId;
        let newHealth = await this.socketIOManager.game.takeDame(enemyId, heroId, dame);
        let direction = this.getDirection(this.positionToGrid(enemy), this.positionToGrid(hero));
        enemy.mainScript.playAnimation("attack_" + direction, 0.4);
        // this.socketIOManager.turn.endBossTurn();
        hero.mainScript.updateHpBar();
        this.updateInfo(this.getPlayerByIndex(this.getPlayerIndex()));
    },

    findNearestHero(enemy) {
        if (!this.heroes || this.heroes.length === 0) return null;

        let nearestHero = null;

        let minDistance = Infinity;

        this.heroes.forEach(hero => {
            const distance = cc.v2(enemy.x - hero.x, enemy.y - hero.y).mag();
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestHero = hero;
            }
        });
        return nearestHero;
    },

    async heroClick(node) {
        let walkableMap = await this.socketIOManager.game.getWalkableGridMap();
        if (node == this.focusedHero) {
            EventBus.emit(EventBus.events.DISPLAY_WALKABLE_AREA, this.firstCellPos, this.lastCellPos, walkableMap, node);
        }
        
        // this.setFocusedHero(this.heroes.indexOf(node));
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

    heroAttackFromServer(playerOrder, targetOrder, isBoss) {
        let player = this.getPlayerByIndex(playerOrder);
        if (!player) {
            console.warn("Không tìm thấy người chơi với chỉ số", playerOrder);
            return;
        }
        let enemy;
        if (isBoss) {
            let bossIndex = this.getBossIndexFromNode(this.bosses[targetOrder].node);
            if (bossIndex < 0) {
                console.warn("Không tìm thấy boss trong danh sách bosses");
                return;
            }
            enemy = this.bosses[bossIndex].node;
        } else {
            if (this.enemies[targetOrder] == undefined || this.enemies[targetOrder] == null) {
                console.warn("Không tìm thấy kẻ thù với chỉ số", targetOrder);
                return;
            }
            enemy = this.enemies[targetOrder];
        }
        if (!enemy) {
            console.warn("Không tìm thấy kẻ thù");
            return;
        }

        this.heroAttackTarget(player, enemy, true);
    },

    bossAttackFromServer(enemyId, heroId) {
        let enemy = this.bosses.find(b => b.node.mainScript.characterId === enemyId);
        if (!enemy) {
            console.warn("Không tìm thấy boss với ID", enemyId);
            return;
        }
        enemy = enemy.node;

        let hero = this.heroes.find(h => h.mainScript.characterId === heroId);
        if (!hero) {
            console.warn("Không tìm thấy hero với ID", heroId);
            return;
        }

        this.bossAttack(enemy, hero);
    },

    async heroAttackTarget(hero, enemy, isFromServer = false) {
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return; 
        }

        let isBoss = this.isBoss(enemy);
        let targetOrder;
        if (isBoss) {
            targetOrder = this.getBossIndexFromNode(enemy);
            if (targetOrder < 0) {
                console.warn("Không tìm thấy boss trong danh sách bosses");
                return;
            }
        }

        enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.getCurrentHp === 'function');
        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.dealDame === 'function');

        if (!isFromServer) {
            this.socketIOManager.game.otherPlayerAttack({
                playerOrder: this.getPlayerIndex(),
                targetOrder: targetOrder,
                isBoss: isBoss,
            });
            let dameFromServer = await this.socketIOManager.game.getAttackDame({
                playerOrder: this.getPlayerIndex(),
            });
            let heroId = hero.mainScript.characterId;
            let enemyId = enemy.mainScript.characterId;
            let newHealth = await this.socketIOManager.game.takeDame(heroId, enemyId, dameFromServer);
            return;
        }

        const enemyPos = this.positionToGrid(enemy);

        // optimize: hàm attack chỉ dùng để chạy animation, không cần trả về dame
        const heroPos = this.positionToGrid(hero);
        if (!enemyPos || !heroPos) return;
        let direction = this.getDirection(heroPos, enemyPos);
        let dame = await hero.mainScript.attack(enemy, direction);
        // optimize
        enemy.mainScript.updateHpBar();
        // this.consumePlayerTurn();
        this.consumePlayerTurn(hero);
    },

    getBossIndexFromNode(node) {
        if (this.bosses == undefined || this.bosses == null) {
            return -1;
        }

        for (let i = 0; i < this.bosses.length; i++) {
            if (this.bosses[i].node === node) {
                return i;
            }
        }
        return -1;
    },

    isBoss(node) {
        if (this.bosses == undefined || this.bosses == null) {
            return false;
        }

        for (let i = 0; i < this.bosses.length; i++) {
            if (this.bosses[i].node === node) {
                return true;
            }
        }
        return false;
    },


    showEnemySelection(enemies, onEnemySelected) {
        if (this.isTarget) return;

        this.isTarget = true;
        enemies.forEach(enemy => {
            this.highlightEnemy(enemy);

            enemy.once(cc.Node.EventType.TOUCH_END, () => {
                this.clearEnemyHighlights(enemies);
                cc.systemEvent.off(cc.Node.EventType.TOUCH_END, this._onCancelEnemySelect, this);
                onEnemySelected(enemy);
            });
        });

        this._onCancelEnemySelect = (event) => {
            if (!enemies.some(enemy => enemy === event.target)) {
                this.clearEnemyHighlights(enemies);
                cc.systemEvent.off(cc.Node.EventType.TOUCH_END, this._onCancelEnemySelect, this);
            }
        };

        // Listen for touch end event to cancel enemy selection
        cc.systemEvent.on(cc.Node.EventType.TOUCH_END, this._onCancelEnemySelect, this);
    },

    highlightEnemy(enemy) {
        enemy.scale = enemy.scale * 1.5;
    },

    clearEnemyHighlights(enemies) {
        this.isTarget = false;
        enemies.forEach(enemy => {
            enemy.scale = enemy.scale / 1.5; // reset scale
            enemy.off(cc.Node.EventType.TOUCH_END);
        });
    },

    checkAttackRangeHero(hero) {
        let enemiesInRange = [];
        if (hero == undefined || hero == null) hero = this.getFocusedHero();
        if (this.enemies == undefined || this.enemies == null) this.enemies = [];

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.getAttackRange === 'function');
        if (!hero.mainScript) {
            console.log('no getAttackRange function');
            return enemiesInRange;
        }

        let attackRange = hero.mainScript.getAttackRange();

        if (attackRange <= 0) {
            console.log('attack range is 0');
            return enemiesInRange;
        }

        this.enemies.forEach((enemy) => {
            let enemyPos = this.positionToGrid(enemy);
            let heroPos = this.positionToGrid(hero);
            if (!enemyPos || !heroPos) return;

            const dx = Math.abs(enemyPos.x - heroPos.x);
            const dy = Math.abs(enemyPos.y - heroPos.y);

            if (dx + dy <= attackRange) {
                enemiesInRange.push(enemy);
            }
        })

        this.bosses.forEach((boss) => {
            let bossPos = this.bossStartPositionToGrid(boss);
            let heroPos = this.positionToGrid(hero);
            if (!bossPos || !heroPos) return;
            for (let i = 0; i < boss.size; i++) {
                for (let j = 0; j < boss.size; j++) {
                    const dx = Math.abs(bossPos.x + i - heroPos.x);
                    const dy = Math.abs(bossPos.y + j - heroPos.y);
                    if (dx + dy <= attackRange) {
                        enemiesInRange.push(boss.node);
                        break;
                    }
                }
            }
        });

        return enemiesInRange;
    },

    // *** hardcode ***
    heroUltimate(hero) {
        if (hero == null || hero == undefined) {
            hero = this.focusedHero;
        }

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');

        if (hero.mainScript) {
            let ultimateCooldown = hero.mainScript.getUltimateCooldown();
            if (ultimateCooldown > 0) {
                console.warn('Ultimate is on cooldown, please wait for it to be ready');
                return;
            }

            if (hero.name == 'Vampire') {
                this.vampireUltimate(hero);
            } else if (hero.name == 'Bruiser') {
                this.bruiserUltimate(hero);
            } else if (hero.name == 'Adc') {
                this.adcUltimate(hero);
            } else if (hero.name == 'Tanker') {
                // this.testTankUltimate(hero);
            } else {
                return;
            }

            hero.mainScript.resetUltimateCooldown();
            this.updateInfo();
            // this.consumePlayerTurn();
            
        }
    },

    adcUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');
        if (hero.mainScript) {
            let enemiesInRange = [];

            if (this.enemies == undefined || this.enemies == null) this.enemies = [];
            if (this.bosses == undefined || this.bosses == null) this.bosses = [];
            this.enemies.forEach((enemy) => {
                enemiesInRange.push(enemy);
            })

            this.bosses.forEach((boss) => {
                enemiesInRange.push(boss.node);
            });

            this.showEnemySelection(enemiesInRange, (selectedEnemy) => {
                this.heroUltimateEnemy(hero, selectedEnemy);
            });
        }
    },

    vampireUltimate(hero) {
        if (hero == null || hero == undefined) {
            hero = this.focusedHero;
        }

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');
        if (hero.mainScript) {
            this.showTileSelection((startTile) => {
                hero.mainScript.ultimate(startTile, (animPrefab, tile, times, dame) => {
                    this.spawnUltimateAnimation(animPrefab, tile, times, dame);
                });
            }, false);
        }
    },

    bruiserUltimate(hero) {
        if (hero == null || hero == undefined) hero = this.focusedHero;

        hero.mainScript = hero.getComponents(cc.Component).find(c => typeof c.ultimate === 'function');

        if (hero.mainScript) {
            this.showTileSelection((targetTile) => {
                hero.mainScript.ultimate(targetTile, {
                    firstTile: this.firstCellPos,
                    tileWidth: this.mapTileWidth,
                    tileHeight: this.mapTileHeight,
                }
                );
            }, true);
        }
    },

    showTileSelection(onTileSelected, isCheckWalkable = false) {
        if (!this.highlightTiles) {
            this.highlightTiles = [];
        }
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                if (isCheckWalkable && (this.gridMap[x] == undefined || this.gridMap[x][y] == undefined || this.gridMap[x][y] == false)) {
                    continue;
                }
                let highlight = cc.instantiate(this.highlightTilePrefab);
                this.rootNode.addChild(highlight);
                highlight.setPosition(
                    x * this.mapTileWidth + this.mapTileWidth / 2,
                    y * this.mapTileHeight + this.mapTileHeight / 2
                );
                highlight.on(cc.Node.EventType.TOUCH_END, () => {
                    this.clearTileHighlights();
                    onTileSelected({ x, y });
                });
                this.highlightTiles.push(highlight);
            }
        }
    },

    clearTileHighlights() {
        if (!this.highlightTiles) {
            return;
        }
        this.highlightTiles.forEach(tile => tile.destroy());
        this.highlightTiles = [];
    },

    async heroUltimateEnemy(hero, enemy) {
        if (!hero || !enemy || !hero.mainScript) {
            console.warn("Thiếu hero hoặc enemy hoặc mainScript");
            return;
        }

        let dame = await hero.mainScript.ultimate(enemy);

        enemy.mainScript.takeDame(dame);
    },

    spawnUltimateAnimation(animPrefab, tile, times, dame) {
        if (times == 0) {
            return;
        }
        let ranTimeToSpawn = Math.random();

        if (!this.rootNode) {
            console.error('Root node is not set for spawning ultimate animation');
            return;
        }
        this.scheduleOnce(() => {
            const anim = cc.instantiate(animPrefab);

            if (!anim || !anim.getComponent(cc.Animation)) {
                console.error('Animation prefab is not valid or does not have an Animation component');
                return;
            }
            anim.setPosition(
                tile.x * this.mapTileWidth + this.mapTileWidth / 2,
                tile.y * this.mapTileHeight + this.mapTileHeight / 2
            );
            this.rootNode.addChild(anim);

            this.dealDameTile(tile, dame);
            times--;

            this.scheduleOnce(() => {
                this.spawnUltimateAnimation(anim, tile, times, dame);
            }, 0.5);
        }, ranTimeToSpawn);
    },

    dealDameTile(tile, dame) {
        if (this.enemies == undefined || this.enemies == null) this.enemies = [];
        if (this.bosses == undefined || this.bosses == null) this.bosses = [];

        // deal dame to all enemies and bosses in the affactedTile

        if (this.gridMap[tile.x] == undefined || this.gridMap[tile.x][tile.y] == undefined) return;
        if (this.gridMap[tile.x][tile.y] == false) {
            // tile is walkable, so we can deal dame to enemies and bosses
            this.enemies.forEach((enemy) => {
                let enemyPos = this.positionToGrid(enemy);
                if (enemyPos && enemyPos.x === tile.x && enemyPos.y === tile.y) {
                    enemy.mainScript = enemy.getComponents(cc.Component).find(c => typeof c.takeDame === 'function');
                    if (enemy.mainScript) {
                        enemy.mainScript.takeDame(dame);
                        // if (enemy.mainScript.getCurrentHp() <= 0) {
                        //     this.handleEnemyDie(enemy);
                        // }
                    }
                }
            });

            this.bosses.forEach((boss) => {
                let bossPos = this.bossStartPositionToGrid(boss);
                if (bossPos && bossPos.x === tile.x && bossPos.y === tile.y) {
                    boss.node.mainScript = boss.node.getComponents(cc.Component).find(c => typeof c.takeDame === 'function');
                    if (boss.node.mainScript) {
                        boss.node.mainScript.takeDame(dame);
                        // if (boss.node.mainScript.getCurrentHp() <= 0) {
                        //     this.handleEnemyDie(boss);
                        // }
                    }
                }
            });
        }

    },

    // =================== Hero Ultimate: End ===================
    handleCharacterDeath(characterId) {
        if (this.heroes == undefined || this.heroes == null) return;
        if (this.bosses == undefined || this.bosses == null) return;

        // check if character is hero
        let hero = this.heroes.find(hero => hero.mainScript.characterId === characterId);
        if (hero) {
            this.heroes.splice(this.heroes.indexOf(hero), 1);
            return;
        }

        // check if character is boss
        let boss = this.bosses.find(b => b.node.mainScript.characterId === characterId);
        if (boss) {
            this.bosses.splice(this.bosses.indexOf(boss), 1);
            return;
        }
    },

    handlePlayerQuit(characterId) {
        if (this.heroes == undefined || this.heroes == null) return;

        // check if character is hero
        let hero = this.heroes.find(hero => hero.mainScript.characterId === characterId);
        if (hero) {
            this.heroes.splice(this.heroes.indexOf(hero), 1);
            hero.destroy();
            return;
        }
    },

    positionToGrid(node) {
        if (this.firstCellPos == undefined || this.lastCellPos == undefined) return null;
        if (this.mapTileWidth == undefined || this.mapTileHeight == undefined) return null;

        let gridX = Math.floor(node.x / this.mapTileWidth);
        let gridY = Math.floor(node.y / this.mapTileHeight);

        if (gridX < 0 || gridY < 0 || gridX >= this.mapWidth || gridY >= this.mapHeight) {
            return null;
        }

        return {
            x: gridX,
            y: gridY,
        }
    },

    bossStartPositionToGrid(boss) {
        if (this.firstCellPos == undefined || this.lastCellPos == undefined) return null;
        if (this.mapTileWidth == undefined || this.mapTileHeight == undefined) return null;

        let gridX = Math.floor((boss.node.x - (this.mapTileWidth * boss.size) / 2) / this.mapTileWidth);
        let gridY = Math.floor((boss.node.y - (this.mapTileHeight * boss.size) / 2) / this.mapTileHeight);

        if (gridX < 0 || gridY < 0 || gridX >= this.mapWidth || gridY >= this.mapHeight) {
            return null;
        }

        return {
            x: gridX,
            y: gridY,
        }
    },

    /* game system */

    resetGame() {
        this.listenMoveNode = null;
        this.focusedHero = null;
        this.heroes = []; // hero in game
        this.gridMap = [];
        this.winner = null; // 'boss', 'player'
        this.isMoving = false;
        this.isAttacking = false;
        this.isUsingSkill = false;
        this.enemies = [];
        this.bosses = [];
        // this.setFocusedHero(0);
        this.isAutoMode = false;
        this.isPlayerTurn = true;
        this.playerTurnCount = 3;
    },

    // new game
    newGame() {
        this.resetGame();
        this.selectedHeroPrefabs = [];
    },

    backToMapSelect() {
        this.mapPick = null;
        this.heroPick = [];
        this.selectedHeroPrefabs = [];
    },

    getWinner() {
        if (this.winner == undefined || this.winner == null) {
            return;
        }

        return this.winner;
    },

    getWonMap() {
        if (this.gameWonIndex == undefined || this.gameWonIndex == null) this.gameWonIndex = 0;
        return this.gameWonIndex;
    },

    setWonMap() {
        if (this.mapPick < this.gameWonIndex) return;
        this.gameWonIndex = this.mapPick + 1;
    },

    getTurnOnMusic() {
        if (this.isTurnOnMusic == undefined || this.isTurnOnMusic == null) this.isTurnOnMusic = true;
        return this.isTurnOnMusic;
    },

    setIsTurnOnMusic(isTurnOn) {
        this.isTurnOnMusic = isTurnOn;
    },

    getDirection(current, next) {
        if (next.x > current.x) return 'right';
        if (next.x < current.x) return 'left';
        if (next.y > current.y) return 'front';
        if (next.y < current.y) return 'back';
        return 'front';
    },
});

export default GameController;