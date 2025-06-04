const GameLogic = {
    getAttackTiles(center, range, mapWidth, mapHeight) {
        const attackTiles = [];
        for (let i = -range; i <= range; i++) {
            for (let j = -range; j <= range; j++) {
                const tileX = center.x + i;
                const tileY = center.y + j;
                
                // Check if the tile is within the map boundaries
                if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
                    attackTiles.push({ x: tileX, y: tileY });
                }
            }
        }
        
        return attackTiles;
    }
}