import {Sprite, _decorator, Label, Component} from "cc";
import {Profile} from "db://assets/Script/example/proto/client";
import {ItemType} from "db://assets/Script/example/proto/consts";
import {Core} from "db://assets/Script/core/Core";

const {ccclass, property} = _decorator;

@ccclass
export default class UIHeader extends Component {

    @property(Label)
    myName: Label

    @property(Label)
    myCoin: Label

    start() {

    }

    onLoad() {
        this.myName.string = "";
        this.myCoin.string = "";

        Core.event.addEventListener("onUserInfo", this.onUserInfo, this);
    }

    onDestroy() {
        super.onDestroy();
        Core.event.removeEventListener("onUserInfo", this.onUserInfo, this);
    }

    onUserInfo(event: string, args: any) {
        let profile = args as Profile;

        if(!!profile.userId) {
            this.myName.string = "";
            this.myCoin.string = "";
            return;
        }

        this.myName.string = `ID：${profile.userId} 名字：${profile.name}`;

        // 道具
        let my = "";
        profile.itemList?.forEach((item)=>{
            switch (item.key) {
                case ItemType.COIN:
                    my += `金币：${item.val} `;
                    break;
                default:
                    break;
            }
        })
        this.myCoin.string = my;
    }
}
