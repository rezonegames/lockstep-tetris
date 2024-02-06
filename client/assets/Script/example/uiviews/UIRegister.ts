import { UIID } from "../UIExample";
import { Sprite, _decorator, Label, EditBox } from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {LoginToGameResp, RegisterGameReq} from "db://assets/Script/example/proto/client";
import {CallbackObject} from "db://assets/Script/core/network/NetInterface";
import {oo} from "db://assets/Script/core/oo";
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

    public onOpen(fromUI: number, ...args : any): void {
        let accountId = oo.storage.get("accountId");
        oo.log.logView(accountId, "accountId");
        this.myAccount.string = accountId;
    }

    onRegister() {
        let buf = RegisterGameReq.encode({name: this.myName.string, accountId: this.myAccount.string}).finish();
        let rspObject: CallbackObject = {
            target: null,
            callback: (cmd: number, data: any) => {
                let resp = LoginToGameResp.decode(new Uint8Array(data));
                oo.log.logNet(resp, "注册游戏账号");
                if (resp.code == ErrorCode.OK) {
                    uiManager.replace(UIID.UIHall, resp.roomList);
                }
            }
        }
        channel.gameReqest("g.register", buf, rspObject);
    }

}
