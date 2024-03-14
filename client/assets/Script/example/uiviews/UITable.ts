import {_decorator, Label, Node, UITransform, Vec3, Prefab, Sprite} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {
    OnGameState, KickUser, KickUserResp, LeaveTable, LeaveTableResp,
    Ready,
    Room, SitDown, SitDownResp, StandUp, StandUpResp, TableInfo, TableInfo_Player
} from "db://assets/Script/example/proto/client";
import {ErrorCode} from "db://assets/Script/example/proto/error";

import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {Game} from "db://assets/Script/example/Game";
import {GetTeamColor} from "db://assets/Script/example/Game";

const {ccclass, property} = _decorator;

@ccclass
export default class UITable extends UIView {

    @property(Label)
    private info: Label

    @property(Prefab)
    private playerPrefab: Prefab

    @property(Node)
    private table: Node

    seatNodeMap: { [key: number]: Node } = {}

    tableInfo: TableInfo
    seatPlayer: { [key: number]: TableInfo_Player } = {};

    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        let tableInfo = args[0] as TableInfo;
        this.info.string = `桌子：${tableInfo.tableId}\nPVP：${tableInfo.room?.name}`;
        Game.event.addEventListener("onState", this.onState, this);

        // 生成6个座位，
        let transform = this.table.getComponent(UITransform);
        let [width, height, offsetW, offsetH] = [transform.width, transform.height, 90, 75];
        let posList: Vec3[] = [
            new Vec3(-width / 2 + offsetW, 0, 0), new Vec3(width / 2 - offsetW, 0, 0),
            new Vec3(-offsetW, height / 2 - offsetH, 0), new Vec3(offsetW, height / 2 - offsetH, 0),
            new Vec3(-offsetW, -height / 2 + offsetH, 0), new Vec3(offsetW, -height / 2 + offsetH, 0),
        ];
        for (let i = 0; i < 6; i++) {
            let [node, seatId] = [Game.resUtil.instantiate(this.playerPrefab), i];

            let label = node.getChildByName("Label").getComponent(Label);
            label.string = "";

            let layout = node.getChildByName("Layout");
            let [sitBtn, kickBtn] = [layout.getChildByName("Button-001"), layout.getChildByName("Button")];

            sitBtn.on("click", () => {
                this.sitDown(seatId);
            })

            kickBtn.on("click", () => {
                this.kickUser(seatId);
            })
            node.setPosition(posList[seatId]);
            node.active = true;
            this.table.addChild(node);
            this.seatNodeMap[seatId] = node;
            node.getComponent(Sprite).color = GetTeamColor(i);
        }
        this.refreshTableInfo(tableInfo);
    }

    onClose(): any {
        super.onClose();
        Game.event.removeEventListener("onState", this.onState, this);
    }

    onBackToRoom() {
        Game.channel.gameReqest("r.leavetable", LeaveTable.encode({}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LeaveTableResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    uiManager.close();
                }
            }
        });
    }

    onReady() {
        Game.channel.gameNotify("r.ready", Ready.encode({}).finish());
    }

    refreshTableInfo(tableInfo: TableInfo) {
        this.tableInfo = tableInfo;
        let [players, readys, my, inTable, owner] = [tableInfo.players, tableInfo.waiter?.readys, Game.storage.getUser(), false, tableInfo.owner];
        this.seatPlayer = {};
        for (let [_, player] of Object.entries(players)) {
            let seatId = player.seatId;
            this.seatPlayer[seatId] = player;
            if (my === player.profile?.userId) {
                inTable = true;
            }
        }

        // 重置界面
        for (let seatId = 0; seatId < 6; seatId++) {
            let [node, player, info] = [this.seatNodeMap[seatId], this.seatPlayer[seatId], "无"];
            let layout = node.getChildByName("Layout");
            let label = node.getChildByName("Label").getComponent(Label);
            let  ownerNode = node.getChildByName("owner");
            let [sitBtn, kickBtn] = [layout.getChildByName("Button-001"), layout.getChildByName("Button")];
            sitBtn.active = true;
            kickBtn.active = false;
            ownerNode.active = false;

            if (!!player) {
                let [uid, name] = [player.profile?.userId, player.profile?.name];
                let isReady = readys[uid]
                info = `玩家：${uid}\n名字：${name}\n座位：${seatId}\n状态：${isReady ? "已准备" : "未准备"}`;
                if (uid == owner) {
                    ownerNode.active = true;
                }
                if (!inTable) {
                    sitBtn.active = false;
                } else {
                    if (uid == my) {
                        sitBtn.active = false;
                    }
                    if (my === owner && uid !== my) {
                        kickBtn.active = true;
                    }
                }
            }
            label.string = info;
        }

    }

    onState(event: string, args: any) {
        let gameState = args as OnGameState;
        this.refreshTableInfo(gameState.tableInfo);
    }

    kickUser(seatId: number) {
        let player = this.seatPlayer[seatId];
        if (!player) {
            return;
        }
        Game.channel.gameReqest("r.kickuser", KickUser.encode({
            userId: player.profile?.userId,
        }).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = KickUserResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    // 坐下动画
                }
            }
        });
    }

    sitDown(seatId: number) {
        let tableId = this.tableInfo.tableId;
        Game.channel.gameReqest("r.sitdown", SitDown.encode({
            tableId: tableId,
            password: "",
            seatId: seatId
        }).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = SitDownResp.decode(data.body);
                if (resp.code == ErrorCode.OK) {
                    // 坐下动画
                }
            }
        });
    }
}
