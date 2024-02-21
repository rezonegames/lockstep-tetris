package util

import (
	"github.com/lonng/nano/session"
	"tetris/config"
	"tetris/proto/proto"
)

type RoomOption struct {
	Config *config.Room
}
type RoomEntity interface {
	AfterInit()
	BeforeShutdown()
	Format(format string, v ...interface{}) string
	Leave(s *session.Session) error
	Join(s *session.Session) error
	CreateTable(s *session.Session, tableId, password string) (TableEntity, error)
	GetConfig() *config.Room
	OnTableDeleted(tableId string)
	BackToWait(sList []*session.Session)
	Entity(tableId string) (TableEntity, error)
	GetInfo() *proto.Room
}

type TableOption struct {
	Room          RoomEntity
	CustomTableId string
	SessionList   []*session.Session
	Password      string
}
type TableEntity interface {
	AfterInit()
	GetTableId() string
	Format(format string, v ...interface{}) string
	GetInfo() *proto.TableInfo
	WaiterEntity() WaiterEntity
	Entity(uid int64) ClientEntity
	ChangeState(state proto.TableState)

	// 协议
	Ready(s *session.Session) error
	LoadRes(s *session.Session, msg *proto.LoadRes) error
	Update(s *session.Session, msg *proto.UpdateFrame) error
	ResumeTable(s *session.Session, roundId int32, frameId int64) error
	StandUp(s *session.Session) error
	SitDown(s *session.Session, seatId int32, password string) error
	KickUser(s *session.Session, kickUser int64) error
}

type WaiterOption struct {
	SessionList []*session.Session
	Room        RoomEntity
	Table       TableEntity
}
type WaiterEntity interface {
	Ready(s *session.Session) error
	CancelReady(s *session.Session)
	Leave(s *session.Session) error
	CheckAndDismiss()
	GetInfo() *proto.TableInfo_Waiter
	AfterInit()
	ResetWaiter()
}

type ClientOption struct {
	S      *session.Session
	TeamId int32
	SeatId int32
}
type ClientEntity interface {
	GetPlayer() *proto.TableInfo_Player
	GetSession() *session.Session
	GetResProgress() int32
	Reconnect(s *session.Session, lastFrameId int64)
	SetResProgress(progress int32)
	GetUserId() int64
	GetTeamId() int32
	IsGameOver() bool
	ResetClient()
	GetSeatId() int32
	SetSeatId(seatId int32)

	// 帧相关的数据
	SaveFrame(frameId int64, msg *proto.UpdateFrame)
	GetFrame(frameId int64) []*proto.Action
	SetLastFrame(frameId int64)
	GetLastFrame() int64
}
