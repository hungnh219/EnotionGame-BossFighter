const EventBus = new cc.EventTarget();

console.log('EventBus initialized');

EventBus.events = {
    CLICK_TO_MOVE: 'click_to_move',
    HERO_MOVEMENT: 'hero_movement',
    DISPLAY_WALKABLE_AREA: 'display_walkable_area',
    CLEAR_WALKABLE_AREA: 'clear_walkable_area',
    ADD_WALKABLE_TILE: 'add_walkable_tile',
    MOVE_TO_WALKABLE_TILE: 'move_to_walkable_tile',

    END_ACTION: 'end_action',

    BOSS2_SPAWN_ENEMY: 'boss2_spawn_enemy',
};



export default EventBus;