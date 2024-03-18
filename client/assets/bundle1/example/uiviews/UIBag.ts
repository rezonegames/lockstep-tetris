import { _decorator } from "cc";
import { SpriteFrame } from "cc";
import { Sprite, Node } from "cc";
import {UIView} from "db://assets/core/ui/UIView";
import {uiManager} from "db://assets/core/ui/UIManager";
const {ccclass} = _decorator;

@ccclass
export default class UIBag extends UIView {
    private selectItem: SpriteFrame | null= null;
    private selectNode: Node | null = null;
    
    public init() {

    }

    public onClick(event : any) {
        if (this.selectNode) {
            this.selectNode.setScale(1, 1, 1);
        }

        let node : Node = event.target;
        this.selectNode = node;
        this.selectNode.setScale(1.5, 1.5, 1.5);

        let sprite = node.getComponent(Sprite);
        this.selectItem = sprite!.spriteFrame;
    }

    public onOkClick() {
        uiManager.close();
    }

    public onClose(): any {
        return this.selectItem;
    }
}
