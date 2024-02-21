import {_decorator, instantiate, Label, Layout, Node, Prefab, Sprite, tween, UITransform, Vec3} from "cc";
import {UIView} from "db://assets/Script/core/ui/UIView";
import {
    Action,
    LoadRes,
    OnFrame,
    OnFrame_Player,
    OnFrameList,
    Room,
    TableInfo,
    TableInfo_Player,
    UpdateFrame
} from "db://assets/Script/example/proto/client";
import {oo} from "db://assets/Script/core/oo";
import {Tetris} from "db://assets/Script/example/Tetris";
import {ActionType} from "db://assets/Script/example/proto/consts";
import {channel} from "db://assets/Script/example/Channel";
import {Block} from "db://assets/Script/example/Block";

const {ccclass, property} = _decorator;

@ccclass('UIControl')
export default class UIControl extends UIView {
    // 自己的控制脚本
    private my: Tetris

    @property(Label)
    private title: Label

    @property(Prefab)
    tetris: Prefab

    // 存放道具的容器
    @property(Layout)
    itemContainer: Layout

    @property(Layout)
    itemCtrlContainer: Layout

    tetrisManager: { [key: number]: Tetris } = {}

    // 帧数据
    curFrame: number = 0;
    preFrameTime: number = 0;
    frameList: OnFrame[] = [];


    public onOpen(fromUI: number, ...args) {
        super.onOpen(fromUI, ...args);
        oo.log.logView(args, "UIControl.onOpen");
        oo.event.addEventListener("onFrame", this.onFrame, this);
        let tableInfo = args[0] as TableInfo;
        let room: Room = tableInfo.room;
        this.title.string = room.name
        oo.random.setSeed(tableInfo.randSeed);
        oo.res.load([`Prefab/${room.prefab}`, "Prefab/Tetris", "Prefab/ItemCtrl"], Prefab, (err: Error | null, prefabs: Prefab[]) => {
            if (err) {
                oo.log.logView(err, "加载失败");
                return;
            }

            // 添加布局
            let parent: Node = instantiate(prefabs[0]);
            this.node.addChild(parent);

            // 初始化每个tetris
            let [i, j, my] = [1, 1, tableInfo.players[oo.storage.getUser()]];
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
                let tNode: Node = instantiate(prefabs[1]);
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
                this.initItemCtrl(prefabs[2], player, tetris);

                // 保存每个tetris对象
                this.tetrisManager[uid] = tetris;
            }
            this.notifyResProgress();
        });
    }

    notifyResProgress() {
        oo.log.logView("", "res.ok");
        channel.gameNotify("r.loadres", LoadRes.encode({current: 100}).finish());
    }

    onDestroy() {
        super.onDestroy();
        oo.event.removeEventListener("onFrame", this.onFrame, this);
    }

    initItemCtrl(prefab: Prefab, player: TableInfo_Player, tetris: Tetris) {
        let btn = instantiate(prefab);
        btn.getComponent(Sprite).color = tetris.colorArray[player.teamId];
        btn.getChildByName("Label").getComponent(Label).string = `T/${player.teamId}`;
        btn.on("click", () => {
            if (this.my.player.isEnd) {
                return;
            }
            let children = this.itemContainer.node.children;
            if (children.length > 0) {
                let node = children[0];
                let block: Block = node.getComponent("Block") as Block;
                let [to, from, val] = [player.profile?.userId, oo.storage.getUser(), block.getValue()];
                oo.log.logView(`player from ${from} send item controller to ${to} value ${block.getValue()}`);
                this.serialize(block.getItem(), [val], to, from);
                this.itemContainer.node.removeChild(node);
            }
        }, this);
        this.itemCtrlContainer.node.addChild(btn)
    }

    initTetris(player: TableInfo_Player, tetris: Tetris) {
        tetris.onAdded({
            uid: player.profile?.userId,
            isMy: player.profile?.userId === oo.storage.getUser(),
            teamId: player.teamId,
        });
        // 玩家的所有事件
        ['nextPiece', 'pos', 'end', 'matrix', 'score', 'combo', 'combo_3', 'combo_4'].forEach(key => {
            let from = oo.storage.getUser() == tetris.player.uid ? 0 : tetris.player.uid;
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
                                let valList = oo.random.getRandomByMinMaxList(0, 11, val);
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
                        if (tetris.player.uid === oo.storage.getUser()) {
                            // oo.log.logView( val,"item");
                            let node: Node = instantiate(tetris.block);
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
    unserialize(tetris: Tetris, msg: OnFrame_Player) {
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
                        randList = oo.random.getRandomByMinMaxList(0, 11, 2);
                    }
                    let blockNode = instantiate(to.block);
                    let blockScript = blockNode.getComponent("Block") as Block;
                    blockScript.drawValue(value);
                    this.node.addChild(blockNode);
                    let sourcePos = source.getPosition();
                    blockNode.setPosition(new Vec3(
                        sourcePos.x,
                        sourcePos.y - source.getComponent(UITransform).height / 2,
                        sourcePos.z
                    ));

                    oo.log.logView(`player receive item from ${from.player.uid} to ${to.player.uid} value ${value}
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

    process(frame: OnFrame) {
        // 第一帧，初始化tetirs
        if (frame.frameId == 0) {
            for (const [uid, t] of Object.entries(this.tetrisManager)) {
                t.player.pieceList = frame.pieceList;
                t.player.reset();
            }
        } else {
            frame.playerList.forEach((player: OnFrame_Player) => {
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
            val = oo.random.getRandomInt(0, 1) == 0 ? val : -val;
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
