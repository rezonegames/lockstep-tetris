import {_decorator, Component, Label, Node, Prefab, Sprite, SpriteFrame, Widget, UITransform, Color} from 'cc';
import {Arena} from "db://assets/bundle1/example/Arena";
import {Player} from "db://assets/bundle1/example/Player";
import {Block} from "db://assets/bundle1/example/Block";
import {Game} from "db://assets/bundle1/example/Game";
import {GetTeamColor} from "db://assets/bundle1/example/Game";

const {ccclass, property} = _decorator;

@ccclass('Tetris')
export class Tetris extends Component {

    // tetris属性
    config: { w: number, h: number, bw: number, bh: number } = {
        w: 12,
        h: 20,
        bw: 28,
        bh: 28,
    };

    begin
    isMy

    @property(Prefab)
    blockPrefab: Prefab;

    // 区域
    arena: Arena

    // player
    player: Player

    // canvas方块
    @property(Node)
    canvas: Node
    itemArray: Node[][] = [];

    // top
    @property(Widget)
    top: Widget

    // 分数
    @property(Label)
    score: Label

    // 下一个方块
    @property(Node)
    next: Node
    nextArray: Node[][] = [];
    nextMatrix: Array<number>[];

    // info
    @property(Label)
    info: Label

    updateScore(score: number) {
        this.score.string = `分数：${score}`;
    }

    onAdded(args: any) {
        // 创建
        let {
            isMy,
            uid,
            teamId,
            name
        } = args;

        this.arena = new Arena(this.config.w, this.config.h);
        this.player = new Player(this.arena, uid, teamId, name);
        this.isMy = isMy;
        this.begin = true;
    }

    start() {

        this.info.string = `ID：${this.player.uid}
LEVEL：*****
NAME：${this.player.name}
        `;

        // 背景颜色
        this.getComponent(Sprite).color = GetTeamColor(this.player.teamId);
        const matrix = this.arena.matrix;
        const [w, h, bw, bh] = [this.config.w * this.config.bw, this.config.h * this.config.bh, this.config.bw, this.config.bh];
        matrix.forEach((row, y) => {
            this.itemArray[y] = []
            row.forEach((value, x) => {
                let item: Node = Game.resUtil.instantiate(this.blockPrefab);
                this.canvas.addChild(item);
                item.setPosition(-w / 2 + x * bw + bw / 2, h / 2 - (y + 1) * bh + bh / 2);
                this.itemArray[y][x] = item;
            })
        });

        // 下一个
        this.nextMatrix = [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
        const [w1, h1, bw1, bh1] = [this.config.bw / 2 * 4 + 4, this.config.bh / 2 * 4 + 4, this.config.bw / 2, this.config.bh / 2]
        this.nextMatrix.forEach((row, y) => {
            this.nextArray[y] = [];
            row.forEach((value, x) => {
                let item: Node = Game.resUtil.instantiate(this.blockPrefab);
                item.getComponent(UITransform).setContentSize(bw1, bh1)
                this.next.addChild(item);
                item.setPosition(-w1 / 2 + x * bw1 + bw1 / 2, h1 / 2 - (y + 1) * bh1 + bh1 / 2);
                this.nextArray[y][x] = item;

                item.setScale(0.5, 0.5);
            })
        });

        this.updateScore(0);
    }

    getBlockScript(node: Node): Block {
        let block: Block = node.getComponent("Block") as Block;
        return block;
    }

    draw() {
        this.fillNull(this.arena.matrix);
        this.drawMatrix(this.arena.matrix, {x: 0, y: 0});
        if (this.isMy) {
            this.drawShadowMatrix();
        }
        this.drawMatrix(this.player.matrix, this.player.pos);
    }

    fillNull(matrix) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                let block: Block = this.getBlockScript(this.itemArray[y][x]);
                block.drawNull();
            });
        });
    }

    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value != 0) {
                    const [oy, ox] = [y + offset.y, x + offset.x];
                    if (oy > this.config.h - 1 || oy < 0 || ox > this.config.w - 1 || ox < 0) {
                        return;
                    }
                    let block: Block = this.getBlockScript(this.itemArray[y + offset.y][x + offset.x]);
                    block.drawValue(value);
                }
            });
        });
    }

    // 画影子
    drawShadowMatrix() {
        let matrix = this.player.matrix;
        let offset = {x: this.player.pos.x, y: this.player.pos.y};
        while (!this.arena._collideMatrix(this.player.matrix, offset)) {
            offset.y++;
        }
        offset.y--

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value != 0) {
                    const [oy, ox] = [y + offset.y, x + offset.x];
                    if (oy > this.config.h - 1 || oy < 0 || ox > this.config.w - 1 || ox < 0) {
                        return;
                    }
                    let block: Block = this.getBlockScript(this.itemArray[y + offset.y][x + offset.x]);
                    block.drawShadow();
                }
            });
        });
    }

    // 画下一个
    drawNextMatrix() {
        this.nextMatrix.forEach((row, y) => {
            row.forEach((value, x) => {
                let block: Block = this.getBlockScript(this.nextArray[y][x]);
                block.drawNull();
            });
        });
        const matrix = this.player.getNextPiece();
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value != 0) {
                    let block: Block = this.getBlockScript(this.nextArray[y][x]);
                    block.drawValue(value);
                }
            });
        });
    }

}

