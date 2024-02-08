import {UIID} from "../UIExample";
import {Sprite, _decorator, Label, Node, Layout} from "cc";
import {SpriteFrame} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {
    GameStateResp,
    GetRoomList,
    GetRoomListResp,
    Join,
    JoinResp,
    Room
} from "db://assets/Script/example/proto/client";
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

    intervalTimer

    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        setTimeout(()=>{
            this.getRoomList();
        }, 100);
        // 房间列表每5秒刷新一次
        this.intervalTimer = setInterval(() => {
            this.getRoomList();
        }, 5000);
    }

    onClose(): any {
        super.onClose();
        clearInterval(this.intervalTimer);
    }

    refreshHallList(roomList: Room[]) {
        this.listView.setDelegate({
            items: () => roomList,
            reuse: (itemNode: Node, item: Room) => {
                itemNode.getChildByName("name").getComponent(Label).string = `房间：${item.roomId}`;
                itemNode.getChildByName("desc").getComponent(Label).string = `信息：${item.name}`;
                itemNode.getChildByName("count").getComponent(Label).string = `人数：${item.playerCount}`;
                let quickStart = itemNode.getChildByName("quickstart");
                quickStart.off("click");
                quickStart.on("click", ()=>{
                    let buf = Join.encode({roomId: item.roomId}).finish()
                    let rspObject: CallbackObject = {
                        target: this,
                        callback: (cmd: number, data: any) => {
                            let resp = JoinResp.decode(new Uint8Array(data.body));
                            oo.log.logNet(resp, "快速开始，loading排队");
                            if (resp.code == ErrorCode.OK) {
                                uiManager.open(UIID.UIWaiting, item);
                            }
                        }
                    }
                    channel.gameReqest("r.join", buf, rspObject);
                }, this)
            }

        });
        this.listView.reload();
    }

    getRoomList() {
        let buf = GetRoomList.encode({}).finish()
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = GetRoomListResp.decode(new Uint8Array(data.body));
                if (resp.code == ErrorCode.OK) {
                    this.refreshHallList(resp.roomList);
                }
            }
        }
        channel.gameReqest("r.getroomlist", buf, rspObject);
    }
}
