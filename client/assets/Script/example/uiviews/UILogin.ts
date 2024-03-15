import {_decorator, Label, Node, tween, Vec3, Sprite, EditBox} from "cc";
import {AccountLoginReq, AccountLoginResp} from "db://assets/Script/example/proto/web";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {AccountType} from "db://assets/Script/example/proto/consts";
import {UIView} from "db://assets/Script/core/ui/UIView";

import {Game, UIID} from "db://assets/Script/example/Game";
import {uiManager} from "db://assets/Script/core/ui/UIManager";

const {ccclass, property} = _decorator;

@ccclass
export default class UILogin extends UIView {

    @property(Label)
    private uri: Label

    @property(Node)
    private connect: Node

    private resp: AccountLoginResp

    onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);
        this.clearConnect();
    }

    clearConnect() {
        this.connect.active = false;
        Game.channel.gameClose();
    }

    setConnect(resp: AccountLoginResp) {
        this.resp = resp;
        let name = resp.name;
        if (resp.userId == 0) {
            name = "无账号，登录游戏后注册";
        } else {
            // 账号基本信息保存在本地
            Game.storage.setUser(resp.userId);
        }
        this.uri.string = name;
        this.connect.active = true
    }

    login(accountType: number, accountId: string) {
        this.clearConnect();
        Game.http.postProtoBufParam("/v1/login", AccountLoginReq.encode({
                partition: accountType,
                accountId: accountId
            }).finish(), (response: any) => {
                let resp = AccountLoginResp.decode(response);
                Game.log.logNet(resp, "登录");
                if (resp.code == ErrorCode.OK) {
                    Game.storage.set("accountId", accountId);
                    this.setConnect(resp);
                }
            }
        );
    }

    onGuestLogin() {
        uiManager.open(UIID.UILogin_Guest, this);
    }

    onWeiXinLogin() {
        Game.toast("敬请期待");
        // this.login(AccountType.WX, "wxId");
    }

    onFacebookLogin() {
        Game.toast("敬请期待");
        // this.login(AccountType.FB, "fbId");
    }

    onConnect() {
        Game.channel.gameClose();
        Game.channel.gameConnect(this.resp.addr);
    }
}
