/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal.js";
import { AccountType } from "./consts.js";
import { ErrorCode } from "./error.js";

export const protobufPackage = "proto";

export interface AccountLoginReq {
  partition: AccountType;
  accountId: string;
}

export interface AccountLoginResp {
  code: ErrorCode;
  userId: number;
  addr: string;
  name: string;
}

function createBaseAccountLoginReq(): AccountLoginReq {
  return { partition: 0, accountId: "" };
}

export const AccountLoginReq = {
  encode(message: AccountLoginReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.partition !== 0) {
      writer.uint32(8).int32(message.partition);
    }
    if (message.accountId !== "") {
      writer.uint32(18).string(message.accountId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AccountLoginReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAccountLoginReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.partition = reader.int32() as any;
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

function createBaseAccountLoginResp(): AccountLoginResp {
  return { code: 0, userId: 0, addr: "", name: "" };
}

export const AccountLoginResp = {
  encode(message: AccountLoginResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(40).int32(message.code);
    }
    if (message.userId !== 0) {
      writer.uint32(8).int64(message.userId);
    }
    if (message.addr !== "") {
      writer.uint32(18).string(message.addr);
    }
    if (message.name !== "") {
      writer.uint32(26).string(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AccountLoginResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAccountLoginResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 5:
          if (tag !== 40) {
            break;
          }

          message.code = reader.int32() as any;
          continue;
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

          message.addr = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.name = reader.string();
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
