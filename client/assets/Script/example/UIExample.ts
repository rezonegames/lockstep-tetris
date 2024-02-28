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
    UIRoom,
    UITable,
    UINotice,
    UIWaiting,
    UIControl,
    UISettlement
}

export let UICF: { [key: number]: UIConf } = {
    [UIID.UILogin]: {prefab: "Prefab/Login", preventTouch: true},
    [UIID.UIHall]: {prefab: "Prefab/Hall", preventTouch: true},
    [UIID.UIRoom]: {prefab: "Prefab/Room", preventTouch: true},
    [UIID.UITable]: {prefab: "Prefab/Table", preventTouch: true},
    [UIID.UIRegister]: {prefab: "Prefab/Register", preventTouch: true},
    [UIID.UIWaiting]: {prefab: "Prefab/Waiting", preventTouch: true},
    [UIID.UIControl]: {prefab: "Prefab/Control", preventTouch: true},
    [UIID.UISettlement]: {prefab: "Prefab/Settlement", preventTouch: true},
}

@ccclass
export default class UIExample extends Component {

    start() {
        uiManager.initUIConf(UICF);
        // background 层，在切换ui的时候不隐藏
        uiManager.open(UIID.UILogin);
    }
}
