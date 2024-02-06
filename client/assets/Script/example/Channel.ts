import {IPackage, Package} from "db://assets/Script/example/nano/package";
import Protocol from "db://assets/Script/example/nano/protocol";
import {
    CallbackObject,
    INetworkTips,
    IProtocolHelper,
    NetCallFunc,
    NetData
} from "db://assets/Script/core/network/NetInterface";
import {NetNode} from "db://assets/Script/core/network/NetNode";
import {oo} from "db://assets/Script/core/oo";
import {
    GameStateResp,
    LoadRes,
    LoginToGame,
    LoginToGameResp,
    OnFrameList, ResumeRoom,
    ResumeTable
} from "db://assets/Script/example/proto/client";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {Message} from "db://assets/Script/example/nano/message";
import {WebSock} from "db://assets/Script/core/network/WebSock";
import {director, Label, Node, view} from "cc";
import {GameState, TableState} from "db://assets/Script/example/proto/consts";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {UIID} from "db://assets/Script/example/UIExample";
import {EventMgr} from "db://assets/Script/core/common/EventManager";
import UIControl from "db://assets/Script/example/uiviews/UIControl";

enum NetChannelType {
    /** 游戏服务器 */
    Game = 0,
}

class NetTips implements INetworkTips {

    private getLabel(): Label {
        let label = null;
        let winSize = view.getCanvasSize();
        let scene = director.getScene();
        if (scene) {
            let node = scene.getChildByPath("Canvas/@net_tip_label");
            if (node) {
                label = node.getComponent(Label);
            } else {
                let node = new Node("@net_tip_label");
                label = node.addComponent(Label);
                node.setPosition(winSize.width / 2, winSize.height / 2);
            }
        }
        return label!;
    }

    connectTips(isShow: boolean): void {
        if (isShow) {
            this.getLabel().string = "Connecting";
            this.getLabel().node.active = true;
        } else {
            this.getLabel().node.active = false;
        }
    }

    reconnectTips(isShow: boolean): void {
        if (isShow) {
            this.getLabel().string = "Reconnecting";
            this.getLabel().node.active = true;
        } else {
            this.getLabel().node.active = false;
        }
    }

    requestTips(isShow: boolean): void {
        if (isShow) {
            this.getLabel().string = "Requesting";
            this.getLabel().node.active = true;
        } else {
            this.getLabel().node.active = false;
        }
    }
}

const route2cmd = (route: string): number => {
    let v: any = {
        "onState": 100,
        "onFrame": 101,
    }
    return v[route];
};


class GameProtocol implements IProtocolHelper {

    getHeadlen(): number {
        return 0;
    }

    getHearbeat(): NetData {
        var buf = Package.encode(Package.TYPE_HEARTBEAT, null);
        return buf;
    }

    getPackageLen(msg: any): number {
        return msg.toString().length;
    }

    checkPackage(msg: any): boolean {
        return true;
    }

    getPackageId(msg: any): number {
        if (msg.id == 0) {
            return route2cmd(msg.route);
        }
        return msg.id;
    }
}

class NetNodeGame extends NetNode {
    private isCompress: boolean = false;
    private lastMsgId: number = 10000;
    private dict: any = {};
    private isReconnecting: boolean = false;

