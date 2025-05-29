import GameController from "..//Game/GameController";

cc.Class({
    extends: cc.Component,

    properties: {
        pageView: cc.PageView,
        nextButton: cc.Button,
        skipButton: cc.Button,
        gameMapPageView: cc.PageView,
        introductionPanel: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {

        // const gameController = GameController.getInstance();

        // if (gameController) {
        //     this.gameController = gameController;
        // } else {
        //     this.gameController = new GameController();
        //     cc.game.addPersistRootNode(this.node);
        // }

        if (cc.sys.localStorage.getItem('intro_done') === 'true') {
            this.introductionPanel.active = false;
            this.gameMapPageView.node.active = true;
        }

        this.currentPage = 0;

        this.totalPages = this.pageView.getPages().length;

        this.nextButton.node.on('click', this.onNexPage, this);
        this.skipButton.node.on('click', this.onSkipIntro, this);

        this.updateNextButtonLabel();
    },

    onNexPage() {
        console.log('currentPage', this.currentPage)
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.pageView.scrollToPage(this.currentPage, 0.3);
            // this.gameController.nextPage(this.currentPage, this.pageView );
            this.updateNextButtonLabel();
        } else {
            this.onSkipIntro();
        }

    },

    onSkipIntro() {
        this.introductionPanel.active = false;
        this.gameMapPageView.node.active = true;

        cc.sys.localStorage.setItem('intro_done', true);
    },

    updateNextButtonLabel() {
        const label = this.nextButton.getComponentInChildren(cc.Label);

        // this.gameController.updateButtonLabel(this.currentPage, this.totalPages, label);

        if (this.currentPage === this.totalPages - 1) {
            label.string = "Finish";
        }
        else {
            label.string = "Next";
        }
    },

    start() {

    },


    // update (dt) {},
});
