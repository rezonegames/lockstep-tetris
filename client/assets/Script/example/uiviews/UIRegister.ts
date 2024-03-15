import {Sprite, _decorator, Label, EditBox} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {LoginToGameResp, RegisterGameReq} from "db://assets/Script/example/proto/client";
import {Game, UIID} from "db://assets/Script/example/Game";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {uiManager} from "db://assets/Script/core/ui/UIManager";


const {ccclass, property} = _decorator;

@ccclass
export default class UIRegister extends UIView {

    @property(Label)
    myAccount: Label;

    @property(EditBox)
    myName: EditBox;

    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        let accountId = Game.storage.get("accountId");
        Game.log.logView(accountId, "accountId");
        this.myAccount.string = accountId;
    }

    onRegister() {
        Game.channel.gameReqest("g.register", RegisterGameReq.encode({
            name: this.myName.string,
            accountId: this.myAccount.string
        }).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LoginToGameResp.decode(data.body);
                Game.log.logNet(resp, "注册游戏账号");
                if (resp.code == ErrorCode.OK) {
                    Game.storage.setUser(resp.profile?.userId);
                    Game.event.raiseEvent("onUserInfo", resp.profile);
                    uiManager.replace(UIID.UIHall);
                }
            }
        });
    }

}
