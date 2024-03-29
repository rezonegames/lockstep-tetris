import {_decorator, Label, Node, Prefab, EditBox} from "cc";
import {UIView} from "db://assets/core/ui/UIView";
import {
    CreateTable, CreateTableResp,
    GetRoomInfo,
    GetRoomInfoResp, JoinTable, JoinTableResp, Leave, LeaveResp,
    Room, TableInfo
} from "db://assets/bundle1/example/proto/client";
import {ListView} from "db://assets/core/components/scrollview/ListView";
import {ErrorCode} from "db://assets/bundle1/example/proto/error";

import {uiManager} from "db://assets/core/ui/UIManager";
import {Game, UIID} from "db://assets/bundle1/example/Game";

const {ccclass, property} = _decorator;

@ccclass
export default class UIRoom extends UIView {

    @property(ListView)
    private listView: ListView

    @property(Label)
    private info: Label

    @property(EditBox)
    private myTableId: EditBox

    @property(EditBox)
    private myPassword: EditBox

    intervalTimer

    roomId: string

    @property(Prefab)
    private tablePrefab: Prefab;

    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        let room = args[0] as Room;
        this.roomId = room.roomId;

        setTimeout(() => {
            this.getRoomInfo();
        }, 100);
        // 房间列表每5秒刷新一次
        this.intervalTimer = setInterval(() => {
            this.getRoomInfo();
        }, 3000);
    }

    onClose(): any {
        super.onClose();
        clearInterval(this.intervalTimer);
    }

    onBackToHall() {
        Game.channel.gameReqest("r.leave", Leave.encode({roomId: ""}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LeaveResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    uiManager.close();
                }
            }
        });
    }

    onCreateTable() {
        let [tableId, password] = [this.myTableId.string, this.myPassword.string];
        Game.channel.gameReqest("r.createtable", CreateTable.encode({tableId, password}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = CreateTableResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    let tableInfo = resp.table
                    uiManager.open(UIID.UITable, tableInfo);
                } else {
                    Game.toast("创建失败！！");
                }
            }
        });
    }

    refreshTableList(tableList: TableInfo[]) {
        // 以三个为一组，再次分组
        let groupedLists = [];
        tableList = tableList.sort((a: TableInfo, b: TableInfo) => {
            return a.createTime - b.createTime;
        })
        for (let i = 0; i < tableList.length; i += 5) {
            let group = tableList.slice(i, i + 5);
            groupedLists.push(group);
        }
        this.listView.setDelegate({
            items: () => groupedLists,
            reuse: (itemNode: Node, itemList: TableInfo[]) => {
                let children = itemNode.children;
                // 先把所有的tableNode active设置为false，再根据
                for (let i = 0; i < children.length; i++) {
                    let tableNode = children[i];
                    tableNode.active = false;
                }

                for (let i = 0; i < itemList.length; i++) {
                    let info = itemList[i];
                    let [tableNode, ok] = children.length - 1 >= i ? [children[i], true] : [
                        Game.resUtil.instantiate(this.tablePrefab), false
                    ];
                    tableNode.getChildByName("Label").getComponent(Label).string = `桌子ID：${info.tableId}`;
                    let [players, desc] = [info.players, ""];
                    for (const [uid, player] of Object.entries(players)) {
                        desc += `\n玩家：${uid} 名字：${player.profile.name} 队伍：${player.teamId}`;
                    }
                    tableNode.getChildByName("Label-001").getComponent(Label).string = desc;

                    tableNode.getChildByName("Button").off("click");
                    tableNode.getChildByName("Button").on("click", () => {
                        this.joinTable(info);
                    })

                    tableNode.active = true;
                    if (!ok) {
                        itemNode.addChild(tableNode);
                    }
                }
            }

        });
        this.listView.reload();
    }

    joinTable(tableInfo: TableInfo) {
        Game.channel.gameReqest("r.jointable", JoinTable.encode({tableId: tableInfo.tableId}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = JoinTableResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    uiManager.open(UIID.UITable, tableInfo);
                }
            }
        });
    }

    getRoomInfo() {
        if (!uiManager.isTopUI(UIID.UIRoom)) {
            return;
        }

        Game.channel.gameReqest("r.getroominfo", GetRoomInfo.encode({roomId: this.roomId}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = GetRoomInfoResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    let room = resp.room;
                    let [tableList, name, roomId, count] = [room?.tableList, room?.name, room?.roomId, room?.playerCount];
                    this.info.string = `房间信息：名字：${name} 房间ID：${roomId} 房间人数：${count}`;
                    this.refreshTableList(tableList);
                }
            }
        });
    }

}
