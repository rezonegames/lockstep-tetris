import {_decorator, Component, Sprite, SpriteFrame} from 'cc';

const {ccclass, property} = _decorator;

@ccclass
export class Block extends Component {

    @property(Sprite)
    bgSprite: Sprite

    @property(Sprite)
    itemSprite: Sprite

    value: number
    color: number
    item: number

    // 图片
    @property([SpriteFrame])
    spriteArray: SpriteFrame[] = [];

    drawValue(value: number) {
        this.value = value;
        if (value > 1000) {
            let [color, item] = [Math.floor(value / 1000), Math.floor(value % 1000)];
            this.bgSprite.spriteFrame = this.spriteArray[color];
            this.itemSprite.node.active = true;
            this.itemSprite.spriteFrame = this.spriteArray[item];
            this.color = color;
            this.item = item;
        } else {
            this.bgSprite.spriteFrame = this.spriteArray[value];
            this.itemSprite.node.active = false;
            this.itemSprite.spriteFrame = null;
            this.color = value;
            this.item = 0;
        }
    }

    drawNull() {
        this.bgSprite.spriteFrame = null;
        this.itemSprite.spriteFrame = null;
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

