/* eslint-disable */

export const protobufPackage = "proto";

export enum ErrorCode {
  None = 0,
  OK = 200,
  DBError = 1,
  UnknownError = 2,
  ParameterError = 3,
  AccountIdError = 4,
  AlreadyInRoom = 5,
  TableDismissError = 6,
  RoomDismissError = 7,
  JoinError = 8,
  LeaveError = 9,
  SitDownError = 10,
  StandUpErrpr = 11,
  CreateTableError = 12,
  KickUserError = 13,
  LeaveTableError = 14,
  JoinTableError = 15,
  UNRECOGNIZED = -1,
}
