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
import {Game} from "db://assets/Script/example/Game";
import {Tetris} from "db://assets/Script/example/Tetris";
import {ActionType} from "db://assets/Script/example/proto/consts";

import {Block} from "db://assets/Script/example/Block";
import {GetTeamColor} from "db://assets/Script/example/Game";

const {ccclass, property} = _decorator;

@ccclass('UIControl')
export default class UIControl extends UIView {

    @property(Prefab)
    blockPrefab: Prefab;

    @property(Prefab)
    tetrisPrefab: Prefab;

    @property([Prefab])
    layoutPrefabList: Prefab[] = [];

    // 自己的控制脚本
    private my: Tetris

    @property(Label)
    private title: Label

    // 存放道具的容器
    @property(Layout)
    itemContainer: Layout

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
        Game.event.addEventListener("onFrame", this.onFrame, this);
        let tableInfo = args[0] as TableInfo;
        let room: Room = tableInfo.room;
        this.title.string = room.name
        Game.random.setSeed(tableInfo.randSeed);
        Game.log.logView(args, "UIControl.onOpen");
        // 添加布局
        let layoutPrefab = this.layoutPrefabList.filter((prefab) => prefab.name == room.prefab)[0]
        let parent: Node = Game.resUtil.instantiate(layoutPrefab);
        this.node.addChild(parent);

        // 初始化每个tetris
        let [i, j, my] = [1, 1, tableInfo.players[Game.storage.getUser()]];
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
            container.getComponent(Sprite).spriteFrame = null;

            let tNode: Node = Game.resUtil.instantiate(this.tetrisPrefab);
            let tetris: Tetris = tNode.getComponent(Tetris);
            this.initTetris(player, tetris);

            if (containerName == "my") {
                this.my = tetris;
            } else {
                let scale = container.getComponent(UITransform).width * 1.0 / 500;
                tNode.setScale(scale, scale);
            }

            container.addChild(tNode);

            // 发送道具的按钮
            // this.initItemCtrl(player);

            // 保存每个tetris对象
            this.tetrisManager[uid] = tetris;
        }
        this.notifyResProgress();

    }

    notifyResProgress() {
        Game.log.logView("", "res.ok");
        Game.channel.gameNotify("r.loadres", LoadRes.encode({current: 100}).finish());
        Game.closeLoading();
    }

    onDestroy() {
        super.onDestroy();
        Game.event.removeEventListener("onFrame", this.onFrame, this);
    }

    // initItemCtrl(player: TableInfo_Player) {
    //     let btn = Game.resUtil.instantiate(this.itemCtrlPrefab);
    //     btn.getComponent(Sprite).color = GetTeamColor(player.teamId);
    //     btn.getChildByName("Label").getComponent(Label).string = `T/${player.teamId}`;
    //     btn.on("click", () => {
    //         if (this.my.player.isEnd) {
    //             return;
    //         }
    //         let children = this.itemContainer.node.children;
    //         if (children.length > 0) {
    //             let node = children[0];
    //             let block: Block = node.getComponent("Block") as Block;
    //             let [to, from, val] = [player.profile?.userId, Game.storage.getUser(), block.getValue()];
    //             Game.log.logView(`player from ${from} send item controller to ${to} value ${block.getValue()}`);
    //             this.serialize(block.getItem(), [val], to, from);
    //             this.itemContainer.node.removeChild(node);
    //         }
    //     }, this);
    //     this.itemCtrlContainer.node.addChild(btn)
    // }

    initTetris(player: TableInfo_Player, tetris: Tetris) {

        let [
            uid,
            teamId,
            name
        ] = [
            player.profile?.userId,
            player.teamId,
            player.profile?.name
        ]

        tetris.node.on(Node.EventType.TOUCH_END, () => {
            let [isMyEnd, myTeamId, myId] = [
                this.my.player.isEnd,
                this.my.player.teamId,
                this.my.player.uid
            ]
            if (isMyEnd) return;

            let isTeamMeta = teamId == myTeamId;
            let children = this.itemContainer.node.children;
            children.forEach((node) => {
                let [bSend, block] = [false, node.getComponent(Block)];

                switch (block.getItem()) {
                    case ActionType.ITEM_DEL_ROW:
                        if (isTeamMeta) bSend = true;
                        break;
                    case ActionType.ITEM_ADD_ROW:
                        if (!isTeamMeta) bSend = true;
                        break
                }

                if (bSend) {
                    let [to, from, val] = [uid, myId, block.getValue()];
                    Game.log.logView(`player from ${from} send item controller to ${to} value ${block.getValue()}`);
                    this.serialize(block.getItem(), [val], to, from);
                    this.itemContainer.node.removeChild(node);
                    return;
                }

            })

        }, this);


        tetris.onAdded({
            uid: uid,
            isMy: uid === Game.storage.getUser(),
            teamId,
            name,
        });
        // 玩家的所有事件
        ['nextPiece', 'pos', 'end', 'matrix', 'score', 'combo', 'combo_3', 'combo_4'].forEach(key => {
            let from = Game.storage.getUser() == tetris.player.uid ? 0 : tetris.player.uid;
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
                                let valList = Game.random.getRandomByMinMaxList(0, 11, val);
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
                        if (tetris.player.uid === Game.storage.getUser()) {
                            let node: Node = Game.resUtil.instantiate(this.blockPrefab);
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
        Game.channel.gameNotify("r.update", UpdateFrame.encode({action: {key: action, valList, from, to}}).finish());
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
                        randList = Game.random.getRandomByMinMaxList(0, 11, 2);
                    }
                    let blockNode: Node = Game.resUtil.instantiate(this.blockPrefab);
                    let blockScript = blockNode.getComponent("Block") as Block;
                    blockScript.drawValue(value);
                    this.node.addChild(blockNode);
                    let sourcePos = source.getPosition();
                    blockNode.setPosition(new Vec3(
                        sourcePos.x,
                        sourcePos.y - source.getComponent(UITransform).height / 2,
                        sourcePos.z
                    ));

                    Game.log.logView(`player receive item from ${from.player.uid} to ${to.player.uid} value ${value}
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
            val = Game.random.getRandomInt(0, 1) == 0 ? val : -val;
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