    constructor() {
        super();

        // 连接之后，需要发handshake
        this._connectedCallback = () => {
            let msg = {
                'sys': {
                    type: 'js-websocket',
                    version: '0.0.1',
                    rsa: {}
                },
                'user': {}
            }
            var buf = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(msg)));
            this.send(buf, true);
            oo.log.logNet(msg, "handshake");
        }
        this._reconnetTimeOut = 8000;

        // 连接关闭回调
        this._disconnectCallback = (): boolean => {
            if (this.isAutoReconnect()) {
                this.isReconnecting = true;
                return true;
            }
            return false;
        }
    }

    onHandAck() {
        // websocket 连接成功了
        this.onChecked();
        oo.log.logNet(this.isReconnecting, "handshake结束");
        // 第一次连接
        let uid = oo.storage.getUser();
        oo.log.logView(uid, "账号");

        // 如果没有账户，就打开注册窗口
        if (uid == 0) {
            uiManager.replace(UIID.UIRegister);
            return;
        }

        let buf = LoginToGame.encode({userId: uid}).finish();
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LoginToGameResp.decode(new Uint8Array(data.body));
                oo.log.logNet(resp, "登录游戏账号");
                if (resp.code == ErrorCode.OK) {
                    // 重连，不去切换ui
                    if (this.isReconnecting) {
                        this.isReconnecting = false;
                    }
                    oo.event.raiseEvent("onUserInfo", resp.profile);
                    // 如果tableId不为空，resumeTable，进入游戏
                    if (resp.tableId != "") {
                        this.resumeTable();
                        return;
                    }
                    if(resp.roomId != "") {
                        this.resumeRoom();
                        return;
                    }
                    //
                    uiManager.replace(UIID.UIHall, resp.roomList);
                } else {
                    oo.log.logNet(resp, "登录失败");
                }
            }
        }
        this.request1("g.login", buf, rspObject);
    }

    resumeRoom() {
        let buf = ResumeRoom.encode({}).finish();
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = GameStateResp.decode(new Uint8Array(data.body));
                switch (resp.code) {
                    case ErrorCode.OK:
                        uiManager.replace(UIID.UIHall, resp.roomList);
                        break;
                    default:
                        break;
                }
            }
        }
        this.request1("r.resumeroom", buf, rspObject);
    }

    resumeTable() {
        let frameId = 0;
        let control = uiManager.getUI(UIID.UIControl) as UIControl;
        if(control) {
            frameId = control.curFrame;
        }

        let buf = ResumeTable.encode({frameId:frameId}).finish();
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = GameStateResp.decode(new Uint8Array(data.body));

                switch (resp.code) {
                    case ErrorCode.TableDismissError:
                        uiManager.replace(UIID.UIHall, resp.roomList);
                        break;
                    case ErrorCode.OK:
                        if(!control) {
                            uiManager.replace(UIID.UIControl, resp.tableInfo);
                        } else {
                            // 网络不稳定，直接res ok
                            let buf = LoadRes.encode({current: 100}).finish();
                            channel.gameNotify("r.loadres", buf);
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        this.request1("r.resumetable", buf, rspObject);
    }

    encode(reqId: number, route: string, data: any): Uint8Array {
        let type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;
        let compressRoute = 0;
        if (this.dict && this.dict[route]) {
            route = this.dict[route];
            compressRoute = 1;
        }
        return Message.encode(reqId, type, compressRoute, route, data);
    }

    private processPacket(p: IPackage) {
        switch (p.type) {
            case Package.TYPE_HANDSHAKE:
                let buf = Package.encode(Package.TYPE_HANDSHAKE_ACK, null);
                this.send(buf, true);
                this.onHandAck();
                break;
            case Package.TYPE_DATA:
                let msg = Message.decode(p.body);
                // oo.log.logNet(msg, "TYPE_DATA");
                super.onMessage(msg);
                break;
            case Package.TYPE_HEARTBEAT:
                let msg1 = Message.decode(p.body);
                // oo.log.logNet("", "心跳");
                super.onMessage(msg1);
                this.send(this._protocolHelper!.getHearbeat());
                break;
        }
    }

    protected onMessage(data: any) {
        let rs = Package.decode(data);
        for (let i = 0; i < rs.length; i++) {
            this.processPacket(rs[i])
        }
    }

    protected onClosed(event: any) {
        oo.log.logNet(event, "连接关闭");
        this.rejectReconnect();
        super.onClosed(event);
        uiManager.replace(UIID.UILogin);
    }

    public request1(route: string, buf: NetData, rspObject: CallbackObject, showTips: boolean = true, force: boolean = false) {
        let msgId = this.lastMsgId++;
        this.request(Package.encode(Package.TYPE_DATA, this.encode(msgId, route, buf)), msgId, rspObject, showTips, force);
    }
}

export class NetChannelManager {
    public game!: NetNodeGame;

    public gameReqest(route: string, buf: NetData, rspObject: CallbackObject, showTips: boolean = true, force: boolean = false) {
        this.game.request1(route, buf, rspObject, showTips, force);
    }

    public gameNotify(route: string, buf: NetData) {
        this.game.request1(route, buf, null, false, false)
    }

    private gameAddListener(route: string, callback: NetCallFunc, target?: any) {
        let cmd = route2cmd(route);
        this.game.setResponeHandler(cmd, callback, target);
    }

    // 创建游戏服务器
    public gameCreate() {
        this.game = new NetNodeGame();
        // 游戏网络事件逻辑统一在 NetGameTips 里写
        this.game.init(new WebSock(), new GameProtocol(), new NetTips());
        oo.tcp.setNetNode(this.game, NetChannelType.Game);

        //  根据游戏状态切换界面
        this.gameAddListener("onState", (cmd, data: any) => {
            let resp = GameStateResp.decode(new Uint8Array(data.body));
            oo.log.logNet(resp, "onState");
            switch (resp.state) {
                case GameState.INGAME:
                    let tableInfo = resp.tableInfo;
                    switch (tableInfo.tableState) {
                        case TableState.CHECK_RES:
                            if (!uiManager.isTopUI(UIID.UIControl)) {
                                uiManager.replace(UIID.UIControl, tableInfo);
                            }
                            break
                        case TableState.GAMING:

                            break;
                        case TableState.SETTLEMENT:
                            uiManager.open(UIID.UISettlement, resp);
                            break;
                    }
                    break

                case GameState.WAIT:
                    break;
            }
            oo.event.raiseEvent("onState", resp);
        }, this);

        // 游戏内状态同步
        this.gameAddListener("onFrame", (cmd, data: any) => {
            let resp = OnFrameList.decode(new Uint8Array(data.body));
            EventMgr.raiseEvent("onFrame", resp);
        }, this);
    }

    // 连接游戏服务器
    public gameConnect(url: string) {
        oo.tcp.connect({
            url: `ws://${url}/nano`,
            autoReconnect: -1        // 自动连接
        }, NetChannelType.Game);
    }

    // 断开游戏服务器
    public gameClose() {
        oo.tcp.close(undefined, undefined, NetChannelType.Game);
    }
}

export var channel = new NetChannelManager();