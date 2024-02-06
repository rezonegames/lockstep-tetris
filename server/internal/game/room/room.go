package room

import (
	"fmt"
	"github.com/lonng/nano/session"
	"tetris/config"
	"tetris/internal/game/util"
	"tetris/proto/proto"
)

// NewWaiter 客户端类型，有可能是机器人，真人，以及结束方式可能不同，现在只有一种真人
func NewClient(s *session.Session, teamId int32, table util.TableEntity) util.ClientEntity {
	var c util.ClientEntity
	c = NewNormalClient(s, teamId, table)
	return c
}

// NewWaiter waiter是等待的方式，比如王者荣耀，斗地主满人就开，组队等待等等
func NewWaiter(sList []*session.Session, room util.RoomEntity, table util.TableEntity) util.WaiterEntity {
	var w util.WaiterEntity
	conf := room.GetConfig()
	switch conf.RoomType {
	case proto.RoomType_QUICK:
		w = NewNormalWaiter(sList, room, table)
	default:
		panic(fmt.Sprintf("NewWaiter unknown room type %s", conf.RoomType))
	}
	w.AfterInit()
	return w
}

// NewTable 根据桌子类型创建道具桌还是正常桌
func NewTable(room util.RoomEntity, ss []*session.Session) util.TableEntity {
	conf := room.GetConfig()
	var t util.TableEntity
	switch conf.TableType {
	case proto.TableType_NORMAL:
		t = NewNormalTable(room, ss)
	default:
		panic(fmt.Sprintf("NewTable unknown type %s", conf.TableType))
	}
	t.AfterInit()
	return t
}

// NewRoom 根据房间类型创建房间
func NewRoom(conf *config.Room) util.RoomEntity {
	var r util.RoomEntity
	switch conf.RoomType {
	case proto.RoomType_QUICK:
		r = NewQuickRoom(conf)
	default:
		panic(fmt.Sprintf("NewRoom unknown type %s", conf.RoomType))
	}
	r.AfterInit()
	return r
}
