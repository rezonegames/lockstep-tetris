import {IPackage, Package} from "db://assets/bundle1/example/nano/package";
import Protocol from "db://assets/bundle1/example/nano/protocol";
import {
    CallbackObject,
    INetworkTips,
    IProtocolHelper,
    NetCallFunc,
    NetData
} from "db://assets/core/network/NetInterface";
import {NetNode} from "db://assets/core/network/NetNode";
import {
    OnGameState,
    LoginToGame,
    LoginToGameResp,
    OnFrameList,
    ResumeTable, ResumeTableResp,
} from "db://assets/bundle1/example/proto/client";
import {ErrorCode} from "db://assets/bundle1/example/proto/error";
import {Message} from "db://assets/bundle1/example/nano/message";
import {WebSock} from "db://assets/core/network/WebSock";
import {director, Label, Node, view} from "cc";
import {GameState, TableState} from "db://assets/bundle1/example/proto/consts";
import {uiManager} from "db://assets/core/ui/UIManager";
import {EventMgr} from "db://assets/core/common/EventManager";
import UIControl from "db://assets/bundle1/example/uiviews/UIControl";
import {Game, UIID} from "db://assets/bundle1/example/Game";

enum NetChannelType {
    Gate = 0,
    Game,
}

class NetTips implements INetworkTips {

    showTip(isShow: boolean) {

    }

    connectTips(isShow: boolean): void {
        this.showTip(isShow);
    }

    reconnectTips(isShow: boolean): void {
        this.showTip(isShow);
    }

    requestTips(isShow: boolean): void {
        // this.showTip(isShow);
    }
}

const route2cmd = (route: string): number => {
    let v: any = {
        "onState": 100,
        "onFrame": 101,
        "onItemChange": 102,
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
            Game.log.logNet(msg, "handshake");
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
        Game.log.logNet(this.isReconnecting, "handshake结束");
        // 第一次连接
        let uid = Game.storage.getUser();
        Game.log.logView(uid, "账号");

        // 如果没有账户，就打开注册窗口
        if (uid == 0) {
            uiManager.replace(UIID.UIRegister);
            return;
        }

        let buf = LoginToGame.encode({userId: uid}).finish();
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LoginToGameResp.decode(data.body);
                Game.log.logNet(resp, "登录游戏账号");
                if (resp.code == ErrorCode.OK) {
                    // 重连，不去切换ui
                    if (this.isReconnecting) {
                        this.isReconnecting = false;
                    }
                    Game.event.raiseEvent("onUserInfo", resp.profile);

                    if (resp.tableId != "") {
                        // 如果tableId不为空，resumeTable，进入游戏
                        this.resumeTable();
                        return;
                    }
                    uiManager.replace(UIID.UIHall);
                } else {
                    Game.log.logNet(resp, "登录失败");
                }
            }
        }
        this.request1("g.login", buf, rspObject);
    }

    resumeTable() {
        let control = uiManager.getUI(UIID.UIControl) as UIControl;
        let frameId = control ? control.curFrame : 0;
        let buf = ResumeTable.encode({frameId: frameId}).finish();
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = ResumeTableResp.decode(data.body);

                switch (resp.code) {
                    case ErrorCode.TableDismissError:
                        // 如果桌子已经解散了，退回到大厅
                        uiManager.replace(UIID.UIHall);
                        break;
                    case ErrorCode.OK:
                        // 恢复成功，重进游戏
                        let state = resp.state;
                        if (!control) {
                            Game.openLoading();
                            uiManager.replace(UIID.UIControl, state.tableInfo);
                        } else {
                            control.notifyResProgress();
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
                msg.body = new Uint8Array(msg.body);
                super.onMessage(msg);
                break;
            case Package.TYPE_HEARTBEAT:
                let msg1 = Message.decode(p.body);
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
        Game.log.logNet(event, "连接关闭");
        this.rejectReconnect();
        super.onClosed(event);
        Game.event.raiseEvent("onUserInfo", {});
        uiManager.replace(UIID.UILogin);
    }

    public request1(route: string, buf: NetData, rspObject: CallbackObject, showTips: boolean = true, force: boolean = false) {
        let msgId = this.lastMsgId++;
        this.request(Package.encode(Package.TYPE_DATA, this.encode(msgId, route, buf)), msgId, rspObject, showTips, force);
    }
}

export class NetChannelManager {

    // 游戏服
    public game!: NetNodeGame;

    constructor() {
    }

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
        Game.tcp.setNetNode(this.game, NetChannelType.Game);

        // 根据游戏状态切换界面
        this.gameAddListener("onState", (cmd, data: any) => {
            let resp = OnGameState.decode(data.body);
            Game.log.logNet(resp, "onState");
            switch (resp.state) {
                case GameState.INGAME:
                    let tableInfo = resp.tableInfo;
                    switch (tableInfo.tableState) {
                        case TableState.CHECK_RES:
                            if (!uiManager.isTopUI(UIID.UIControl)) {
                                Game.openLoading();
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
            Game.event.raiseEvent("onState", resp);
        }, this);

        // 游戏内状态同步
        this.gameAddListener("onFrame", (cmd, data: any) => {
            let resp = OnFrameList.decode(data.body);
            EventMgr.raiseEvent("onFrame", resp);
        }, this);
    }

    // 连接游戏服务器
    public gameConnect(url: string) {
        Game.tcp.connect({
            url: `ws://${url}/nano`,
            autoReconnect: -1        // 自动连接
        }, NetChannelType.Game);
    }

    // 断开游戏服务器
    public gameClose() {
        Game.tcp.close(undefined, undefined, NetChannelType.Game);
    }
}