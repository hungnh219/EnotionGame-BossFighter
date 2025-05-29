cc.Class({
    extends: cc.Component,

    properties: {
        cameraNode: cc.Node,
        backgroundCamera: cc.Node,
        edgeThreshold: 20,
        moveSpeed: 300,
    },

    onLoad() {
        console.log("CameraController loaded");
        this._mousePos = cc.v2(0, 0);

        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    },

    onMouseMove(event) {
        this._mousePos = event.getLocation();
        // console.log("Mouse position:", this._mousePos);
    },

    update(dt) {
        let winSize = cc.winSize;
        let pos = this._mousePos;

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
            // Tính vị trí camera mới dựa trên delta
            let newPos = this.cameraNode.position.add(cc.v3(delta.x, delta.y, 0));
            console.log("New camera position (before clamp): ", newPos);

            // Lấy bounding box thế giới của backgroundCamera
            let bgWorldRect = this.backgroundCamera.getBoundingBoxToWorld();
            console.log("Background world rect: ", bgWorldRect);

            // Lấy component camera
            let camera = this.cameraNode.getComponent(cc.Camera);
            console.log("Camera component: ", camera);

            // Lấy 3 góc viewport camera trong world coordinates
            let bottomLeft = camera.getScreenToWorldPoint(cc.v2(0, 0));
            let bottomRight = camera.getScreenToWorldPoint(cc.v2(cc.winSize.width, 0));
            let topLeft = camera.getScreenToWorldPoint(cc.v2(0, cc.winSize.height));

            // Tính kích thước viewport camera trong world space
            let viewportWidth = bottomRight.x - bottomLeft.x;
            let viewportHeight = topLeft.y - bottomLeft.y;

            console.log("Viewport width in world space: ", viewportWidth);
            console.log("Viewport height in world space: ", viewportHeight);

            // Log giá trị min/max của background bounding box
            console.log("bgWorldRect.xMin =", bgWorldRect.xMin);
            console.log("bgWorldRect.xMax =", bgWorldRect.xMax);
            console.log("bgWorldRect.yMin =", bgWorldRect.yMin);
            console.log("bgWorldRect.yMax =", bgWorldRect.yMax);

            // Tính giới hạn cho camera để viewport không vượt ra ngoài vùng background
            let minX = bgWorldRect.xMin + viewportWidth / 2;
            let maxX = bgWorldRect.xMax - viewportWidth / 2;

            let minY = bgWorldRect.yMin + viewportHeight / 2;
            let maxY = bgWorldRect.yMax - viewportHeight / 2;

            console.log("Camera position limits: ", minX, maxX, minY, maxY);

            // Tính bán kính lớn nhất cho mỗi trục
            let radiusX = Math.min(Math.abs(minX), Math.abs(maxX));
            let radiusY = Math.min(Math.abs(minY), Math.abs(maxY));

            // Set giới hạn đối xứng quanh 0
            minX = -radiusX / 2.5;
            maxX = radiusX / 2.5;

            minY = -radiusY;
            maxY = radiusY;

            console.log("Symmetric camera position limits:", minX, maxX, minY, maxY);


            // Giới hạn newPos sao cho camera không ra ngoài vùng cho phép
            newPos.x = Math.min(maxX, Math.max(minX, newPos.x));
            newPos.y = Math.min(maxY, Math.max(minY, newPos.y));

            console.log("Clamped camera position: ", newPos);

            // Cập nhật vị trí camera
            this.cameraNode.position = newPos;
        }
    }
});
