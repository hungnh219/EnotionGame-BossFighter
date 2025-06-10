const logicHandler = require('../handler/logicHandler');

function gameEvents(io, socket) {
    // ============= init =============
    // ================================
    socket.on('INIT_DATA', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName]) {
            console.error('Không tìm thấy dữ liệu phòng:', roomName);
            return;
        }

        let playerData = [];
        roomData[roomName].player.forEach(playerObj => {
            const playerId = Object.keys(playerObj)[0];
            const playerInfo = playerObj[playerId];
            const heroData = logicHandler.common.getCharacterData(playerInfo.lockedHero);
            if (!heroData) {
            console.error('Không tìm thấy dữ liệu hero cho lockedHero:', playerInfo.lockedHero);
            return;
            }
            playerData[playerInfo.order] = {
                lockedHero: playerInfo.lockedHero,
                id: heroData.id,
                hp: heroData.maxHp,
                maxHp: heroData.maxHp,
                name: heroData.name,
            };
        });

        io.to(socket.id).emit('DATA_INITIALIZED', {
            // roomData: roomData[roomName]
            heroData: playerData,
        });
    });

    socket.on('sendGameMessage', (roomName, message) => {
        let roomData = logicHandler.common.readRoomData();
        console.log(`Tin nhắn từ ${socket.id} tại phòng ${roomName}: ${message}`);
        const playerId = socket.id
        const room = roomData[roomName];
        const player = room.player.find(playerObj => Object.keys(playerObj)[0] === playerId);
        const playerName = player[playerId].name;
        io.to(roomName).emit('receiveGameMessages', {
            success: true,
            sender: playerId,
            senderName: playerName,
            text: message,
            message: `Gửi tin nhắn thành công`
        });
    });


    socket.on('GET_PLAYER_ORDER', () => {
        const roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        const playerId = socket.id;
        const player = roomData[roomName].player.find(playerObj => Object.keys(playerObj)[0] === playerId);

        if (!player) {
            console.error('Không tìm thấy người chơi với socket ID:', socket.id);
            return;
        }

        let order = player[playerId].order;

        // io.to(roomName).emit('PLAYER_ORDER', {
        //     order: order
        // });
        socket.emit('PLAYER_ORDER', {
            order: order
        });
    })

    socket.on('INITIALIZE_GAME', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();

        // lấy dữ liệu id + order + lockedHero của người chơi 
        let playerData = logicHandler.game.getPlayerGameData(roomData, roomName);
        if (!playerData) {
            console.error('Không tìm thấy dữ liệu người chơi trong dữ liệu phòng:', roomName);
            return;
        }

        // tạo dữ liệu mảng heroes cho người chơi (thứ tự là theo order)
        let heroes = [];
        playerData.forEach(player => {
            let playerId = player.id;
            let order = player.order;
            let lockedHero = player.lockedHero;
            let heroData = logicHandler.common.getCharacterData(lockedHero);

            heroes[order] = {
                id: playerId,
                order: order,
                lockedHero: lockedHero,
                heroId: heroData.id,
                hp: heroData.maxHp,
                maxHp: heroData.maxHp,
                attackDamage: heroData.attackDamage,
                attackRange: heroData.attackRange,
                name: heroData.name,
                status: "ALIVE",
                stats: {
                    totalDameDeal: 0,
                    totalDameTaken: 0,
                    totalScore: 0 + Math.floor(Math.random() * 10), // điểm số ngẫu nhiên ban đầu
                }
            };
        })

        let bosses = [];
        let mapIndex = roomData[roomName].gameState.currentMapIndex || 0;
        let bossIndex = logicHandler.common.getBossIndex(mapIndex);

        console.log('Boss index:', bossIndex, 'Map index:', mapIndex);


        bossIndex.forEach((boss, index) => {
            let bossData = logicHandler.common.getBossDataByIndex(index);

            let newBoss = {
                bossId: bossData.id,
                hp: bossData.maxHp,
                maxHp: bossData.maxHp,
                attackDamage: bossData.attackDamage,
                attackRange: bossData.attackRange,
                name: bossData.name,
                status: "ALIVE",
            }

            if (!bosses.find(b => b.bossId === newBoss.bossId)) {
                bosses.push(newBoss);
            } else {
                console.warn('Boss đã tồn tại trong danh sách bosses:', newBoss.bossId);
            }
        })

        roomData[roomName].gameState.heroes = heroes;
        roomData[roomName].gameState.bosses = bosses;

        logicHandler.common.writeRoomData(roomData);
    })

    socket.on('GET_ATTACK_DAME', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        let attackDamage = heroes[data.playerOrder].attackDamage;

        socket.emit('RETURN_ATTACK_DAME', {
            attackDamage: attackDamage,
        });
    })

    socket.on('OTHER_PLAYER_ATTACK', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        console.log('other player attack', data);
        io.to(roomName).emit('LISTEN_ATTACK', {
            playerOrder: data.playerOrder,
            targetOrder: data.targetOrder,
            isBoss: data.isBoss,
        });
    })

    socket.on('MOVE_TO_NEW_TILE', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let playerIndex = data.playerIndex;
        let heroes = roomData[roomName].gameState.heroes;
        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }
        // let hero = heroes[playerIndex];
        let hero = heroes.find(hero => hero.order === playerIndex);
        if (!hero) {
            console.error('Không tìm thấy hero với chỉ số:', playerIndex);
            return;
        }
        hero.x = data.newX;
        hero.y = data.newY;
        roomData[roomName].gameState.heroes[playerIndex] = hero;
        logicHandler.common.writeRoomData(roomData);

        io.to(roomName).emit('LISTEN_MOVE_TO_NEW_TILE', 
            data
        );

    })

    socket.on('UPDATE_WALKABLE_GRID_MAP', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }   

        let roomData = logicHandler.common.readRoomData();

        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);


        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }
        logicHandler.game.updateWalkableGridMap(roomData, roomName, data.x, data.y, data.isWalkable);
        
        logicHandler.common.writeRoomData(roomData);

        io.to(roomName).emit('WALKABLE_GRID_MAP_UPDATED', {
            walkableGridMap: walkableGridMap,
        });
    })

    socket.on('GET_WALKABLE_GRID_MAP', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);

        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }

        io.to(roomName).emit('RETURN_WALKABLE_GRID_MAP', {
            walkableGridMap: walkableGridMap,
        });
    })

    socket.on('FIND_PATH', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }
        
        let roomData = logicHandler.common.readRoomData();
        let walkableGridMap = logicHandler.game.getWalkableGridMap(roomData, roomName);

        if (!walkableGridMap) {
            console.error('Không tìm thấy bản đồ ô đi lại trong dữ liệu phòng:', roomName);
            return;
        }

        let start = data.start;
        let end = data.end;
        let maxStep = data.maxStep || 3;


        let path = logicHandler.game.findPath(start, end, walkableGridMap, maxStep);

        io.to(roomName).emit('RETURN_PATH', {
            path: path,
        });
    })

    socket.on('NEXT_MAP', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        console.log('Yêu cầu chuyển sang bản đồ mới từ client:', socket.id);

        let roomData = logicHandler.common.readRoomData();
        let currentMapIndex = roomData[roomName].gameState.currentMapIndex;

        currentMapIndex++;

        // if (currentMapIndex >= roomData[roomName].gameState.mapData.length) {
        //     currentMapIndex = 0;
        // }

        roomData[roomName].gameState.currentMapIndex = currentMapIndex;

        let boss = logicHandler.common.getBossDataByIndex(currentMapIndex);

        let newBoss = {
            bossId: boss.id,
            hp: boss.maxHp,
            maxHp: boss.maxHp,
            attackDamage: boss.attackDamage,
            attackRange: boss.attackRange,
            name: boss.name,
        }

        roomData[roomName].gameState.bosses.push(newBoss);

        logicHandler.common.writeRoomData(roomData);

        io.to(roomName).emit('LISTEN_NEXT_MAP', {
            currentMapIndex: currentMapIndex
        });
    })

    socket.on('GET_CHARACTER_DATA', (data) => {
        let characterData = logicHandler.common.getCharacterById(data.characterId);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật.');
            return;
        }

        console.log('id', data.characterId, 'Gửi dữ liệu nhân vật:', characterData);

        socket.emit('RETURN_CHARACTER_DATA', {
            characterData: characterData,
        });
    })

    socket.on('GET_LEADER_BOARD', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;
        let players = roomData[roomName].player;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }
        let leaderBoard = [];
        heroes.forEach(hero => {
            const playerObj = players.find(p =>
                Object.values(p)[0].order === hero.order
            );

            if (playerObj) {
                const playerInfo = Object.values(playerObj)[0]; // Truy xuất thông tin người chơi
                leaderBoard.push({
                    playerName: playerInfo.name,
                    totalScore: hero.stats.totalScore,
                });
            } else {
                console.warn('Không tìm thấy người chơi với order:', hero.order);
            }
        });

        leaderBoard.sort((a, b) => b.totalScore - a.totalScore);
        // Sắp xếp heroes theo tổng điểm (totalScore) giảm dần
        // heroes.sort((a, b) => b.stats.totalScore - a.stats.totalScore);

        io.to(roomName).emit('RETURN_LEADER_BOARD', {
            leaderBoard: leaderBoard,
        });
    })

    socket.on('TAKE_DAME', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }


        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        let dealderId = data.dealerId;
        let isHero = logicHandler.common.isHero(dealderId);
        
        let characterId = data.characterId;
        let characterData = logicHandler.common.getInGameCharacterData(characterId, roomData, roomName);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật với ID:', characterId);
            return;
        }
        characterData.hp -= data.dame;

        if (characterData.hp <= 0) {
            characterData.hp = 0;
            characterData.status = "DEAD";
        }

        if (isHero) {
            let hero = heroes.find(hero => hero.heroId === dealderId);
            if (!hero) {
                console.error('Không tìm thấy hero với ID:', dealderId);
                return;
            }
            hero.stats.totalDameDeal += data.dame;
            hero.stats.totalScore += data.dame;

            roomData[roomName].gameState.heroes = heroes;

            let bosses = roomData[roomName].gameState.bosses;
            let boss = bosses.find(boss => boss.bossId === characterId);
            if (boss) {
                boss.hp = characterData.hp;

                roomData[roomName].gameState.bosses = bosses;

                logicHandler.common.writeRoomData(roomData);

                console.log('Boss bị tấn công, HP mới:', boss.hp);
                if (boss.hp <= 0) {
                    console.log('Boss đã chết, thông báo cho tất cả người chơi');
                    io.to(roomName).emit('BOSS_DIE');
                }
            } else {
                console.error('Không tìm thấy boss với ID:', characterId);
            }
        } else {
            let hero = heroes.find(hero => hero.heroId === characterId);
            if (!hero) {
                console.error('Không tìm thấy hero với ID:', characterId);
                return;
            }
            hero.stats.totalDameTaken += data.dame;
            hero.stats.totalScore += data.dame;
            hero.hp = characterData.hp;
            
            roomData[roomName].gameState.heroes = heroes;

            logicHandler.common.writeRoomData(roomData);
        }


        io.to(roomName).emit('LISTEN_TAKE_DAME', {
            characterId: characterId,
            newHp: characterData.hp,
        })
    })

    socket.on('GET_CURRENT_HP', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let characterId = data.characterId;
        let characterData = logicHandler.common.getInGameCharacterData(characterId, roomData, roomName);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật với ID:', characterId);
            return;
        }

        socket.emit('RETURN_CURRENT_HP', {
            currentHp: characterData.hp,
        });
    })

    socket.on('BOSS_ATTACK', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        let bossId = data.enemyId;
        let heroId = data.heroId;

        let boss = roomData[roomName].gameState.bosses.find(b => b.bossId === bossId);
        if (!boss) {
            console.error('Không tìm thấy boss với ID:', bossId);
            return;
        }

        let hero = heroes.find(h => h.heroId === heroId);
        if (!hero) {
            console.error('Không tìm thấy hero với ID:', heroId);
            return;
        }

        // Tính sát thương từ boss
        let damage = boss.attackDamage;
        hero.hp -= damage;
        if (hero.hp <= 0) {
            hero.hp = 0;
            hero.status = "DEAD";
        }

        hero.stats.totalDameTaken += damage;
        hero.stats.totalScore += damage;
        roomData[roomName].gameState.heroes = heroes;
        logicHandler.common.writeRoomData(roomData);
        console.log('Boss tấn công hero:', heroId, 'Sát thương:', damage, 'HP mới:', hero.hp);

        io.to(roomName).emit('LISTEN_BOSS_ATTACK', {
            bossId: bossId,
            heroId: heroId,
        });
    });

    socket.on('GET_HEROES', ()  => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            return;
        }

        socket.emit('RETURN_HEROES', {
            heroes: heroes,
        });
    })

    socket.on('GET_BOSSES', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let bosses = roomData[roomName].gameState.bosses;

        if (!bosses) {
            return;
        }

        socket.emit('RETURN_BOSSES', {
            bosses: bosses,
        });
    })

    socket.on('GET_CURRENT_GAME_DATA', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName]) {
            return;
        }

        let gameState = roomData[roomName].gameState;

        if (!gameState) {
            return;
        }

        socket.emit('RETURN_CURRENT_GAME_DATA', {
            gameState: gameState,
        });
    })

    socket.on('GET_MAP_INDEX', () => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        if (!roomData[roomName]) {
            return;
        }

        let currentMapIndex = roomData[roomName].gameState.currentMapIndex;

        socket.emit('RETURN_MAP_INDEX', {
            currentMapIndex: currentMapIndex,
        });
    })

    socket.on('HANDLE_CHARACTER_DEATH', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;

        if (!heroes) {
            console.error('Không tìm thấy dữ liệu heroes trong dữ liệu phòng:', roomName);
            return;
        }

        let characterId = data.characterId;
        let characterData = logicHandler.common.getInGameCharacterData(characterId, roomData, roomName);

        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật với ID:', characterId);
            return;
        }

        characterData.status = "DEAD";
        characterData.hp = 0;

        let hero = heroes.find(hero => hero.heroId === characterId);
        if (hero) {
            hero.status = "DEAD";
            hero.hp = 0;
            roomData[roomName].gameState.heroes = heroes;

            let heroPosition = {
                x: characterData.x,
                y: characterData.y,
            };
            logicHandler.game.updateWalkableGridMap(roomData, roomName, heroPosition.x, heroPosition.y, true);
            logicHandler.common.writeRoomData(roomData);
        } else {
            console.error('Không tìm thấy hero với ID:', characterId);
        }

        let bosses = roomData[roomName].gameState.bosses;
        let boss = bosses.find(boss => boss.bossId === characterId);

        if (boss) {
            boss.status = "DEAD";
            boss.hp = 0;

            let bossPosition = {
                x: characterData.x,
                y: characterData.y,
            };
            logicHandler.game.updateWalkableGridMap(roomData, roomName, bossPosition.x, bossPosition.y, true);
            roomData[roomName].gameState.bosses = bosses;
            logicHandler.common.writeRoomData(roomData);
        } else {
            console.error('Không tìm thấy boss với ID:', characterId);
        }

        // console.log('Xử lý cái chết của nhân vật:', characterId, 'Trạng thái:', characterData.status);

        io.to(roomName).emit('LISTEN_CHARACTER_DEATH', {
            characterId: characterId,
        });
    })

    socket.on('CHECK_WIN', () => {
        console.log('Kiểm tra điều kiện thắng thua cho socket ID:', socket.id);
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;
        let bosses = roomData[roomName].gameState.bosses;

        if (!heroes || !bosses) {
            console.error('Không tìm thấy dữ liệu heroes hoặc bosses trong dữ liệu phòng:', roomName);
            return;
        }

        let allHeroesDead = heroes.every(hero => hero.status === "DEAD");
        let allBossesDead = bosses.every(boss => boss.status === "DEAD");

        if (allHeroesDead) {
            roomData[roomName].gameState.isGameOver = true;
            roomData[roomName].gameState.result = 'LOSE';
            logicHandler.common.writeRoomData(roomData);

            io.to(roomName).emit('GAME_OVER', {
                message: 'Tất cả người chơi đã chết. Trò chơi kết thúc.',
                isGameOver: true,
                result: 'LOSE',
            });
        } else if (allBossesDead) {
            roomData[roomName].gameState.isGameOver = true;
            roomData[roomName].gameState.result = 'WIN';
            logicHandler.common.writeRoomData(roomData);

            io.to(roomName).emit('GAME_OVER', {
                message: 'Tất cả boss đã chết. Người chơi thắng!',
                result: 'WIN',
                isGameOver: true,
            });
        } else {
            io.to(roomName).emit('CHECK_WIN', {
                message: 'Trò chơi vẫn đang diễn ra.',
                isGameOver: false,
            });
        }
    })

    socket.on('SET_POSITION', (data) => {
        let roomName = logicHandler.common.getRoomNameBySocketId(socket.id);
        if (!roomName) {
            console.error('Không tìm thấy phòng cho socket ID:', socket.id);
            return;
        }

        let roomData = logicHandler.common.readRoomData();
        let heroes = roomData[roomName].gameState.heroes;   
        let bosses = roomData[roomName].gameState.bosses;
        if (!heroes || !bosses) {
            console.error('Không tìm thấy dữ liệu heroes hoặc bosses trong dữ liệu phòng:', roomName);
            return;
        }
        let characterId = data.characterId;
        let x = data.x;
        let y = data.y;
        let characterData = logicHandler.common.getInGameCharacterData(characterId, roomData, roomName);
        if (!characterData) {
            console.error('Không tìm thấy dữ liệu nhân vật với ID:', characterId);
            return;
        }
        characterData.x = x;
        characterData.y = y;

        if (logicHandler.common.isHero(characterId)) {
            let hero = heroes.find(hero => hero.heroId === characterId);
            if (hero) {
                hero.x = x;
                hero.y = y;
                console.log('Cập nhật vị trí hero:', hero.heroId, 'Vị trí mới:', x, y);
                roomData[roomName].gameState.heroes = heroes;
            } else {
                console.error('Không tìm thấy hero với ID:', characterId);
            }
        } else {
            let boss = bosses.find(boss => boss.bossId === characterId);
            if (boss) {
                boss.x = x;
                boss.y = y;
                console.log('Cập nhật vị trí boss:', boss.bossId, 'Vị trí mới:', x, y);
                roomData[roomName].gameState.bosses = bosses;
            } else {
                console.error('Không tìm thấy boss với ID:', characterId);
            }
        }
        logicHandler.common.writeRoomData(roomData);
    })
}

module.exports = gameEvents;