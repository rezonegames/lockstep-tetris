package room

import (
	"fmt"
	"github.com/lonng/nano"
	"github.com/lonng/nano/session"
	"tetris/config"
	"tetris/internal/game/util"
	"tetris/models"
	"tetris/proto/proto"
)

type FriendRoom struct {
	group  *nano.Group
	config *config.Room
	tables map[string]util.TableEntity
	roomId string
}

func (f *FriendRoom) GetInfo() *proto.Room {
	var (
		roomInfo  = f.config.Conv2Proto()
		tableList = make([]*proto.TableInfo, 0)
	)
	for _, v := range f.tables {
		tableList = append(tableList, v.GetInfo())
	}
	roomInfo.PlayerCount = int32(f.group.Count())
	roomInfo.TableList = tableList
	return roomInfo
}

func NewFriendRoom(opt *util.RoomOption) *FriendRoom {
	var (
		conf   = opt.Config
		roomId = conf.RoomId
	)

	return &FriendRoom{
		roomId: roomId,
		group:  nano.NewGroup(roomId),
		config: conf,
		tables: make(map[string]util.TableEntity, 0),
	}
}

func (f *FriendRoom) AfterInit() {
	// 创建10个桌子，方便加入
	for i := 0; i < 10; i++ {
		var (
			tableId = fmt.Sprintf("%s:%d", f.roomId, i)
			opt     = &util.TableOption{
				Room:          f,
				SessionList:   nil,
				CustomTableId: tableId,
			}
		)
		t := NewTable(opt)
		f.tables[tableId] = t
	}
}

func (f *FriendRoom) BeforeShutdown() {
	for _, uid := range f.group.Members() {
		models.RemoveRoundSession(uid)
	}
}

func (f *FriendRoom) Leave(s *session.Session) error {
	return nil
}

func (f *FriendRoom) Join(s *session.Session) error {
	//TODO implement me
	panic("implement me")
}

func (f *FriendRoom) GetConfig() *config.Room {
	//TODO implement me
	return f.config
}

func (f *FriendRoom) OnTableDeleted(tableId string) {
	//TODO implement me
	panic("implement me")
}

func (f *FriendRoom) BackToWait(sList []*session.Session) {
	//TODO implement me
	panic("implement me")
}

func (f *FriendRoom) Entity(tableId string) (util.TableEntity, error) {
	//TODO implement me
	panic("implement me")
}
