import {_decorator, Label, Node, UITransform, Vec3, instantiate} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {
    GameStateResp, KickUser, KickUserResp,
    Ready,
    Room, SitDown, SitDownResp, StandUp, StandUpResp, TableInfo, TableInfo_Player
} from "db://assets/Script/example/proto/client";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {channel} from "db://assets/Script/example/Channel";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {oo} from "db://assets/Script/core/oo";

const {ccclass, property} = _decorator;

@ccclass
export default class UITable extends UIView {

    @property(Label)
    private info: Label

    @property(Node)
    private playerPrefab: Node

    @property(Node)
    private table: Node

    seatNodeMap: { [key: number]: Node } = {}

    tableInfo: TableInfo
    seatPlayer: {[key: number]: TableInfo_Player} = {};
    oldSeatPlayer: {[key: number]: TableInfo_Player} = {};

    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        let tableInfo = args[0] as TableInfo;
        this.info.string = `桌子：${tableInfo.tableId}\nPVP：${tableInfo.room?.name}`;
        oo.event.addEventListener("onState", this.onState, this);

        // 生成6个座位，
        let transform = this.table.getComponent(UITransform);
        let [width, height, offset] = [transform.width, transform.height, 110];
        let posList: Vec3[] = [
            new Vec3(-width / 2 + offset, 0, 0), new Vec3(width / 2 - offset, 0, 0),
            new Vec3(-offset, height / 2 - offset, 0), new Vec3(offset, height / 2 - offset, 0),
            new Vec3(-offset, -height / 2 + offset, 0), new Vec3(offset, -height / 2 + offset, 0),
        ];
        for (let i = 0; i < 6; i++) {
            let [node, seatId] = [instantiate(this.playerPrefab), i];

            node.on(Node.EventType.TOUCH_END, () => {
                this.clickSeat(seatId);
            })

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
            layout.active = false;
            this.table.addChild(node);
            this.seatNodeMap[seatId] = node;

        }
        this.refreshTableInfo(tableInfo);
    }

    onClose(): any {
        super.onClose();
        oo.event.removeEventListener("onState", this.onState, this);
    }

    onBackToRoom() {
        channel.gameReqest("r.standup", StandUp.encode({}).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = StandUpResp.decode(new Uint8Array(data.body));
                if (resp.code == ErrorCode.OK) {
                    uiManager.close();
                }
            }
        });
    }

    onReady() {
        channel.gameNotify("r.ready", Ready.encode({}).finish());
    }

    refreshTableInfo(tableInfo: TableInfo) {
        this.tableInfo = tableInfo;
        let [players, readys] = [tableInfo.players, tableInfo.waiter?.readys];
        this.oldSeatPlayer = this.seatPlayer;
        this.seatPlayer = {};
        for (let [uid, player] of Object.entries(players)) {
            let seatId = player.seatId;
            this.seatPlayer[seatId] = player;
        }

        // 清理
        for (let [seatId, node] of Object.entries(this.seatNodeMap)) {
            this.clickSeat(parseInt(seatId));
        }

        for (let [uid, player] of Object.entries(players)) {
            let [teamId, seatId, name, isReady] = [player.teamId, player.seatId, player.profile.name, readys[uid]];
            let node = this.seatNodeMap[seatId];
            let label = node.getChildByName("Label").getComponent(Label);
            label.string = `玩家：${uid}\n名字：${name}\n座位：${seatId}\n状态：${isReady ? "已准备" : "为准备"}`;
        }
    }

    onState(event: string, args: any) {
        let gameState = args as GameStateResp;
        this.refreshTableInfo(gameState.tableInfo);
    }

    clickSeat(seatId: number) {
        let [oldPlayer, player, node] = [this.oldSeatPlayer[seatId], this.seatPlayer[seatId], this.seatNodeMap[seatId]];
        let layout = node.getChildByName("Layout");
        let [label, kickBtn, sitBtn, my] = [node.getChildByName("Label"), layout.getChildByName("Button"),layout.getChildByName("Button-001"), this.seatPlayer[oo.storage.getUser()]];
        if(!player) {
            label.active = false;
            layout.active = true;
            sitBtn.active = true;
            kickBtn.active = false;
            return;
        }

        if (oldPlayer && (oldPlayer.profile?.userId == player.profile?.userId)) {
            return;
        }

        let btnState = !layout.active;
        layout.active = btnState;
        label.active = !btnState;

        if (btnState) {
            if (my && my.seatId == 0) {
                kickBtn.active = true;
            } else {
                kickBtn.active = false;
            }
            sitBtn.active = true;
        }
    }

    kickUser(seatId: number) {
        let player = this.seatPlayer[seatId];
        if (!player) {
            return;
        }
        channel.gameReqest("r.kickuser", KickUser.encode({
            userId: player.profile?.userId,
        }).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = KickUserResp.decode(new Uint8Array(data.body));
                if (resp.code == ErrorCode.OK) {
                    // 坐下动画
                }
            }
        });
    }

    sitDown(seatId: number) {
        let tableId = this.tableInfo.tableId;
        channel.gameReqest("r.sitdown", SitDown.encode({
            tableId: tableId,
            password: "",
            seatId: seatId
        }).finish(), {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = SitDownResp.decode(new Uint8Array(data.body));
                if (resp.code == ErrorCode.OK) {
                    // 坐下动画
                }
            }
        });
    }
}
