/* eslint-disable */

export const protobufPackage = "proto";

/** 该结构与consts结构一样，客户端服务器共用，只要定义就不能改变 */
export enum AccountType {
  DEVICEID = 0,
  WX = 1,
  FB = 2,
  GIT = 3,
  UNRECOGNIZED = -1,
}

/** 暂时这样，以后拆出来，游戏内状态和游戏外状态 todo： */
export enum GameState {
  /** IDLE - 在房间里 */
  IDLE = 0,
  WAIT = 1,
  /** INGAME - 已分到桌子 */
  INGAME = 2,
  LOGOUT = 3,
  UNRECOGNIZED = -1,
}

export enum TableState {
  STATE_NONE = 0,
  WAITREADY = 1,
  CANCEL = 2,
  CHECK_RES = 3,
  GAMING = 4,
  SETTLEMENT = 5,
  ABORT = 6,
  UNRECOGNIZED = -1,
}

export enum RoomType {
  ROOMTYPE_NONE = 0,
  QUICK = 1,
  FRIEND = 2,
  MATCH = 3,
  UNRECOGNIZED = -1,
}

export enum ActionType {
  ACTIONTYPE_NONE = 0,
  FRAME_ONE = 1,
  MOVE = 2,
  ROTATE = 3,
  DROP = 4,
  QUICK_DROP = 5,
  /** ITEM_BOOM - 道具，客户端用 */
  ITEM_BOOM = 9,
  ITEM_BUFF_DISTURB = 10,
  ITEM_ADD_ROW = 11,
  ITEM_DEL_ROW = 12,
  END = 100,
  UNRECOGNIZED = -1,
}

export enum ItemType {
  COIN = 0,
  UNRECOGNIZED = -1,
}
