import {Component, _decorator, ProgressBar} from "cc";
import {resLoader} from "db://assets/Script/core/res/ResLoader";
import {Game} from "db://assets/Script/example/Game";


const {property, ccclass} = _decorator;

@ccclass
export default class UIExample extends Component {

    @property(ProgressBar)
    loadingProgressBar: ProgressBar;

    progress: number
    total: number

    onLoad() {
    }

    start() {
        let [total, taskList] = [3, ["anim", "Texture", "Prefab"]];

        const onProgress = (finished: number, total: number, item: any) => {
        }
        const onFinish = () => {
            let dir = taskList.pop();
            this.loadingProgressBar.progress = total - taskList.length / total;
            if (!dir) {
                Game.initGame();
                console.log("finished");
                this.loadingProgressBar.node.active = false;
            } else {
                resLoader.loadDir("bundle1", dir, onProgress.bind(this), onFinish.bind(this));
            }
        }

        resLoader.loadDir("bundle1", taskList[0], onProgress.bind(this), onFinish.bind(this));
    }

}
