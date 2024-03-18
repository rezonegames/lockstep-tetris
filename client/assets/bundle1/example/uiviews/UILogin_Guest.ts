import {_decorator, Label, Node, tween, Vec3, Sprite, EditBox} from "cc";

import {UIView} from "db://assets/core/ui/UIView";
import {AccountType} from "db://assets/bundle1/example/proto/consts";
import {uiManager} from "db://assets/core/ui/UIManager";

const {ccclass, property} = _decorator;

@ccclass
export default class UILogin_Guest extends UIView {

    @property(EditBox)
    accountId: EditBox

    parent

    onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);
        this.parent = args[0];
    }

    onOK() {
        this.parent.login(AccountType.DEVICEID, this.accountId.string);
        uiManager.close();
    }

    onCancel() {
        uiManager.close();
    }
}
