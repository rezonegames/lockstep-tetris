import {_decorator, Component, Sprite, SpriteFrame, Label} from 'cc';
import {ActionType} from "db://assets/Script/example/proto/consts";

const {ccclass, property} = _decorator;

@ccclass
export class Block extends Component {

    @property(Sprite)
    bgSprite: Sprite

    @property(Label)
    itemLabel: Label

    value: number
    color: number
    item: number

    // 图片
    @property([SpriteFrame])
    spriteArray: SpriteFrame[] = [];

    drawValue(value: number) {
        this.value = value;
        if (value > 1000) {
            let [color, item, str] = [Math.floor(value / 1000), Math.floor(value % 1000), ""];
            this.bgSprite.spriteFrame = this.spriteArray[color];
            switch (item) {
                case ActionType.ITEM_ADD_ROW:
                    str = "+1";
                    break;
                case ActionType.ITEM_DEL_ROW:
                    str = "-1";
                    break;
            }
            this.itemLabel.string = str;
            this.itemLabel.node.active = true;
            this.color = color;
            this.item = item;
        } else {
            this.bgSprite.spriteFrame = this.spriteArray[value];
            this.itemLabel.node.active = false;
            this.color = value;
            this.item = 0;
        }
    }

    drawNull() {
        this.bgSprite.spriteFrame = null;
        this.itemLabel.node.active = false;
    }

    drawShadow() {
        this.bgSprite.spriteFrame = this.spriteArray[1];
    }

    getColor(): number {
        return this.color;
    }

    getItem(): number {
        return this.item;
    }

    getValue(): number {
        return this.value;
    }

}

