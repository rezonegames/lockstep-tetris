package room

import (
	"fmt"
	"github.com/lonng/nano/session"
	"tetris/internal/game/util"
	"tetris/pkg/log"
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
		w = NewQuickWaiter(sList, room, table)
	default:
		panic(fmt.Sprintf("NewWaiter unknown room type %s", conf.RoomType))
	}
	w.AfterInit()
	return w
}

// NewTable 根据桌子类型创建道具桌还是正常桌
func NewTable(opt *util.TableOption) util.TableEntity {

	var (
		conf = opt.Room.GetConfig()
		t    util.TableEntity
	)

	switch conf.RoomType {
	case proto.RoomType_QUICK:
		t = NewQuickTable(opt)
		break

	case proto.RoomType_FRIEND:
		t = NewFriendTable(opt)
		break

	default:
		panic(fmt.Sprintf("NewTable unknown type %s", conf.RoomType))
	}
	t.AfterInit()

	log.Info("table %s start", opt.CustomTableId)
	return t
}

// NewRoom 根据房间类型创建房间
func NewRoom(opt *util.RoomOption) util.RoomEntity {
	var (
		conf = opt.Config
		r    util.RoomEntity
	)

	switch conf.RoomType {
	case proto.RoomType_QUICK:
		r = NewQuickRoom(opt)
		break

	case proto.RoomType_FRIEND:
		r = NewFriendRoom(opt)
		break

	default:
		panic(fmt.Sprintf("NewRoom unknown type %s", conf.RoomType))
	}

	log.Info(conf.Dump())
	r.AfterInit()
	return r
}
