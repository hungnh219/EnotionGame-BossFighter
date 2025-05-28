

cc.Class({
    extends: cc.Component,

    properties: {
        cameraNode: cc.Node,
        edgeThreshold: 20,    
        moveSpeed: 200,       
    },

    onLoad() {
        console.log("CameraController loaded");
        this._mousePos = cc.v2(0, 0);

        // Bắt sự kiện di chuyển chuột để cập nhật vị trí
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);


        this.node.zIndex = 9999;


    },

    onMouseMove(event) {
        // Lấy vị trí chuột trong hệ tọa độ canvas hoặc node
        this._mousePos = event.getLocation();
        // console.log("Mouse position:", this._mousePos);
    },

    update(dt) {
        
        let winSize = cc.winSize;
        let pos = this._mousePos;

        // Nếu vị trí chuột chưa được cập nhật (0,0) hoặc ngoài màn hình thì không di chuyển
        if (pos.x <= 0 || pos.y <= 0 || pos.x >= winSize.width || pos.y >= winSize.height) {
            return;
        }

        let delta = cc.v2(0, 0);

        if (pos.x < this.edgeThreshold) {
            delta.x = -this.moveSpeed * dt;
        } else if (pos.x > winSize.width - this.edgeThreshold) {
            delta.x = this.moveSpeed * dt;
        }

        if (pos.y < this.edgeThreshold) {
            delta.y = -this.moveSpeed * dt;
        } else if (pos.y > winSize.height - this.edgeThreshold) {
            delta.y = this.moveSpeed * dt;
        }

        if (delta.x !== 0 || delta.y !== 0) {
            this.cameraNode.position = this.cameraNode.position.add(cc.v3(delta.x, delta.y, 0));

        
        }
    }

});
