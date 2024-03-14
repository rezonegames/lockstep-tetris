import {Color, Prefab, Node, director, UITransform, view} from 'cc';
import {Notify} from "db://assets/Script/core/ui/Notify";
import {UIConf, uiManager} from "db://assets/Script/core/ui/UIManager";
import {DEBUG} from 'cc/env';
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

export enum UIID {
    UILogin,
    UILogin_Guest,
    UIRegister,
    UIHall,
    UIRoom,
    UITable,
    UINotice,
    UIWaiting,
    UIControl,
    UISettlement
}

export let UICF: { [key: number]: UIConf } = {
    [UIID.UILogin]: {prefab: "Prefab/Login"},
    [UIID.UILogin_Guest]: {prefab: "Prefab/Login_Guest", preventTouch: true},
    [UIID.UIHall]: {prefab: "Prefab/Hall"},
    [UIID.UIRoom]: {prefab: "Prefab/Room"},
    [UIID.UITable]: {prefab: "Prefab/Table"},
    [UIID.UIRegister]: {prefab: "Prefab/Register"},
    [UIID.UIWaiting]: {prefab: "Prefab/Waiting"},
    [UIID.UIControl]: {prefab: "Prefab/Control", preventTouch: true},
    [UIID.UISettlement]: {prefab: "Prefab/Settlement"},
}

export class Game {

    // 提示窗
    static toastNode: Node;

    // 等待窗
    static loadingNode: Node;

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

        let scene = director.getScene();
        let canvas = scene.getChildByName('Canvas');

        // 初始化资源加载
        let toastPrefab = Game.res.get("Prefab/Toast", Prefab, "resources");
        Game.toastNode = Game.resUtil.instantiate(toastPrefab);

        // waiting
        let loadingPrefab = Game.res.get("Prefab/Loading", Prefab, "resources");
        let node = Game.resUtil.instantiate(loadingPrefab);
        node.name = "loading";
        let uiCom = node.getComponent(UITransform);
        uiCom.setContentSize(view.getVisibleSize());
        uiCom.priority = 100 - 0.01;
        node.on(Node.EventType.TOUCH_START, function (event: any) {
            event.propagationStopped = true;
        }, node);
        Game.loadingNode = node;

        // 背景
        let backgroundPrefab = Game.res.get("Prefab/background", Prefab, "resources");
        canvas.addChild(Game.resUtil.instantiate(backgroundPrefab));

        // 初始化界面
        uiManager.initUIConf(UICF);
        uiManager.open(UIID.UILogin);
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
        node.active = true;
    }

    static closeLoading() {
        Game.loadingNode.active = false;
    }
}