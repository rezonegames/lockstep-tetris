import {_decorator, Label, Layout, Node, Prefab, Sprite, tween, UITransform, Vec3} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {
    Action,
    LoadRes,
    Frame,
    Frame_Player,
    OnFrameList,
    Room,
    TableInfo,
    TableInfo_Player,
    UpdateFrame
} from "db://assets/Script/example/proto/client";
import {Core} from "db://assets/Script/core/Core";
import {Tetris} from "db://assets/Script/example/Tetris";
import {ActionType} from "db://assets/Script/example/proto/consts";
import {channel} from "db://assets/Script/example/Channel";
import {Block} from "db://assets/Script/example/Block";
import {game, GetTeamColor} from "db://assets/Script/example/Game";

const {ccclass, property} = _decorator;

@ccclass('UIControl')
export default class UIControl extends UIView {
    // 自己的控制脚本
    private my: Tetris

    @property(Label)
    private title: Label

    @property(Prefab)
    tetrisPrefab: Prefab

    @property(Prefab)
    blockPrefab: Prefab

    @property(Prefab)
    itemCtrlPrefab: Prefab

    @property([Prefab])
    layoutPrefabList: Prefab[] = [];

    // 存放道具的容器
    @property(Layout)
    itemContainer: Layout

    @property(Layout)
    itemCtrlContainer: Layout

    tetrisManager: { [key: number]: Tetris } = {}

    // 帧数据
    curFrame: number = 0;
    preFrameTime: number = 0;
    frameList: Frame[] = [];

    public init(...args) {
        super.init(...args);
    }

