import {_decorator, Label, Layout, Node} from "cc";
import {UIView} from "db://assets/core/ui/UIView";
import {uiManager} from "db://assets/core/ui/UIManager";
import {
    OnGameState,
    Leave,
    LeaveResp,
    Room,
    StandUp,
    StandUpResp,
    TableInfo,
    TableInfo_Player
} from "db://assets/bundle1/example/proto/client";
import {ListView} from "db://assets/core/components/scrollview/ListView";
import {ErrorCode} from "db://assets/bundle1/example/proto/error";

import {RoomType} from "db://assets/bundle1/example/proto/consts";
import {Game, UIID} from "db://assets/bundle1/example/Game";

const {ccclass, property} = _decorator;

@ccclass
export default class UISettlement extends UIView {

    @property(ListView)
    listView: ListView

    @property(Label)
    info: Label

    tableInfo: TableInfo;

    @property(Layout)
    layout1: Layout

    @property(Layout)
    layout2: Layout

    public onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);
        let resp = args[0] as OnGameState;
        this.tableInfo = resp.tableInfo;
        // 更新列表
        let players: TableInfo_Player[] = [];
        for (const [k, v] of Object.entries(this.tableInfo.players)) {
            players.push(v);
        }
        players = players.sort((a, b) => {
            return a.teamId - b.teamId;
        })
        this.listView.setDelegate({
            items: () => players,
            reuse: (itemNode: Node, item: TableInfo_Player) => {
                let profile = item.profile;
                itemNode.getChildByName("team").getComponent(Label).string = `队伍：${item.teamId}队`;
                itemNode.getChildByName("name").getComponent(Label).string = `名字：${profile.name}`;
                let tip = "赢了";
                if (this.tableInfo?.loseTeams[item.teamId]) {
                    tip = "输了！！！";
                }
                itemNode.getChildByName("state").getComponent(Label).string = tip;
            }
        });
        this.listView.reload();

        let room: Room = this.tableInfo.room;
        this.info.string = `结算-房间信息：名字：${room.name} 房间ID：${room.roomId}`
        switch (room.type) {
            case RoomType.QUICK:
                this.layout1.node.active = true;
                this.layout2.node.active = false;
                break;
            case RoomType.FRIEND:
                this.layout1.node.active = false;
                this.layout2.node.active = true;
                break;
        }
    }

    public onClose() {
        Game.channel.gameReqest("r.leave", Leave.encode({roomId: ""}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LeaveResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    uiManager.replace(UIID.UIHall);
                }
            }
        });
    }

    public onBackToRoom() {
        Game.channel.gameReqest("r.standup", StandUp.encode({}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = StandUpResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    uiManager.replace(UIID.UIHall);
                    uiManager.open(UIID.UIRoom, this.tableInfo.room)
                }
            }
        });
    }

    public onBackToTable() {
        uiManager.replace(UIID.UIHall);
        uiManager.open(UIID.UITable, this.tableInfo);
    }
}
