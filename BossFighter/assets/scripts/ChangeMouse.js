// // Component gán cho button hoặc node quản lý cursor
// cc.Class({
//     extends: cc.Component,

//     properties: {
//         handCursorSprite: cc.Node,  // node chứa sprite hình bàn tay
//     },

//     onLoad() {
//         // Ẩn sprite bàn tay lúc đầu
//         this.handCursorSprite.active = false;

//         this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
//         this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
//         this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
//     },

//     onMouseEnter() {
//         // Ẩn con trỏ hệ thống (web hoặc desktop)
//         cc.game.canvas.style.cursor = 'none';  // Nếu web
//         // hoặc cc.systemEvent.setCursor(cc.CURSOR_NONE); (tùy phiên bản)
        
//         this.handCursorSprite.active = true;
//     },

//     onMouseLeave() {
//         // Hiện lại con trỏ mặc định
//         cc.game.canvas.style.cursor = 'default'; // Nếu web
//         this.handCursorSprite.active = false;
//     },

//     onMouseMove(event) {
//         let pos = event.getLocation();
//         // Chuyển vị trí sprite bàn tay theo vị trí chuột
//         this.handCursorSprite.position = this.node.parent.convertToNodeSpaceAR(pos);
//     }
// });
