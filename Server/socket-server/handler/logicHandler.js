const SelectHeroHandler = require('./selectHeroHandler');
const GameHandler = require('./gameHandler');
const CommonHandler = require('./commonHandler');
const TurnHandler = require('./turnHandler');

// const 
const logicHandler = {
    selectHero: SelectHeroHandler,
    game: GameHandler,
    common: CommonHandler,
    turn: TurnHandler
}

module.exports = logicHandler;
