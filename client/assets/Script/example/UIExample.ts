import {Component, _decorator} from "cc";
import {UIConf, uiManager} from "db://assets/Script/core/ui/UIManager";
import {oo} from "db://assets/Script/core/oo";
import {channel} from "db://assets/Script/example/Channel";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = _decorator;

export enum UIID {
    UILogin,
    UIRegister,
    UIHall,
    UINotice,
    UIWaiting,
    UIControl,
    UISettlement
}

export let UICF: { [key: number]: UIConf } = {
    [UIID.UILogin]: {prefab: "Prefab/Login"},
    [UIID.UIHall]: {prefab: "Prefab/Hall"},
    [UIID.UIRegister]: {prefab: "Prefab/Register"},
    [UIID.UIWaiting]: {prefab: "Prefab/Waiting"},
    [UIID.UIControl]: {prefab: "Prefab/Control"},
    [UIID.UISettlement]: {prefab: "Prefab/Settlement"},
}

@ccclass
export default class UIExample extends Component {

    start() {
        uiManager.initUIConf(UICF);
        // background 层，在切换ui的时候不隐藏
        uiManager.open(UIID.UILogin);
    }
}
