import {UIID} from "../UIExample";
import {_decorator, Label, Node} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {GetRoomList, GetRoomListResp, Join, JoinResp, Room} from "db://assets/Script/example/proto/client";
import {Game} from "db://assets/Script/example/Game";
import {ListView} from "db://assets/Script/core/components/scrollview/ListView";
import {CallbackObject} from "db://assets/Script/core/network/NetInterface";
import {ErrorCode} from "db://assets/Script/example/proto/error";

import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {RoomType} from "db://assets/Script/example/proto/consts";

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
                //
                let quickStart = itemNode.getChildByName("quickstart");
                quickStart.off("click");
                let label = quickStart.getChildByName("Label").getComponent(Label);
                let  name = "";
                switch (item.type) {
                    case RoomType.QUICK:
                        name = "快速开始";
                        break;
                    case RoomType.FRIEND:
                        name = "进入";
                        break;
                    case RoomType.MATCH:
                        name = "报名";
                        break
                }
                label.string = name;
                quickStart.on("click", ()=>{
                    let buf = Join.encode({roomId: item.roomId}).finish()
                    let rspObject: CallbackObject = {
                        target: this,
                        callback: (cmd: number, data: any) => {
                            let resp = JoinResp.decode(data.body);
                            Game.log.logNet(resp, "快速开始，loading排队");
                            if (resp.code == ErrorCode.OK) {

                                switch (item.type) {
                                    case RoomType.QUICK:
                                        uiManager.open(UIID.UIWaiting, item);
                                        break;
                                    case RoomType.FRIEND:
                                        uiManager.open(UIID.UIRoom, item);
                                        break;
                                    case RoomType.MATCH:
                                        name = "报名";
                                        break
                                }


                            }
                        }
                    }
                    Game.channel.gameReqest("r.join", buf, rspObject);
                }, this)
            }

        });
        this.listView.reload();
    }

    getRoomList() {
        if(!uiManager.isTopUI(UIID.UIHall)) {
            return;
        }
        let buf = GetRoomList.encode({}).finish()
        let rspObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = GetRoomListResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    this.refreshHallList(resp.roomList);
                }
            }
        }
        Game.channel.gameReqest("r.getroomlist", buf, rspObject);
    }
}
