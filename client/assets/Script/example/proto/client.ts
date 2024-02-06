/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { ActionType, GameState, ItemType, TableState } from "./consts.js";
import { ErrorCode } from "./error.js";

export const protobufPackage = "proto";

export interface Ping {
}

export interface Pong {
  ts: number;
}

export interface LoginToGame {
  userId: number;
}

export interface Item {
  key: ItemType;
  val: number;
}

export interface Profile {
  name: string;
  userId: number;
  itemList: Item[];
  updatedAt: number;
}

export interface LoginToGameResp {
  code: ErrorCode;
  profile: Profile | undefined;
  roomList: Room[];
  roomId: string;
  tableId: string;
}

export interface RegisterGameReq {
  name: string;
  accountId: string;
}

export interface Room {
  roomId: string;
  seatCount: number;
  name: string;
  minCoin: number;
  prefab: string;
}

export interface GetRoomListResp {
  code: ErrorCode;
  roomList: Room[];
}

export interface Join {
  roomId: string;
}

export interface JoinResp {
  code: ErrorCode;
}

export interface Leave {
  roomId: string;
  force: boolean;
}

export interface LeaveResp {
  code: ErrorCode;
  roomList: Room[];
}

export interface Ready {
}

export interface ReadyResp {
  code: ErrorCode;
}

export interface LoadRes {
  current: number;
}

export interface LoadResResp {
  code: ErrorCode;
}

export interface ResumeTable {
  frameId: number;
}

export interface ResumeRoom {
}

/** 在每一个步骤，下发游戏状态 */
export interface GameStateResp {
  code: ErrorCode;
  errMsg: string;
  state: GameState;
  tableInfo: TableInfo | undefined;
  roomList: Room[];
  roomId: string;
}

export interface Action {
  key: ActionType;
  valList: number[];
  to: number;
  from: number;
}

export interface UpdateFrame {
  action: Action | undefined;
}

export interface OnFrame {
  frameId: number;
  frameTime: number;
  playerList: OnFrame_Player[];
  /** 只有第一帧的时候返回500个 */
  pieceList: number[];
}

export interface OnFrame_Player {
  userId: number;
  actionList: Action[];
}

export interface OnFrameList {
  frameList: OnFrame[];
}

/** 下发桌子信息 */
export interface TableInfo {
  tableId: string;
  tableState: TableState;
  players: { [key: number]: TableInfo_Player };
  loseTeams: { [key: number]: number };
  waiter: TableInfo_Waiter | undefined;
  res: TableInfo_Res | undefined;
  room: Room | undefined;
  randSeed: number;
  /** 结算本局时用的 */
  playerItems: { [key: number]: OnItemChange };
}

/** 桌子上的玩家 */
export interface TableInfo_Player {
  teamId: number;
  end: boolean;
  score: number;
  profile: Profile | undefined;
}

/** 桌子等待 */
export interface TableInfo_Waiter {
  readys: { [key: number]: number };
  countDown: number;
}

export interface TableInfo_Waiter_ReadysEntry {
  key: number;
  value: number;
}

/** 用于资源检查 */
export interface TableInfo_Res {
  players: { [key: number]: number };
  countDown: number;
}

export interface TableInfo_Res_PlayersEntry {
  key: number;
  value: number;
}

export interface TableInfo_PlayersEntry {
  key: number;
  value: TableInfo_Player | undefined;
}

export interface TableInfo_LoseTeamsEntry {
  key: number;
  value: number;
}

export interface TableInfo_PlayerItemsEntry {
  key: number;
  value: OnItemChange | undefined;
}

/** 道具变化 */
export interface OnItemChange {
  itemList: Item[];
  reason: string;
  To: number;
}

function createBasePing(): Ping {
  return {};
}

