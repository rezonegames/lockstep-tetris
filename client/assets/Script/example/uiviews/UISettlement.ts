import { _decorator, Node, Label } from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {GameStateResp, Leave, LeaveResp, TableInfo, TableInfo_Player} from "db://assets/Script/example/proto/client";
import {ListView} from "db://assets/Script/core/components/scrollview/ListView";
import {UIID} from "db://assets/Script/example/UIExample";
import {CallbackObject} from "db://assets/Script/core/network/NetInterface";
import {oo} from "db://assets/Script/core/oo";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {channel} from "db://assets/Script/example/Channel";

const {ccclass, property} = _decorator;

@ccclass
export default class UISettlement extends UIView {

    @property(ListView)
    listView: ListView

    @property(Label)
    info: Label

    resp: GameStateResp;

    public onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);
        this.resp = args[0] as GameStateResp;
        let tableInfo = this.resp.tableInfo;
        // 更新列表
        let players: TableInfo_Player[] = [];
        for (const [k, v] of Object.entries(tableInfo.players)) {
            players.push(v);
        }
        players = players.sort((a, b) => {
            return a.teamId - b.teamId;
        })
        this.listView.setDelegate({
            items: () => players,
            reuse: (itemNode: Node, item: TableInfo_Player) => {
                let p = item.profile;
                itemNode.getChildByName("team").getComponent(Label).string = `队伍：${item.teamId}队`;
                itemNode.getChildByName("name").getComponent(Label).string = `名字：${p.name}`;
                let tip = "赢了";
                if (tableInfo?.loseTeams[item.teamId]) {
                    tip = "输了！！！";
                }
                itemNode.getChildByName("state").getComponent(Label).string = tip;
            }
        });
        this.listView.reload();
        this.info.string = `结算-房间信息：名字：1v1 房间ID：1`
    }

    public onClose() {
        channel.gameReqest("r.leave", Leave.encode({roomId: "", force: false}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LeaveResp.decode(new Uint8Array(data.body));
                uiManager.replace(UIID.UIHall, resp.roomList);
            }
        });
    }

}
