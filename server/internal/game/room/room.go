package room

import (
	"fmt"
	"tetris/internal/game/util"
	"tetris/pkg/log"
	"tetris/proto/proto"
)

// NewClient 客户端类型，有可能是机器人，真人，以及结束方式可能不同，现在只有一种真人
func NewClient(opt *util.ClientOption) util.ClientEntity {
	var client util.ClientEntity
	client = NewNormalClient(opt)
	client.AfterInit()
	return client
}

// NewWaiter waiter是等待的方式，比如王者荣耀，斗地主满人就开，组队等待等等
func NewWaiter(opt *util.WaiterOption) util.WaiterEntity {
	var (
		room   = opt.Room
		conf   = room.GetConfig()
		waiter util.WaiterEntity
	)

	switch conf.RoomType {
	case proto.RoomType_QUICK:
		waiter = NewQuickWaiter(opt)
	case proto.RoomType_FRIEND:
		waiter = NewFriendWaiter(opt)
	default:
		panic(fmt.Sprintf("NewWaiter unknown room type %s", conf.RoomType))
	}
	waiter.AfterInit()
	return waiter
}

// NewTable 根据桌子类型创建道具桌还是正常桌
func NewTable(opt *util.TableOption) util.TableEntity {

	var (
		conf  = opt.Room.GetConfig()
		table util.TableEntity
	)

	switch conf.RoomType {
	case proto.RoomType_QUICK:
		table = NewQuickTable(opt)
		break

	case proto.RoomType_FRIEND:
		table = NewFriendTable(opt)
		break

	default:
		panic(fmt.Sprintf("NewTable unknown type %s", conf.RoomType))
	}
	table.AfterInit()

	log.Info(table.Format("[NewTable] start"))
	return table
}

// NewRoom 根据房间类型创建房间
func NewRoom(opt *util.RoomOption) util.RoomEntity {
	var (
		conf = opt.Config
		room util.RoomEntity
	)

	switch conf.RoomType {
	case proto.RoomType_QUICK:
		room = NewQuickRoom(opt)
		break

	case proto.RoomType_FRIEND:
		room = NewFriendRoom(opt)
		break

	default:
		panic(fmt.Sprintf("NewRoom unknown type %s", conf.RoomType))
	}

	log.Info(room.Format("[NewRoom] %s", conf.Dump()))
	room.AfterInit()
	return room
}
