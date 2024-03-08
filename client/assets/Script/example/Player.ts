import {EventTarget} from "cc";
import {Arena} from "db://assets/Script/example/Arena";
import {Core} from "db://assets/Script/core/Core";
import {ActionType} from "db://assets/Script/example/proto/consts";

export class Player {

    uid: number
    teamId: number
    pos: { x: number, y: number } // 位置
    matrix: Array<number>[] // 方块形状及位置

    score: number // 分数
    arena: Arena // arena
    events = new EventTarget; // 事件
    pieceList: number[]; // 在第1帧的时候初始化
    index: number;
    combo: number; // 连击
    disturbBuff: boolean; // 干扰buff
    isEnd: boolean
    pieces
    colorMap
    dropCounter

    constructor(arena: Arena, uid: number, teamId: number) {
        this.pos = {x: 0, y: 0};
        this.score = 0;
        this.arena = arena;
        this.uid = uid;
        this.index = 0;
        this.combo = 0;
        this.teamId = teamId;
        // 方块
        this.pieces = 'ILJOTSZ';
        this.colorMap = {
            'T': 8,
            'O': 2,
            'L': 3,
            'J': 4,
            'I': 5,
            'S': 6,
            'Z': 7,
        };
        this.isEnd = false;
        this.dropCounter = 0;
    }

    createPiece(type) {
        let v = this.colorMap[type];
        if (type === 'T') {
            return [
                [0, 0, 0],
                [v, v, v],
                [0, v, 0],
            ];
        } else if (type === 'O') {
            return [
                [v, v],
                [v, v],
            ];
        } else if (type === 'L') {
            return [
                [0, v, 0],
                [0, v, 0],
                [0, v, v],
            ];
        } else if (type === 'J') {
            return [
                [0, v, 0],
                [0, v, 0],
                [v, v, 0],
            ];
        } else if (type === 'I') {
            return [
                [0, v, 0, 0],
                [0, v, 0, 0],
                [0, v, 0, 0],
                [0, v, 0, 0],
            ];
        } else if (type === 'S') {
            return [
                [0, v, v],
                [v, v, 0],
                [0, 0, 0],
            ];
        } else if (type === 'Z') {
            return [
                [v, v, 0],
                [0, v, v],
                [0, 0, 0],
            ];
        }
    }

    drop(): boolean {
        this.pos.y++;
        if (this.arena.collide(this)) {
            this.pos.y--;
            this.arena.merge(this);
            this.reset();
            let score = this.arena.sweep();
            this.checkCombo(score);
            this.score += score
            this.events.emit('score', this.score);
            return false;
        }
        this.events.emit('pos', this.pos);
        return true;
    }

    addDisturbBuff(second: number) {
        this.disturbBuff = true;
        setTimeout(() => {
            this.disturbBuff = false;
        }, second * 1000)
    }

    boom(valList: Array<number>) {
        this.arena.setMatrix(valList)
    }

    delRow() {
        this.arena.unshift();
    }

    addRow(valList: Array<number>) {
        this.arena.push(valList);
        if (this.arena.collide(this)) {
            if (this.pos.y > 0) {
                this.pos.y--
            }
            this.events.emit("pos", this.pos);
        }
    }

    checkCombo(score: number) {
        if (score == 0) {
            this.combo = 0;
            return;
        }
        this.combo++;
        if (score == 70) {
            this.events.emit('combo_3', 4);
        } else if (score == 150) {
            this.events.emit('combo_4', 6);
        } else if (this.combo >= 2) {
            this.events.emit('combo', 2);
        }
    }

    dropDown() {
        while (this.drop()) {
        }
    }

    move(dir) {
        this.pos.x += dir;
        if (this.arena.collide(this)) {
            this.pos.x -= dir;
            return;
        }
        this.events.emit('pos', this.pos);
    }

    getNextPiece() {
        let index = this.pieceList[this.index];
        return this.createPiece(this.pieces[index]);
    }

    randomCreateItem(piece, matrix: Array<number>[]) {
        const [h, w] = [matrix.length, matrix[0].length];
        let [i, j] = [Core.random.getRandomInt(0, h, 1), Core.random.getRandomInt(0, w, 1)];
        if (matrix[i][j] != 0) {
            let v = this.colorMap[piece] * 1000
            matrix[i][j] = v + Core.random.getRandomByObjectList([
                // ActionType.ITEM_BOOM,
                // ActionType.ITEM_BUFF_DISTURB,
                ActionType.ITEM_ADD_ROW,
                ActionType.ITEM_DEL_ROW,
            ], 1)[0]
        }
        return matrix;
    }

    reset() {
        let index = this.pieceList[this.index];
        let piece = this.pieces[index];
        this.matrix = this.randomCreateItem(piece, this.createPiece(piece));
        this.index++;
        if (this.index > this.pieceList.length - 1) {
            this.index = 0;
        }
        this.pos.y = 0;
        this.pos.x = (this.arena.matrix[0].length / 2 | 0) -
            (this.matrix[0].length / 2 | 0);
        this.events.emit('pos', this.pos);
        this.events.emit('nextPiece', 0);
        // todo：结束的判断需要调整
        if (this.arena.collide(this)) {
            this.isEnd = true
            this.events.emit('end', null);
        }
    }

    rotate(dir: number) {
        const pos = this.pos.x;
        let offset = 1;
        this._rotateMatrix(this.matrix, dir);
        while (this.arena.collide(this)) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.matrix[0].length) {
                this._rotateMatrix(this.matrix, -dir);
                this.pos.x = pos;
                return;
            }
        }
        this.events.emit('matrix', this.matrix);
    }

    _rotateMatrix(matrix: Array<number>[], dir: number) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    update(deltaTime)
    {
        if(this.isEnd) {
            return;
        }
        this.dropCounter += deltaTime;
        if (this.dropCounter > 1000) {
            this.drop();
            this.dropCounter = 0;
        }
    }

}