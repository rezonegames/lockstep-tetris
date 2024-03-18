import {Component, _decorator, ProgressBar, director, assetManager, Label} from "cc";
import {resLoader} from "db://assets/core/res/ResLoader";


const {property, ccclass} = _decorator;

@ccclass
export default class UIExample extends Component {

    @property(ProgressBar)
    loadingProgressBar: ProgressBar;

    @property(Label)
    tipLabel: Label;

    onLoad() {
    }

    start() {
        let [total, taskList, bundleName] = [
            5,
            ["Prefab", "scene", "example", "Texture", "anim"],
            "bundle1"
        ];

        const onProgress = (finished: number, total: number, item: any) => {
            // this.loadingProgressBar.progress += finished/(total*5);
        }

        const onFinish = () => {
            let dir = taskList.pop();
            console.log(`${dir} finished!!`);
            this.loadingProgressBar.progress = (total - taskList.length) / total;
            if (!dir) {
                let bundle = assetManager.getBundle(bundleName);
                bundle.loadScene("scene/main", function (err, scene) {
                    director.runScene(scene);
                });
            } else {
                this.tipLabel.string = dir;
                resLoader.loadDir(bundleName, dir, onProgress.bind(this), onFinish.bind(this));
            }
        }
        this.tipLabel.string = taskList[0];
        resLoader.loadDir("bundle1", taskList[0], onProgress.bind(this), onFinish.bind(this));
    }
}
