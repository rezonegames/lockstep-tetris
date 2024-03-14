import {Component, _decorator, ProgressBar} from "cc";
import {resLoader} from "db://assets/Script/core/res/ResLoader";
import {Game} from "db://assets/Script/example/Game";


const {property, ccclass} = _decorator;

@ccclass
export default class UIExample extends Component {

    @property(ProgressBar)
    loadingProgressBar: ProgressBar;

    onLoad() {
    }

    start() {
        resLoader.loadDir("resources", "Prefab",
            (finished: number, total: number, item: any) => {
                let progress = finished / total;
                if (progress > this.loadingProgressBar.progress) {
                    this.loadingProgressBar.progress = progress;
                }
            },
            () => {
                this.loadingProgressBar.node.active = false;
                Game.initGame();
                console.log("finished");
            }
        )
    }

}
