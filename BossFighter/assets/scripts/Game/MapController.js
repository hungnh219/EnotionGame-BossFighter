import GameController from "./GameController";

cc.Class({
    extends: cc.Component,

    statics: {
        getInstance() {
            return instance;
        }
    },
    properties: {
       mapLayout: cc.Layout,

       mapObjectPrefab: cc.Prefab,
       mapObjectHolder: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        instance = this;

        this.gameController = GameController.getInstance();
    },

    start () {

    },

    initMapSize(mapHeight, mapWidth, mapTileHeight, mapTileWidth) {
        this.mapHeight = mapHeight;
        this.mapWidth = mapWidth;

        this.mapTileHeight = mapTileHeight;
        this.mapTileWidth = mapTileWidth;
    },

    viewMap(mapSize, tileSize, spriteFrames) {
        this.mapLayout.node.removeAllChildren();

        this.mapLayout.node.width = mapSize.width * tileSize.width;
        this.mapLayout.node.height = mapSize.height * tileSize.height;
        
        this.mapHeight = mapSize.height;
        this.mapWidth = mapSize.width;
        this.mapTileWidth = tileSize.width;
        this.mapTileHeight = tileSize.height;

        // center the map layout
        this.mapLayout.node.setPosition(cc.v2(-this.mapLayout.node.width / 2, -this.mapLayout.node.height / 2));
        this.mapObjectHolder.setPosition(this.mapLayout.node.getPosition());

        for (let i = 0; i < mapSize.width; i++) {
            for (let j = 0; j < mapSize.height; j++) {
                const tileNode = new cc.Node(`Tile_${i}_${j}`);
                const sprite = tileNode.addComponent(cc.Sprite);
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

                tileNode.width = tileSize.width;
                tileNode.height = tileSize.height;
                // sprite.spriteFrame = spriteFrames[mapHolder[i][j]];

                tileNode.setPosition(i * tileSize.width, j * tileSize.height);
                
                

                this.mapLayout.node.addChild(tileNode);

                if (i == 0 && j == 0) {
                    sprite.spriteFrame = spriteFrames[7];
                } else if (i == mapSize.width - 1 && j == mapSize.height - 1) {
                    sprite.spriteFrame = spriteFrames[5];
                } else if (i == 0 && j == mapSize.height - 1) {
                    sprite.spriteFrame = spriteFrames[6];
                } else if (i == mapSize.width - 1 && j == 0) {
                    sprite.spriteFrame = spriteFrames[4];
                } else if (i == 0) {
                    sprite.spriteFrame = spriteFrames[1];
                } else if (j == 0) {
                    sprite.spriteFrame = spriteFrames[0];
                } else if (i == mapSize.width - 1) {
                    sprite.spriteFrame = spriteFrames[3];
                } else if (j == mapSize.height - 1) {
                    sprite.spriteFrame = spriteFrames[2];
                } else {
                    sprite.spriteFrame = spriteFrames[0];
                }
            }
        }
    },

    viewObjectsMap(mapData, mapWidth, mapHeight, mapObjectSpriteFrames) {
        console.log("Viewing objects map with data:", mapData, mapWidth, mapHeight, mapObjectSpriteFrames);

        for (let j = 0; j < mapHeight; j++) {
            for (let i = 0; i < mapWidth; i++) {
                let newJ = mapHeight - j - 1;
                const objectId = mapData[newJ][i];
                if (objectId === 0) {
                    this.gameController.updateWalkable(i, j, 1, true);
                    continue;
                }

                const spriteFrame = mapObjectSpriteFrames[objectId];
                if (!spriteFrame) {
                    continue;
                }

                const prefab = cc.instantiate(this.mapObjectPrefab);
                const sprite = prefab.getComponent(cc.Sprite);
                if (sprite) {
                    sprite.spriteFrame = spriteFrame;
                } else {
                    console.warn(`No sprite component found on prefab for object ID: ${objectId}`);
                    continue;
                }

                this.mapObjectHolder.addChild(prefab);
                this.addObjectIntoMap(i, j, 1, prefab);
                this.gameController.updateWalkable(i, j, 1, false);
            }
        }
    },

    spawnBossIntoMap(bossNode, position, size = 1) {
        const posX = position.x ? position.x : this.mapWidth - 3;
        const posY = position.y ? position.y : this.mapHeight - 3;

        // scale boss to 1.5 if size > 1
        if (size == 1) {
            bossNode.scale = 1;
        } else if (size > 1) {
            bossNode.scale = 1.5;

            // if (mapIndex == 2) {
            //     this.bossNode.scale = 1;
            // }
        } else if (size > 3) {
            bossNode.scale = 2;
        }

        if (this.mapIndex == 1) {
            bossNode.scale = 1.5;
        }


        this.mapObjectHolder.addChild(bossNode);
        this.addObjectIntoMap(posX, posY, size, bossNode);

        this.gameController.updateWalkable(posX, posY, size, false);
        this.gameController.addBoss(bossNode, size);
    },

    spawnEnemyIntoMap(enemy) {
        if (!enemy) {
            console.error("No enemy to spawn");
            return;
        }

        let posX = Math.floor(Math.random() * this.mapWidth);
        let posY = Math.floor(Math.random() * this.mapHeight);

        let walkableMap = this.gameController.getWalkableMap();
        while (!walkableMap[posX][posY]) {
            posX = Math.floor(Math.random() * this.mapWidth);
            posY = Math.floor(Math.random() * this.mapHeight);
        }

        this.mapObjectHolder.addChild(enemy);

        this.gameController.setNewEmemy(enemy);
        this.addObjectIntoMap(posX, posY, 1, enemy);
        this.gameController.updateWalkable(posX, posY, 1, false);
    },

    spawnHeroIntoMap(heroPrefabs, focusEffectPrefab) {
        console.log("Spawning heroes into map with prefabs:", heroPrefabs);
        heroPrefabs.forEach((heroPrefab, index) => {
            let prefabNode = cc.instantiate(heroPrefab)
            let effectNode = cc.instantiate(focusEffectPrefab)
            prefabNode.focusEffect = effectNode;
            effectNode.setPosition(cc.v2(0, this.mapTileHeight));
            effectNode.active = false;
            prefabNode.addChild(effectNode);

            this.mapObjectHolder.addChild(prefabNode);
            this.gameController.addHero(prefabNode);
            this.addObjectIntoMap(index, 0, 1, prefabNode);
            // this.updateWalkable(index, 0, 1);
            this.gameController.updateWalkable(index, 0, 1, false);

            // this.heroes.push(prefabNode)
        });
    },

    addObjectIntoMap(gridX, gridY, size, object) {
        let objectNode = object;

        if (object.node) objectNode = object.node;

        // resize the object
        if (objectNode.width > objectNode.height) {
            let ratio = this.mapTileHeight / objectNode.height;

            objectNode.height = this.mapTileHeight * size;

            objectNode.width *= ratio * size;
        } else {
            objectNode.width = this.mapTileWidth * size;

            objectNode.height = this.mapTileHeight * size * (objectNode.width / this.mapTileWidth);
        }

        // set the position of the object
        const mapPos = this.mapLayout.node.getPosition();

        // objectNode.x = mapPos.x + gridX * this.mapTileWidth + (this.mapTileWidth * size) / 2;
        // objectNode.y = mapPos.y + gridY * this.mapTileHeight + (this.mapTileHeight * size) / 2;
        objectNode.x = gridX * this.mapTileWidth + (this.mapTileWidth * size) / 2;
        objectNode.y = gridY * this.mapTileHeight + (this.mapTileHeight * size) / 2;
    },

    setCellPosition() {
        const firstCellPos = {
            x: this.mapLayout.node.x,
            y: this.mapLayout.node.y,
        };

        const lastCellPos = {
            x: this.mapLayout.node.x + this.mapWidth * this.mapTileWidth,
            y: this.mapLayout.node.y + this.mapHeight * this.mapTileHeight,
        };

        this.gameController.setCellPosition(firstCellPos, lastCellPos);
    }


    // update (dt) {},
});

// export default MapController;