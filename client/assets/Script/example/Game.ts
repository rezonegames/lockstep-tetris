import {Color, Prefab, Node, director, UITransform, view} from 'cc';
import {Core} from "db://assets/Script/core/Core";
import {Notify} from "db://assets/Script/core/ui/Notify";
import {Tetris} from "db://assets/Script/example/Tetris";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import { DEBUG, JSB } from 'cc/env';

let colorMap = {
    0: new Color(200, 100, 100),    // 红色
    1: new Color(100, 200, 100),    // 绿色
    2: new Color(100, 100, 200),    // 蓝色
    3: new Color(200, 200, 100),  // 黄色
    4: new Color(200, 100, 200),  // 紫色
    5: new Color(100, 200, 200)   // 青色
}

export function GetTeamColor(teamId): Color {
    return colorMap[teamId];
}

export class Game {

    // 提示窗
    toastNode: Node

    // 等待窗
    loadingNode: Node

    myTetris: Tetris;

    constructor() {

        // 初始化
        // loading:0000003C,loading
        Core.res.load(["Prefab/Toast", "Prefab/Loading"], Prefab, (err, prefabList: Prefab[]) => {
            if (err) {
                Core.log.logView("game constructor load prefab err!!!");
                return;
            }
            this.toastNode = Core.resUtil.instantiate(prefabList[0]);
            let node = Core.resUtil.instantiate(prefabList[1]);
            let uiCom = node.getComponent(UITransform);
            uiCom.setContentSize(view.getVisibleSize());

            node.on(Node.EventType.TOUCH_START, function (event: any) {
                event.propagationStopped = true;
            }, node);

            let child = director.getScene()!.getChildByName('Canvas');
            child!.addChild(node);
            uiCom.priority = 100 - 0.01;
            this.loadingNode = node;
        })

        // http连接地址
        let url = "http://192.168.8.27:8000";
        if(!DEBUG) {
            url = "http://110.40.133.37:8000";
        }
        Core.http.server = url;
    }

    set GameTetris(tetris: Tetris) {
        this.myTetris = tetris;
    }

    get GameTetris(): Tetris {
        return this.myTetris;
    }

    toast(content: string) {
        let parent = uiManager.getTopUI().node;
        let node = this.toastNode;
        let toastCom = node.getComponent(Notify)!;
        parent.addChild(node);
        toastCom.toast(content);
    }

    openLoading() {
        this.loadingNode.active = true;
    }

    closeLoading() {
        this.loadingNode.active = false;
    }

}

export let game = new Game();