import {_decorator, Component, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, Widget, UITransform, Color} from 'cc';
import {Arena} from "db://assets/Script/example/Arena";
import {Player} from "db://assets/Script/example/Player";
import {Block} from "db://assets/Script/example/Block";

const {ccclass, property} = _decorator;

@ccclass('Tetris')
export class Tetris extends Component {

    // 方块
    @property(Prefab)
    block: Prefab

    // 图片
    @property([SpriteFrame])
    spriteArray: SpriteFrame[]

    // canvas
    @property(Node)
    canvas: Node

    // canvas上所有的节点
    @property(Node)
    itemArray: Node[][] = [];

    // top
    @property(Widget)
    top: Widget

    // 区域
    arena: Arena

    // player
    player: Player

    // 分数
    @property(Label)
    score: Label

    // 下一个方块
    @property(Node)
    nextArray: Node[][] = [];

    @property(Node)
    next: Node
    nextMatrix: Array<number>[]

    // 背景颜色
    @property([Color])
    colorArray: Color[] = [];

    // tetris属性
    config: { w: number, h: number, bw: number, bh: number } = {
        w: 12,
        h: 20,
        bw: 28,
        bh: 28,
    };

    begin
    isMy

    updateScore(score: number) {
        this.score.string = `分数：${score}`;
    }

    onAdded(args: any) {
        // 创建
        this.isMy = args.isMy;
        this.arena = new Arena(this.config.w, this.config.h);
        this.player = new Player(this.arena, args.uid, args.teamId);
        this.begin = true;
    }

    start() {
        // 背景颜色
        this.getComponent(Sprite).color = this.colorArray[this.player.teamId];
        const matrix = this.arena.matrix;
        const [w, h, bw, bh] = [this.config.w * this.config.bw, this.config.h * this.config.bh, this.config.bw, this.config.bh];
        matrix.forEach((row, y) => {
            this.itemArray[y] = []
            row.forEach((value, x) => {
                let item: Node = instantiate(this.block);
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
            this.nextArray[y] = []
            row.forEach((value, x) => {
                let item: Node = instantiate(this.block);
                item.getComponent(UITransform).setContentSize(bw1, bh1)
                this.next.addChild(item);
                item.setPosition(-w1 / 2 + x * bw1 + bw1 / 2, h1 / 2 - (y + 1) * bh1 + bh1 / 2);
                this.nextArray[y][x] = item;
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
                this.nextArray[y][x].getComponent(Sprite).spriteFrame = null;
            });
        });
        const matrix = this.player.getNextPiece();
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value != 0) {
                    let block: Block = this.getBlockScript(this.itemArray[y][x]);
                    block.drawValue(value);
                }
            });
        });
    }

}