    public onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);
        Core.log.logView(args, "UIControl.onOpen");
        Core.event.addEventListener("onFrame", this.onFrame, this);
        let tableInfo = args[0] as TableInfo;
        let room: Room = tableInfo.room;
        this.title.string = room.name
        Core.random.setSeed(tableInfo.randSeed);

        let layoutPrefab = null;
        for(let i=0;i<this.layoutPrefabList.length; i++) {
            let prefab = this.layoutPrefabList[i];
            if (prefab.name == room.prefab) {
                layoutPrefab = prefab
            }
        }

        // 添加布局
        let parent: Node = Core.resUtil.instantiate(layoutPrefab);
        this.node.addChild(parent);

        // 初始化每个tetris
        let [i, j, my] = [1, 1, tableInfo.players[Core.storage.getUser()]];
        for (const [uid, player] of Object.entries(tableInfo.players)) {

            // tetris的container
            let containerName = "";
            if (player.teamId !== my.teamId) {
                containerName = `enemy${i}`;
                i++;
            } else {
                if (parseInt(uid) == my.profile?.userId) {
                    containerName = "my";
                } else {
                    containerName = `mate${j}`;
                    j++;
                }
            }

            console.log(containerName);

            let container: Node = parent.getChildByName(containerName);
            let tNode: Node = Core.resUtil.instantiate(this.tetrisPrefab);
            let tetris: Tetris = tNode.getComponent("Tetris") as Tetris;

            this.initTetris(player, tetris);
            if (containerName == "my") {
                this.my = tetris;
            } else {
                let s = container.getComponent(UITransform).width * 1.0 / 500;
                tNode.setScale(s, s);
            }
            container.getComponent(Sprite).spriteFrame = null;
            container.addChild(tNode);

            // 发送道具的按钮
            this.initItemCtrl(player);

            // 保存每个tetris对象
            this.tetrisManager[uid] = tetris;
        }
        this.notifyResProgress();

    }

    notifyResProgress() {
        Core.log.logView("", "res.ok");
        channel.gameNotify("r.loadres", LoadRes.encode({current: 100}).finish());
        game.closeLoading();
    }

    onDestroy() {
        super.onDestroy();
        Core.event.removeEventListener("onFrame", this.onFrame, this);
    }

    initItemCtrl(player: TableInfo_Player) {
        let btn = Core.resUtil.instantiate(this.itemCtrlPrefab);
        btn.getComponent(Sprite).color = GetTeamColor(player.teamId);
        btn.getChildByName("Label").getComponent(Label).string = `T/${player.teamId}`;
        btn.on("click", () => {
            if (this.my.player.isEnd) {
                return;
            }
            let children = this.itemContainer.node.children;
            if (children.length > 0) {
                let node = children[0];
                let block: Block = node.getComponent("Block") as Block;
                let [to, from, val] = [player.profile?.userId, Core.storage.getUser(), block.getValue()];
                Core.log.logView(`player from ${from} send item controller to ${to} value ${block.getValue()}`);
                this.serialize(block.getItem(), [val], to, from);
                this.itemContainer.node.removeChild(node);
            }
        }, this);
        this.itemCtrlContainer.node.addChild(btn)
    }

    initTetris(player: TableInfo_Player, tetris: Tetris) {
        tetris.onAdded({
            uid: player.profile?.userId,
            isMy: player.profile?.userId === Core.storage.getUser(),
            teamId: player.teamId,
        });
        // 玩家的所有事件
        ['nextPiece', 'pos', 'end', 'matrix', 'score', 'combo', 'combo_3', 'combo_4'].forEach(key => {
            let from = Core.storage.getUser() == tetris.player.uid ? 0 : tetris.player.uid;
            tetris.player.events.on(key, (val) => {
                switch (key) {
                    case "score":
                        tetris.updateScore(val);
                        break;
                    case "end":
                        this.serialize(ActionType.END, [], 0, from);
                        break;
                    case "pos":
                    case "matrix":
                        tetris.draw();
                        break;
                    case "nextPiece":
                        tetris.drawNextMatrix();
                        break;

                    // todo: random问题，保证各个客户端random结果一致
                    case "combo":
                    case "combo_3":
                    case "combo_4":
                        for (const [_, t] of Object.entries(this.tetrisManager)) {
                            if (t.player.teamId !== tetris.player.teamId) {
                                let valList = Core.random.getRandomByMinMaxList(0, 11, val);
                                for (let i = 0; i < valList.length; i += 2) {
                                    t.player.addRow(valList.slice(i, i + 2));
                                }
                            }
                        }
                        break
                    default:
                        break
                }
            })
        });

        // 所有区域的事件
        ["matrix", "item"].forEach(key => {
            tetris.arena.events.on(key, (val) => {
                switch (key) {
                    case "matrix":
                        tetris.draw();
                        break;
                    case "item":
                        if (tetris.player.uid === Core.storage.getUser()) {
                            let node: Node = Core.resUtil.instantiate(this.blockPrefab);
                            let block: Block = node.getComponent("Block") as Block;
                            block.drawValue(val);
                            this.itemContainer.node.addChild(node);
                        }
                        break;
                }
            })
        });
    }

    // 发送操作数据
    serialize(action: ActionType, valList: number[], to: number = 0, from: number = 0) {
        channel.gameNotify("r.update", UpdateFrame.encode({action: {key: action, valList, from, to}}).finish());
    }

    // 解析网络过来的操作数据
    unserialize(tetris: Tetris, msg: Frame_Player) {
        let actionList = msg.actionList;
        actionList.forEach((action: Action) => {
            let valList = action.valList;
            let to = this.tetrisManager[action.to];
            let from = this.tetrisManager[action.from];
            switch (action.key) {
                case ActionType.MOVE:
                    for (let i = 0; i < valList.length; i++) {
                        tetris.player.move(valList[i]);
                    }
                    break;
                case ActionType.DROP:
                    for (let i = 0; i < valList.length; i++) {
                        tetris.player.drop();
                    }
                    break;
                case ActionType.QUICK_DROP:
                    tetris.player.dropDown();
                    break;
                case ActionType.ROTATE:
                    for (let i = 0; i < valList.length; i++) {
                        tetris.player.rotate(1);
                    }
                    break;
                case ActionType.ITEM_ADD_ROW:
                case ActionType.ITEM_DEL_ROW:
                case ActionType.ITEM_BOOM:
                case ActionType.ITEM_BUFF_DISTURB:
                    let [source, target, randList, value] = [from.node.parent, to.node.parent, null, valList[0]];
                    // todo：因为每个设备的动画的执行时间可能不一样，所以要在收到帧数据的时候先random对应的值
                    if (action.key == ActionType.ITEM_ADD_ROW) {
                        randList = Core.random.getRandomByMinMaxList(0, 11, 2);
                    }
                    let blockNode = Core.resUtil.instantiate(this.blockPrefab);
                    let blockScript = blockNode.getComponent("Block") as Block;
                    blockScript.drawValue(value);
                    this.node.addChild(blockNode);
                    let sourcePos = source.getPosition();
                    blockNode.setPosition(new Vec3(
                        sourcePos.x,
                        sourcePos.y - source.getComponent(UITransform).height / 2,
                        sourcePos.z
                    ));

                    Core.log.logView(`player receive item from ${from.player.uid} to ${to.player.uid} value ${value}
                    source ${blockNode.getPosition()} target ${target.getPosition()}`);
                    tween(blockNode).to(1, {position: target.getPosition()})
                        .call(() => {
                            switch (action.key) {
                                case ActionType.ITEM_ADD_ROW:
                                    // 加1列
                                    for (let i = 0; i < randList.length; i += 2) {
                                        to.player.addRow(randList.slice(i, i + 2));
                                    }
                                    break;
                                case ActionType.ITEM_DEL_ROW:
                                    to.player.delRow();
                                    break;
                                case ActionType.ITEM_BOOM:
                                    to.player.boom([]);
                                    break;
                                case ActionType.ITEM_BUFF_DISTURB:
                                    to.player.addDisturbBuff(3);
                                    break;
                            }
                            this.node.removeChild(blockNode);
                            blockNode.destroy();
                        }).start();
                    break;
                default:
                    break
            }
        })
        ;
    }

    onFrame(event: string, args: any) {
        let msg = args as OnFrameList;
        this.frameList = this.frameList.concat(msg.frameList);

        // 执行关键帧，可以控制回放速度
        let i = 0;
        while (this.curFrame < this.frameList.length && i < 100) {
            let frame = this.frameList[this.curFrame];
            this.process(frame);
            i++
        }
    }

    // 游戏本身的帧速不考虑了
    update(deltaTime: number) {

    }

    process(frame: Frame) {
        // 第一帧，初始化tetirs
        if (frame.frameId == 0) {
            for (const [uid, t] of Object.entries(this.tetrisManager)) {
                t.player.pieceList = frame.pieceList;
                t.player.reset();
            }
        } else {
            frame.playerList.forEach((player: Frame_Player) => {
                let t = this.tetrisManager[player.userId];
                if (t.player) {
                    this.unserialize(t, player);
                }
            })
        }
        // 以服务器时间为准，执行player的update
        for (const [_, t] of Object.entries(this.tetrisManager)) {
            t.player.update(frame.frameTime - this.preFrameTime);
        }
        this.preFrameTime = frame.frameTime
        this.curFrame++;
    }

    touch(val: number, touchCounter: number, offset: number = 0):
        number[] {
        // 有buff，是反的
        if (this.my.player.disturbBuff) {
            val = Core.random.getRandomInt(0, 1) == 0 ? val : -val;
        }
        let valList: number[] = [];
        if (touchCounter <= 4) {
            valList.push(val);
        } else if (touchCounter > 4 && touchCounter < 8) {
            valList.push(val, val)
        } else if (touchCounter >= 8 && touchCounter < 15) {
            valList.push(val, val, val)
        } else {
            for (let i = offset; i >= 0; i--) {
                valList.push(val)
            }
        }
        return valList;
    }

    onLeft(touchCounter: number, customEventData ?: any) {
        this.serialize(ActionType.MOVE, this.touch(-1, touchCounter));
    }

    onRight(touchCounter: number, customEventData ?: any) {
        this.serialize(ActionType.MOVE, this.touch(1, touchCounter));
    }

    onUp() {
        this.serialize(ActionType.ROTATE, this.touch(1, 1));
    }

    onDrop(touchCounter: number, customEventData ?: any) {
        this.serialize(ActionType.DROP, this.touch(1, touchCounter, this.my.player.pos.y - 1));
    }

    onQuick() {
        this.serialize(ActionType.QUICK_DROP, [0])
    }
}
