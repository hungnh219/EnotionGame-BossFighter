cc.Class({
    extends: cc.Component,
  
    properties: {
      label: cc.Label,
      background: cc.Sprite,
    },
  
    showMessage(type, message) {
      this.label.string = message;
  
      switch (type) {
        case 'success':
          this.background.node.color = cc.Color.GREEN;
          break;
        case 'error':
          this.background.node.color = cc.Color.RED;
          break;
        case 'warning':
          this.background.node.color = cc.Color.ORANGE;
          break;
        case 'info':
          this.background.node.color = cc.Color.BLUE;
          break;
        default:
          this.background.node.color = cc.Color.GRAY;
      }
  
      this.scheduleOnce(() => {
        this.node.destroy(); 
      }, 2);
    }
  });
  