export const Ping = {
  encode(_: Ping, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Ping {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePing();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBasePong(): Pong {
  return { ts: 0 };
}

export const Pong = {
  encode(message: Pong, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.ts !== 0) {
      writer.uint32(8).int64(message.ts);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Pong {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePong();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.ts = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseLoginToGame(): LoginToGame {
  return { userId: 0 };
}

export const LoginToGame = {
  encode(message: LoginToGame, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.userId !== 0) {
      writer.uint32(8).int64(message.userId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoginToGame {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLoginToGame();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.userId = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseItem(): Item {
  return { key: 0, val: 0 };
}

export const Item = {
  encode(message: Item, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.val !== 0) {
      writer.uint32(16).int32(message.val);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Item {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseItem();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.val = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseProfile(): Profile {
  return { name: "", userId: 0, itemList: [], updatedAt: 0 };
}

export const Profile = {
  encode(message: Profile, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.userId !== 0) {
      writer.uint32(16).int64(message.userId);
    }
    for (const v of message.itemList) {
      Item.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.updatedAt !== 0) {
      writer.uint32(80).int64(message.updatedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Profile {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProfile();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.userId = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.itemList.push(Item.decode(reader, reader.uint32()));
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.updatedAt = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseLoginToGameResp(): LoginToGameResp {
  return { code: 0, profile: undefined, roomList: [], roomId: "", tableId: "" };
}

export const LoginToGameResp = {
  encode(message: LoginToGameResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    if (message.profile !== undefined) {
      Profile.encode(message.profile, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.roomList) {
      Room.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.roomId !== "") {
      writer.uint32(34).string(message.roomId);
    }
    if (message.tableId !== "") {
      writer.uint32(42).string(message.tableId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoginToGameResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLoginToGameResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.profile = Profile.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.roomList.push(Room.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.tableId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseRegisterGameReq(): RegisterGameReq {
  return { name: "", accountId: "" };
}

export const RegisterGameReq = {
  encode(message: RegisterGameReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.accountId !== "") {
      writer.uint32(18).string(message.accountId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RegisterGameReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRegisterGameReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.accountId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseRoom(): Room {
  return { roomId: "", seatCount: 0, name: "", minCoin: 0, prefab: "" };
}

export const Room = {
  encode(message: Room, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.seatCount !== 0) {
      writer.uint32(16).int32(message.seatCount);
    }
    if (message.name !== "") {
      writer.uint32(26).string(message.name);
    }
    if (message.minCoin !== 0) {
      writer.uint32(32).int32(message.minCoin);
    }
    if (message.prefab !== "") {
      writer.uint32(42).string(message.prefab);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Room {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRoom();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.seatCount = reader.int32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.name = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.minCoin = reader.int32();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.prefab = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseGetRoomListResp(): GetRoomListResp {
  return { code: 0, roomList: [] };
}

export const GetRoomListResp = {
  encode(message: GetRoomListResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    for (const v of message.roomList) {
      Room.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetRoomListResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetRoomListResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.roomList.push(Room.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseJoin(): Join {
  return { roomId: "" };
}

export const Join = {
  encode(message: Join, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Join {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseJoin();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseJoinResp(): JoinResp {
  return { code: 0 };
}

export const JoinResp = {
  encode(message: JoinResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): JoinResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseJoinResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseLeave(): Leave {
  return { roomId: "", force: false };
}

export const Leave = {
  encode(message: Leave, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.force === true) {
      writer.uint32(16).bool(message.force);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Leave {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLeave();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.force = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseLeaveResp(): LeaveResp {
  return { code: 0, roomList: [] };
}

export const LeaveResp = {
  encode(message: LeaveResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    for (const v of message.roomList) {
      Room.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LeaveResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLeaveResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.roomList.push(Room.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseReady(): Ready {
  return {};
}

export const Ready = {
  encode(_: Ready, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Ready {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReady();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseReadyResp(): ReadyResp {
  return { code: 0 };
}

export const ReadyResp = {
  encode(message: ReadyResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReadyResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReadyResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseLoadRes(): LoadRes {
  return { current: 0 };
}

export const LoadRes = {
  encode(message: LoadRes, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.current !== 0) {
      writer.uint32(8).int32(message.current);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoadRes {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLoadRes();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.current = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseLoadResResp(): LoadResResp {
  return { code: 0 };
}

export const LoadResResp = {
  encode(message: LoadResResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LoadResResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLoadResResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseResumeTable(): ResumeTable {
  return { frameId: 0 };
}

export const ResumeTable = {
  encode(message: ResumeTable, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.frameId !== 0) {
      writer.uint32(8).int64(message.frameId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ResumeTable {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResumeTable();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.frameId = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseResumeRoom(): ResumeRoom {
  return {};
}

export const ResumeRoom = {
  encode(_: ResumeRoom, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ResumeRoom {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResumeRoom();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseGameStateResp(): GameStateResp {
  return { code: 0, errMsg: "", state: 0, tableInfo: undefined, roomList: [], roomId: "" };
}

export const GameStateResp = {
  encode(message: GameStateResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).int32(message.code);
    }
    if (message.errMsg !== "") {
      writer.uint32(18).string(message.errMsg);
    }
    if (message.state !== 0) {
      writer.uint32(24).int32(message.state);
    }
    if (message.tableInfo !== undefined) {
      TableInfo.encode(message.tableInfo, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.roomList) {
      Room.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.roomId !== "") {
      writer.uint32(58).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GameStateResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGameStateResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.errMsg = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.state = reader.int32() as any;
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.tableInfo = TableInfo.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.roomList.push(Room.decode(reader, reader.uint32()));
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseAction(): Action {
  return { key: 0, valList: [], to: 0, from: 0 };
}

export const Action = {
  encode(message: Action, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    writer.uint32(18).fork();
    for (const v of message.valList) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.to !== 0) {
      writer.uint32(24).int64(message.to);
    }
    if (message.from !== 0) {
      writer.uint32(32).int64(message.from);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Action {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = reader.int32() as any;
          continue;
        case 2:
          if (tag === 16) {
            message.valList.push(reader.int32());

            continue;
          }

          if (tag === 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.valList.push(reader.int32());
            }

            continue;
          }

          break;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.to = longToNumber(reader.int64() as Long);
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.from = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseUpdateFrame(): UpdateFrame {
  return { action: undefined };
}

export const UpdateFrame = {
  encode(message: UpdateFrame, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.action !== undefined) {
      Action.encode(message.action, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UpdateFrame {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateFrame();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.action = Action.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseOnFrame(): OnFrame {
  return { frameId: 0, frameTime: 0, playerList: [], pieceList: [] };
}

export const OnFrame = {
  encode(message: OnFrame, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.frameId !== 0) {
      writer.uint32(8).int64(message.frameId);
    }
    if (message.frameTime !== 0) {
      writer.uint32(16).int64(message.frameTime);
    }
    for (const v of message.playerList) {
      OnFrame_Player.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    writer.uint32(34).fork();
    for (const v of message.pieceList) {
      writer.int32(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnFrame {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnFrame();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.frameId = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.frameTime = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.playerList.push(OnFrame_Player.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag === 32) {
            message.pieceList.push(reader.int32());

            continue;
          }

          if (tag === 34) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.pieceList.push(reader.int32());
            }

            continue;
          }

          break;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseOnFrame_Player(): OnFrame_Player {
  return { userId: 0, actionList: [] };
}

export const OnFrame_Player = {
  encode(message: OnFrame_Player, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.userId !== 0) {
      writer.uint32(8).int64(message.userId);
    }
    for (const v of message.actionList) {
      Action.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnFrame_Player {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnFrame_Player();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.userId = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.actionList.push(Action.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseOnFrameList(): OnFrameList {
  return { frameList: [] };
}

export const OnFrameList = {
  encode(message: OnFrameList, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.frameList) {
      OnFrame.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnFrameList {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnFrameList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.frameList.push(OnFrame.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo(): TableInfo {
  return {
    tableId: "",
    tableState: 0,
    players: {},
    loseTeams: {},
    waiter: undefined,
    res: undefined,
    room: undefined,
    randSeed: 0,
    playerItems: {},
  };
}

export const TableInfo = {
  encode(message: TableInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tableId !== "") {
      writer.uint32(10).string(message.tableId);
    }
    if (message.tableState !== 0) {
      writer.uint32(16).int32(message.tableState);
    }
    Object.entries(message.players).forEach(([key, value]) => {
      TableInfo_PlayersEntry.encode({ key: key as any, value }, writer.uint32(26).fork()).ldelim();
    });
    Object.entries(message.loseTeams).forEach(([key, value]) => {
      TableInfo_LoseTeamsEntry.encode({ key: key as any, value }, writer.uint32(34).fork()).ldelim();
    });
    if (message.waiter !== undefined) {
      TableInfo_Waiter.encode(message.waiter, writer.uint32(42).fork()).ldelim();
    }
    if (message.res !== undefined) {
      TableInfo_Res.encode(message.res, writer.uint32(50).fork()).ldelim();
    }
    if (message.room !== undefined) {
      Room.encode(message.room, writer.uint32(58).fork()).ldelim();
    }
    if (message.randSeed !== 0) {
      writer.uint32(64).int64(message.randSeed);
    }
    Object.entries(message.playerItems).forEach(([key, value]) => {
      TableInfo_PlayerItemsEntry.encode({ key: key as any, value }, writer.uint32(74).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tableId = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.tableState = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          const entry3 = TableInfo_PlayersEntry.decode(reader, reader.uint32());
          if (entry3.value !== undefined) {
            message.players[entry3.key] = entry3.value;
          }
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          const entry4 = TableInfo_LoseTeamsEntry.decode(reader, reader.uint32());
          if (entry4.value !== undefined) {
            message.loseTeams[entry4.key] = entry4.value;
          }
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.waiter = TableInfo_Waiter.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.res = TableInfo_Res.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.room = Room.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.randSeed = longToNumber(reader.int64() as Long);
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          const entry9 = TableInfo_PlayerItemsEntry.decode(reader, reader.uint32());
          if (entry9.value !== undefined) {
            message.playerItems[entry9.key] = entry9.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_Player(): TableInfo_Player {
  return { teamId: 0, end: false, score: 0, profile: undefined };
}

export const TableInfo_Player = {
  encode(message: TableInfo_Player, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.teamId !== 0) {
      writer.uint32(8).int32(message.teamId);
    }
    if (message.end === true) {
      writer.uint32(16).bool(message.end);
    }
    if (message.score !== 0) {
      writer.uint32(24).int32(message.score);
    }
    if (message.profile !== undefined) {
      Profile.encode(message.profile, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_Player {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_Player();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.teamId = reader.int32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.end = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.score = reader.int32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.profile = Profile.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_Waiter(): TableInfo_Waiter {
  return { readys: {}, countDown: 0 };
}

export const TableInfo_Waiter = {
  encode(message: TableInfo_Waiter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.readys).forEach(([key, value]) => {
      TableInfo_Waiter_ReadysEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    if (message.countDown !== 0) {
      writer.uint32(16).int32(message.countDown);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_Waiter {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_Waiter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = TableInfo_Waiter_ReadysEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.readys[entry1.key] = entry1.value;
          }
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.countDown = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_Waiter_ReadysEntry(): TableInfo_Waiter_ReadysEntry {
  return { key: 0, value: 0 };
}

export const TableInfo_Waiter_ReadysEntry = {
  encode(message: TableInfo_Waiter_ReadysEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int64(message.key);
    }
    if (message.value !== 0) {
      writer.uint32(16).int64(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_Waiter_ReadysEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_Waiter_ReadysEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.value = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_Res(): TableInfo_Res {
  return { players: {}, countDown: 0 };
}

export const TableInfo_Res = {
  encode(message: TableInfo_Res, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.players).forEach(([key, value]) => {
      TableInfo_Res_PlayersEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    if (message.countDown !== 0) {
      writer.uint32(16).int32(message.countDown);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_Res {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_Res();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = TableInfo_Res_PlayersEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.players[entry1.key] = entry1.value;
          }
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.countDown = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_Res_PlayersEntry(): TableInfo_Res_PlayersEntry {
  return { key: 0, value: 0 };
}

export const TableInfo_Res_PlayersEntry = {
  encode(message: TableInfo_Res_PlayersEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int64(message.key);
    }
    if (message.value !== 0) {
      writer.uint32(16).int32(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_Res_PlayersEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_Res_PlayersEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.value = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_PlayersEntry(): TableInfo_PlayersEntry {
  return { key: 0, value: undefined };
}

export const TableInfo_PlayersEntry = {
  encode(message: TableInfo_PlayersEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int64(message.key);
    }
    if (message.value !== undefined) {
      TableInfo_Player.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_PlayersEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_PlayersEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = TableInfo_Player.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_LoseTeamsEntry(): TableInfo_LoseTeamsEntry {
  return { key: 0, value: 0 };
}

export const TableInfo_LoseTeamsEntry = {
  encode(message: TableInfo_LoseTeamsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.value !== 0) {
      writer.uint32(16).int64(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_LoseTeamsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_LoseTeamsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = reader.int32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.value = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseTableInfo_PlayerItemsEntry(): TableInfo_PlayerItemsEntry {
  return { key: 0, value: undefined };
}

export const TableInfo_PlayerItemsEntry = {
  encode(message: TableInfo_PlayerItemsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int64(message.key);
    }
    if (message.value !== undefined) {
      OnItemChange.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TableInfo_PlayerItemsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTableInfo_PlayerItemsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = longToNumber(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = OnItemChange.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

function createBaseOnItemChange(): OnItemChange {
  return { itemList: [], reason: "", To: 0 };
}

export const OnItemChange = {
  encode(message: OnItemChange, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.itemList) {
      Item.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.reason !== "") {
      writer.uint32(18).string(message.reason);
    }
    if (message.To !== 0) {
      writer.uint32(24).int64(message.To);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnItemChange {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnItemChange();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.itemList.push(Item.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.reason = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.To = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },
};

declare const self: any | undefined;
declare const window: any | undefined;
declare const global: any | undefined;
const tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
