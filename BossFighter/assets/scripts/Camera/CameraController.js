cc.Class({
    extends: cc.Component,

    properties: {
        uiGameNode: cc.Node,
        backgroundNode: cc.Node,
        edgeThreshold: 20,
        moveSpeed: 300,
    },

    onLoad() {
        this._mousePos = cc.v2(0, 0);
        this._isDragging = false;
        this._lastMousePos = null;

        this.uiGameNode.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.uiGameNode.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMoveDrag, this);
        this.uiGameNode.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.uiGameNode.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseUp, this);

        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMoveEdgeScroll, this);
    },

    onMouseDown(event) {
        this._isDragging = true;
        this._lastMousePos = event.getLocation();
    },

    onMouseMoveDrag(event) {
        if (!this._isDragging) return;

        let currentPos = event.getLocation();
        let delta = currentPos.sub(this._lastMousePos);

        let newPos = this.uiGameNode.position.add(cc.v3(delta.x, delta.y, 0));
        // newPos = this._clampPositionToBackground(newPos);

        this.uiGameNode.position = newPos;
        this._lastMousePos = currentPos;
    },

    onMouseUp(event) {
        this._isDragging = false;
        this._lastMousePos = null;
    },

    onMouseMoveEdgeScroll(event) {
        if (this._isDragging) return; 

        this._mousePos = event.getLocation();
    },

    update(dt) {
        if (this._isDragging) return; // Đang kéo thì không tự di chuyển

        if (!this._mousePos) return;

        let winSize = cc.winSize;
        let pos = this._mousePos;
        let delta = cc.v2(0, 0);

        if (pos.x < this.edgeThreshold) {
            delta.x = this.moveSpeed * dt;
        } else if (pos.x > winSize.width - this.edgeThreshold) {
            delta.x = -this.moveSpeed * dt;
        }

        if (pos.y < this.edgeThreshold) {
            delta.y = this.moveSpeed * dt;
        } else if (pos.y > winSize.height - this.edgeThreshold) {
            delta.y = -this.moveSpeed * dt;
        }

        if (delta.x !== 0 || delta.y !== 0) {
            let newPos = this.uiGameNode.position.add(cc.v3(delta.x, delta.y, 0));
            // newPos = this._clampPositionToBackground(newPos);
            this.uiGameNode.position = newPos;
        }
    },

    _clampPositionToBackground(pos) {
        let bgWorldRect = this.backgroundNode.getBoundingBoxToWorld();
        let uiSize = this.uiGameNode.getContentSize();

        // Chuyển bounding box background về hệ tọa độ parent của uiGameNode
        let bgRectInParent = this.backgroundNode.parent.convertToNodeSpaceAR(bgWorldRect);

        let minX = bgRectInParent.x - (uiSize.width * this.uiGameNode.anchorX);
        let maxX = bgRectInParent.x + bgWorldRect.width - (uiSize.width * this.uiGameNode.anchorX);

        let minY = bgRectInParent.y - (uiSize.height * this.uiGameNode.anchorY);
        let maxY = bgRectInParent.y + bgWorldRect.height - (uiSize.height * this.uiGameNode.anchorY);

        pos.x = Math.min(maxX, Math.max(minX, pos.x));
        pos.y = Math.min(maxY, Math.max(minY, pos.y));

        return pos;
    }
});
