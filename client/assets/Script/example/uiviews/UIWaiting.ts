import {_decorator, Label, Node, Button} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {ListView} from "db://assets/Script/core/components/scrollview/ListView";
import {oo} from "db://assets/Script/core/oo";
import {
    Ready,
    Leave,
    LeaveResp,
    OnGameState,
    Room,
    TableInfo_Player
} from "db://assets/Script/example/proto/client";
import {CallbackObject} from "db://assets/Script/core/network/NetInterface";
import {ErrorCode} from "db://assets/Script/example/proto/error";
import {uiManager} from "db://assets/Script/core/ui/UIManager";
import {channel} from "db://assets/Script/example/Channel";
import {GameState, TableState} from "db://assets/Script/example/proto/consts";

const {ccclass, property} = _decorator;

@ccclass
export default class UIWaiting extends UIView {

    @property(ListView)
    private listView: ListView

    @property(Label)
    private title: Label

    @property(Label)
    private countDown: Label

    @property(Label)
    private test: Label

    @property(Button)
    private ready: Button

    // todo：等待列表用于更新scrollview，以后研究一下有没有新的更好的可以使用
    private oldReadyList: { [key: number]: number } = {};


    public onOpen(fromUI: number, ...args: any): void {
        super.onOpen(fromUI, ...args);
        oo.event.addEventListener("onState", this.onState, this);
        let room = args[0] as Room;
        let [name, roomId] = [room.name, room.roomId];
        this.title.string = `房间信息：名字：${name} 房间ID：${roomId}`;
        this.clear();
    }

    public onClose(): any {
        super.onClose();
        oo.event.removeEventListener("onState", this.onState, this);
    }

    clear() {
        this.ready.node.active = false;
        this.countDown.node.active = false;
        this.listView.node.active = false;
        this.test.node.active = true;
        this.updateWaitView([], {});
    }

    public onState(event: string, args: any) {
        let gameState = args as OnGameState;

        switch (gameState.state) {
            case GameState.WAIT:
                this.clear();
                break;
            case GameState.INGAME:
                let tableInfo = gameState.tableInfo;
                switch (tableInfo.tableState) {
                    case TableState.WAITREADY:
                        this.ready.node.active = true;
                        this.countDown.node.active = true;
                        this.listView.node.active = true;
                        this.test.node.active = false;

                        let countDown = tableInfo.waiter.countDown;
                        let readys = tableInfo.waiter.readys;
                        let uid = oo.storage.getUser();

                        // 更新ui，打开游戏界面
                        this.countDown.string = `倒计时：${countDown}`;
                        if (countDown == 1 && !(uid in readys)) {
                            uiManager.close();
                            return;
                        }

                        // 更新list
                        if (Object.keys(readys).length != 0 && Object.keys(readys).length == Object.keys(this.oldReadyList).length) {
                            return;
                        }
                        let profiles: TableInfo_Player[] = [];
                        for (const k in tableInfo.players) {
                            let p = tableInfo.players[k];
                            profiles.push(p);
                        }
                        profiles = profiles.sort((a, b) => {
                            return a.teamId - b.teamId;
                        })
                        this.updateWaitView(profiles, readys);
                        this.oldReadyList = readys;
                        break;

                }

                break;
        }
    }

    // 更新列表
    updateWaitView(profiles: TableInfo_Player[], readys: { [key: number]: number }) {
        this.listView.setDelegate({
            items: () => profiles,
            reuse: (itemNode: Node, item: TableInfo_Player) => {
                let p = item.profile;
                itemNode.getChildByName("team").getComponent(Label).string = `队伍：${item.teamId}队`;
                itemNode.getChildByName("name").getComponent(Label).string = `名字：${p.name}`;
                let tip = "等待玩家准备";
                if (readys[p.userId]) {
                    tip = "已准备";
                }
                itemNode.getChildByName("state").getComponent(Label).string = `准备状态：${tip}`;
            }
        });
        this.listView.reload();
    }

    onReady() {
        let buf = Ready.encode({}).finish();
        channel.gameNotify("r.ready", buf);
    }

    onCancel() {
        let buf = Leave.encode({roomId: ""}).finish();
        let respObject: CallbackObject = {
            target: this,
            callback: (cmd: number, data: any) => {
                let resp = LeaveResp.decode(data.body);
                oo.log.logNet(resp, "leave返回");
                if (resp.code == ErrorCode.OK) {
                    uiManager.close();
                }
            }
        }
        channel.gameReqest("r.leave", buf, respObject);
    }
}

