import { UIID } from "../UIExample";
import { Sprite, _decorator, Label, Node, Layout } from "cc";
import { SpriteFrame } from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {GameStateResp, Join, Room} from "db://assets/Script/example/proto/client";
import {oo} from "db://assets/Script/core/oo";
import {ListView} from "db://assets/Script/core/components/scrollview/ListView";
import {CallbackObject} from "db://assets/Script/core/network/NetInterface";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {channel} from "db://assets/Script/example/Channel";
import {uiManager} from "db://assets/Script/core/ui/UIManager";

const {ccclass, property} = _decorator;

@ccclass
export default class UIHall extends UIView {

    @property(ListView)
    private listView: ListView

    public onOpen(fromUI: number, ...args : any): void {
        let roomList = args[0];
        oo.log.logView(roomList, `更新大厅房间列表 ${this.node.name}`);
        this.listView.setDelegate({
            items: () => roomList,
            reuse: (itemNode: Node, item: Room) => {
                itemNode.getChildByName("name").getComponent(Label).string = `房间：${item.roomId}`;
                itemNode.getChildByName("desc").getComponent(Label).string = `信息：${item.name}`;
                itemNode.getChildByName("count").getComponent(Label).string = `人数：1000`;
                itemNode.getChildByName("quickstart").on("click", () => {
                    // r.quickstart
                    let buf = Join.encode({roomId: item.roomId}).finish()
                    let rspObject: CallbackObject = {
                        target: this,
                        callback: (cmd: number, data: any) => {
                            let resp = GameStateResp.decode(new Uint8Array(data.body));
                            oo.log.logNet(resp, "快速开始，loading排队");
                            if (resp.code == ErrorCode.OK) {
                                uiManager.open(UIID.UIWaiting, item);
                            }
                        }
                    }
                    channel.gameReqest("r.join", buf, rspObject);
                })
            }
        });
        this.listView.reload();
    }

}
