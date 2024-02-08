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
	Leave(s *session.Session) error
	Join(s *session.Session) error
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
}
type TableEntity interface {
	AfterInit()
	GetTableId() string
	GetInfo() *proto.TableInfo
	BackToTable()
	WaiterEntity() WaiterEntity
	Entity(uid int64) ClientEntity
	ChangeState(state proto.TableState)

	// 协议
	Ready(s *session.Session) error
	LoadRes(s *session.Session, msg *proto.LoadRes) error
	Update(s *session.Session, msg *proto.UpdateFrame) error
	ResumeTable(s *session.Session, msg *proto.ResumeTable) error
	Leave(s *session.Session) error
	Join(s *session.Session, tableId string) error
}

type WaiterEntity interface {
	Ready(s *session.Session) error
	Leave(s *session.Session) error
	CheckAndDismiss()
	GetInfo() *proto.TableInfo_Waiter
	AfterInit()
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

	// 帧相关的数据
	SaveFrame(frameId int64, msg *proto.UpdateFrame)
	GetFrame(frameId int64) []*proto.Action
	SetLastFrame(frameId int64)
	GetLastFrame() int64
}
