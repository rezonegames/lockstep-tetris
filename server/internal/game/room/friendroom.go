package room

import (
	"errors"
	"fmt"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/session"
	"tetris/internal/game/util"
	"tetris/proto/proto"
	"time"
)

type FriendRoom struct {
	*Room
}

func (f *FriendRoom) CreateTable(s *session.Session, tableId, password string) (util.TableEntity, error) {
	var (
		opt = &util.TableOption{
			Room:          f,
			Password:      password,
			CustomTableId: fmt.Sprintf("%s:%s", f.roomId, tableId),
		}
		table util.TableEntity
		err   error
	)

	if _, ok := f.tables[opt.CustomTableId]; ok {
		return nil, errors.New("table already exist!!")
	}

	table = NewTable(opt)

	err = table.Join(s)
	if err != nil {
		return nil, err
	}

	err = table.SitDown(s, 0, password)
	if err != nil {
		return nil, err
	}

	f.tables[opt.CustomTableId] = table

	return table, nil
}

func NewFriendRoom(opt *util.RoomOption) *FriendRoom {
	room := &FriendRoom{
		Room: NewNormalRoom(opt),
	}
	return room
}

func (f *FriendRoom) AfterInit() {
	f.Room.AfterInit()

	scheduler.NewTimer(1*time.Second, func() {
		// 最少10个桌子，方便加入
		count := len(f.tables)
		for i := 0; i < 10-count; i++ {
			var (
				tableId = fmt.Sprintf("%s:%d", f.roomId, i)
				opt     = &util.TableOption{
					Room:          f,
					SessionList:   nil,
					CustomTableId: tableId,
				}
			)

			if _, ok := f.tables[tableId]; ok {
				continue
			}

			t := NewTable(opt)
			f.tables[tableId] = t

			time.Sleep(10 * time.Millisecond)
		}
	})
}

func (f *FriendRoom) GetInfo() *proto.Room {
	var (
		roomInfo  = f.Room.GetInfo()
		tableList = make([]*proto.TableInfo, 0)
	)

	for _, v := range f.tables {
		tableList = append(tableList, v.GetInfo())
	}

	roomInfo.TableList = tableList

	return roomInfo
}
