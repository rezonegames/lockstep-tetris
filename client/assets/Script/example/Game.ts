import {Color, Prefab, Node, director, UITransform, view} from 'cc';
import {Notify} from "db://assets/Script/core/ui/Notify";
import {Tetris} from "db://assets/Script/example/Tetris";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {DEBUG, JSB} from 'cc/env';
import {Logger} from "db://assets/Script/core/common/Logger";
import {HttpRequest} from "db://assets/Script/core/network/HttpRequest";
import {RandomManager} from "db://assets/Script/core/common/RandomManager";
import {StorageManager} from "db://assets/Script/core/common/StorageManager";
import {NetManager} from "db://assets/Script/core/network/NetManager";
import {EventMgr} from "db://assets/Script/core/common/EventManager";
import {resLoader} from "db://assets/Script/core/res/ResLoader";
import {ResUtil} from "db://assets/Script/core/res/ResUtil";
import {NetChannelManager} from "db://assets/Script/example/Channel";

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
    static toastNode: Node;

    // 等待窗
    static loadingNode: Node;

    // 资源加载窗
    static loadingWithProgressNode: Node;

    // core
    static log = Logger;
    static http: HttpRequest;
    static random = RandomManager.instance;
    static storage: StorageManager;
    static tcp: NetManager;
    static event = EventMgr;
    static res = resLoader;
    static resUtil = ResUtil;
    static channel: NetChannelManager

    static initGame() {
        // storage
        Game.storage = new StorageManager();

        // http连接地址
        Game.http = new HttpRequest();
        let url = "http://192.168.8.27:8000";
        if (!DEBUG) {
            url = "http://110.40.133.37:8000";
        }
        Game.http.server = url;

        // tcp 管理器
        Game.tcp = new NetManager();

        // tcp的上一层
        Game.channel = new NetChannelManager();
        Game.channel.gameCreate();

        // 初始化资源加载
        // loading:0000003C,loading
        Game.res.load(["Prefab/Toast", "Prefab/Loading"], Prefab, (err, prefabList: Prefab[]) => {
            if (err) {
                Game.log.logView("game constructor load prefab err!!!");
                return;
            }

            // toast
            Game.toastNode = Game.resUtil.instantiate(prefabList[0]);

            // waiting
            let node = Game.resUtil.instantiate(prefabList[1]);
            node.name = "loading";
            node.on(Node.EventType.TOUCH_START, function (event: any) {
                event.propagationStopped = true;
            }, node);
            Game.loadingNode = node;
        });
    }

    static toast(content: string) {
        let parent = uiManager.getTopUI().node;
        let node = Game.toastNode;
        let toastCom = node.getComponent(Notify)!;
        parent.addChild(node);
        toastCom.toast(content);
    }

    static openLoading() {
        let node = Game.loadingNode;

        let scene = director.getScene();
        if (!!scene) {
            let child = scene.getChildByName('Canvas');
            if (child.getChildByName("loading") == null) {
                child!.addChild(node);
                let uiCom = node.getComponent(UITransform);
                uiCom.setContentSize(view.getVisibleSize());
                uiCom.priority = 100 - 0.01;
            }
        }
        node.active = true;
    }

    static closeLoading() {
        Game.loadingNode.active = false;
    }
}