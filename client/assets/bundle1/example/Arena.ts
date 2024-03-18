import {EventTarget} from "cc";
import {Player} from "db://assets/bundle1/example/Player";
import {ActionType} from "db://assets/bundle1/example/proto/consts";

export class Arena {

    matrix: Array<number>[]
    events = new EventTarget;

    constructor(w: number, h: number) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        this.matrix = matrix;
    }

    clear() {
        this.matrix.forEach(row => row.fill(0));
        this.events.emit('matrix', this.matrix);
    }

    collide(player: Player): boolean {
        return this._collideMatrix(player.matrix, player.pos);
    }

    _collideMatrix(matrix: Array<number>[], pos: { x: number, y: number }): boolean {
        const [m, o] = [matrix, pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (this.matrix[y + o.y] &&
                        this.matrix[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    merge(player: Player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.matrix[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
        this.events.emit('matrix', this.matrix);
    }

    sweep() {
        let rowCount = 1;
        let score = 0;
        outer: for (let y = this.matrix.length - 1; y > 0; --y) {
            for (let x = 0; x < this.matrix[y].length; ++x) {
                if (this.matrix[y][x] === 0) {
                    continue outer;
                }
            }
            const deleteRow = this.matrix.splice(y, 1)[0];

            // Game.log.logView(deleteRow, "sweep");
            deleteRow.forEach((v)=>{
                let [color, item] = [Math.floor(v/1000), Math.floor(v%1000)];
                if([ActionType.ITEM_ADD_ROW,
                    ActionType.ITEM_DEL_ROW].indexOf(item) !== -1) {
                    this.events.emit("item", v);
                }
            })
            const row = deleteRow.fill(0);
            this.matrix.unshift(row);
            ++y;

            score += rowCount * 10;
            rowCount *= 2;
        }
        this.events.emit('matrix', this.matrix);
        return score;
    }

    push(valList: Array<number>) {
        let row: Array<number> = []
        for (let i = 0; i < this.matrix[0].length; i++) {
            let v = valList.indexOf(i) !== -1 ? 0 : 2;
            row.push(v);
        }
        this.matrix.push(row);
        this.matrix.splice(0, 1);
        this.events.emit('matrix', this.matrix);
    }

    unshift() {
        const row = this.matrix.splice(this.matrix.length - 1, 1)[0].fill(0);
        this.matrix.unshift(row);
        this.events.emit('matrix', this.matrix);
    }

    setMatrix(valList: Array<number>) {
        for (let i = 0; i < valList.length; i += 3) {
            const [y, x, val] = [valList[i], valList[i + 1], valList[i + 2]];
            this.matrix[y][x] = val;
        }
    }
}