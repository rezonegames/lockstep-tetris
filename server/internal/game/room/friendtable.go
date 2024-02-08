package room

import (
	"github.com/lonng/nano"
	"github.com/lonng/nano/session"
	"sync"
	"tetris/config"
	"tetris/internal/game/util"
	"tetris/proto/proto"
	"time"
)

type FriendTable struct {
	group         *nano.Group
	tableId       string
	conf          *config.Room
	clients       map[int64]util.ClientEntity
	loseTeams     map[int32]int64
	teamGroupSize int32
	lock          sync.RWMutex
	waiter        util.WaiterEntity
	room          util.RoomEntity
	begin         time.Time
	state         proto.TableState
	end           chan bool
	nextFrameId   int64
	frameTimes    map[int64]int64
	randSeed      int64
	pieceList     []int32
	resCountDown  int32 // 检查资源是否加载成功
	res           map[int64]int32
}

func NewFriendTable(opt *util.TableOption) *FriendTable {

	return &FriendTable{}
}

func (f *FriendTable) AfterInit() {
	//TODO implement me
	//panic("implement me")
}

func (f *FriendTable) GetTableId() string {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) GetInfo() *proto.TableInfo {
	var (
		tableInfo = &proto.TableInfo{
			Players:    nil,
			TableId:    f.tableId,
			TableState: f.state,
			LoseTeams:  f.loseTeams,
			RandSeed:   f.randSeed,
		}
	)
	return tableInfo
}

func (f *FriendTable) BackToTable() {
	//TODO implement me
}

func (f *FriendTable) WaiterEntity() util.WaiterEntity {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) Entity(uid int64) util.ClientEntity {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) ChangeState(state proto.TableState) {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) Ready(s *session.Session) error {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) LoadRes(s *session.Session, msg *proto.LoadRes) error {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) Update(s *session.Session, msg *proto.UpdateFrame) error {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) ResumeTable(s *session.Session, msg *proto.ResumeTable) error {
	//TODO implement me
	panic("implement me")
}

func (f *FriendTable) Leave(s *session.Session) error {
	return nil
}

func (f *FriendTable) Join(s *session.Session, tableId string) error {
	//TODO implement me
	panic("implement me")
}
