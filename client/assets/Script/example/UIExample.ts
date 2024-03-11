import {Component, _decorator} from "cc";
import {UIConf, uiManager} from "db://assets/Script/core/ui/UIManager";
import {Game} from "db://assets/Script/example/Game";


// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass} = _decorator;

export enum UIID {
    UILogin,
    UILogin_Guest,
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
    [UIID.UILogin]: {prefab: "Prefab/Login"},
    [UIID.UILogin_Guest]: {prefab: "Prefab/Login_Guest", preventTouch: true},
    [UIID.UIHall]: {prefab: "Prefab/Hall"},
    [UIID.UIRoom]: {prefab: "Prefab/Room"},
    [UIID.UITable]: {prefab: "Prefab/Table"},
    [UIID.UIRegister]: {prefab: "Prefab/Register"},
    [UIID.UIWaiting]: {prefab: "Prefab/Waiting"},
    [UIID.UIControl]: {prefab: "Prefab/Control", preventTouch: true},
    [UIID.UISettlement]: {prefab: "Prefab/Settlement"},
}

@ccclass
export default class UIExample extends Component {

    start() {
        Game.initGame();
        uiManager.initUIConf(UICF);
        uiManager.open(UIID.UILogin);
    }
}
