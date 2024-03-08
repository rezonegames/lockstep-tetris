import {HttpRequest} from "./network/HttpRequest";
import {Logger} from "./common/Logger";
import {RandomManager} from "./common/RandomManager";
import {StorageManager} from "./common/StorageManager"
import {NetManager} from "./network/NetManager"
import {resLoader} from "db://assets/Script/core/res/ResLoader";
import {EventMgr} from "db://assets/Script/core/common/EventManager";
import {ResUtil} from "db://assets/Script/core/res/ResUtil";

export class Core {
    static log = Logger;
    static http: HttpRequest = new HttpRequest();
    static random = RandomManager.instance;
    static storage: StorageManager = new StorageManager();
    static tcp: NetManager = new NetManager();
    static event = EventMgr;
    static res = resLoader;
    static resUtil = ResUtil;
}