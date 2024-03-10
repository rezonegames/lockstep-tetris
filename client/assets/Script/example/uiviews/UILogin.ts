import {_decorator, Label, Node, tween, Vec3, Sprite, EditBox} from "cc";
import {AccountLoginReq, AccountLoginResp} from "db://assets/Script/example/proto/web";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {AccountType} from "db://assets/Script/example/proto/consts";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {Core} from "db://assets/Script/core/Core";
import {channel} from "db://assets/Script/example/Channel";
import {game} from "db://assets/Script/example/Game";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {UIID} from "db://assets/Script/example/UIExample";

const {ccclass, property} = _decorator;

@ccclass
export default class UILogin extends UIView {

    @property(Label)
    private uri: Label

    @property(Node)
    private connect: Node

    @property(Sprite)
    private testSprite: Sprite

    private resp: AccountLoginResp

    onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);

        this.clearConnect();
        channel.gameClose();

        tween(this.testSprite.node)
            .to(1, {
                    scale: new Vec3(2, 2, 2),
                    // position: new Vec3(5, 5, 5)
                }
            )
            .call(() => {
                console.log('This is a callback');
            })
            .by(1, {
                    scale: new Vec3(-1, -1, -1),
                    // position: new Vec3(-5, -5, -5)
                },
                {easing: 'sineOutIn'}
            )
            .start()

        Core.http.server = `http://192.168.8.27:8000`;
        Core.http.server = `http://192.168.3.23:8000`;
        // Core.http.server = `http://192.168.3.69:8000`;
        // Core.http.server = `http://127.0.0.1:8000`;

        channel.gameCreate();
    }

    clearConnect() {
        this.connect.active = false;
    }

    setConnect(resp: AccountLoginResp) {
        this.resp = resp;
        let name = resp.name;
        if (resp.userId == 0) {
            name = "无账号，登录游戏后注册";
        }
        this.uri.string = name;
        this.connect.active = true
    }

    login(accountType: number, accountId: string) {
        this.clearConnect();
        Core.http.postProtoBufParam("/v1/login", AccountLoginReq.encode({
                partition: accountType,
                accountId: accountId
            }).finish(), (response: any) => {
                let resp = AccountLoginResp.decode(response);
                Core.log.logNet(resp, "登录");
                if (resp.code == ErrorCode.OK) {
                    this.setConnect(resp);
                    // 账号基本信息保存在本地
                    Core.storage.setUser(resp.userId);
                    Core.storage.set("accountId", accountId);
                    Core.storage.set("adder", resp.addr);
                }
            }
        );
    }

    onGuestLogin() {
        uiManager.open(UIID.UILogin_Guest, this);
    }

    onWeiXinLogin() {
        game.toast("敬请期待");
        // this.login(AccountType.WX, "wxId");
    }

    onFacebookLogin() {
        game.toast("敬请期待");
        // this.login(AccountType.FB, "fbId");
    }

    onConnect() {
        channel.gameClose();
        channel.gameConnect(this.resp.addr);
    }
}
