import { Animation, Component, Label, _decorator } from "cc";
import {Core} from "db://assets/Script/core/Core";

const { ccclass, property } = _decorator;

/** 滚动消息提示组件  */
@ccclass('Notify')
export class Notify extends Component {
    @property(Label)
    private lab_content: Label = null!;

    @property(Animation)
    private animation: Animation = null!;

    onLoad() {
        Core.log.logView("notify onLoad", "");
        if (this.animation)
            this.animation.on(Animation.EventType.FINISHED, this.onFinished, this);
    }

    private onFinished() {
        this.node.removeFromParent();
    }

    toast(msg: string) {
        this.lab_content.string = msg;
        this.animation.play();
    }
}