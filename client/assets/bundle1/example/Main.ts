import {Component, _decorator} from "cc";
import {Game} from "db://assets/bundle1/example/Game";


const {ccclass} = _decorator;

@ccclass
export default class UIMain extends Component {


    onLoad() {
    }

    start() {
        Game.initGame();
    }
}
