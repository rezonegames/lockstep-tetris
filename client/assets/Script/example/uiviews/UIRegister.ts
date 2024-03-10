import {UIID} from "../UIExample";
import {Sprite, _decorator, Label, EditBox} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {LoginToGameResp, RegisterGameReq} from "db://assets/Script/example/proto/client";
import {CallbackObject} from "db://assets/Script/core/network/NetInterface";
import {Core} from "db://assets/Script/core/Core";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {channel} from "db://assets/Script/example/Channel";

const {ccclass, property} = _decorator;

@ccclass
export default class UIRegister extends UIView {

    @property(Label)
    myAccount: Label;

    @property(EditBox)
    myName: EditBox;

    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        let accountId = Core.storage.get("accountId");
        Core.log.logView(accountId, "accountId");
        this.myAccount.string = accountId;
    }

    onRegister() {
        channel.gameReqest("g.register", RegisterGameReq.encode({
            name: this.myName.string,
            accountId: this.myAccount.string
        }).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LoginToGameResp.decode(data.body);
                Core.log.logNet(resp, "注册游戏账号");
                if (resp.code == ErrorCode.OK) {
                    Core.event.raiseEvent("onUserInfo", resp.profile);
                    uiManager.replace(UIID.UIHall);
                }
            }
        });
    }

}
