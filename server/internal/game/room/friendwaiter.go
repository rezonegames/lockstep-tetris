package room

import (
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/session"
	"tetris/internal/game/util"
	"tetris/pkg/log"
	"tetris/pkg/z"
	"tetris/proto/proto"
	"time"
)

type FriendWaiter struct {
	readys map[int64]int64
	table  util.TableEntity
	stime  *scheduler.Timer
	room   util.RoomEntity
}

func (w *FriendWaiter) ResetWaiter() {
	//TODO implement me
	w.readys = make(map[int64]int64, 0)
}

func (w *FriendWaiter) CancelReady(s *session.Session) {
	//TODO implement me
	delete(w.readys, s.UID())
}

// NewFriendWaiter 返回错误代表有人下线了
func NewFriendWaiter(opt *util.WaiterOption) *FriendWaiter {
	var (
		table = opt.Table
		room  = opt.Room
	)

	waiter := &FriendWaiter{
		readys: make(map[int64]int64, 0),
		table:  table,
		room:   room,
	}
	return waiter
}

func (w *FriendWaiter) AfterInit() {
	w.stime = scheduler.NewTimer(time.Second, func() {
		w.CheckAndDismiss()
	})
}

// Dismiss 解散
func (w *FriendWaiter) CheckAndDismiss() {
	var (
		conf = w.room.GetConfig()
	)

	if int(conf.Pvp) == len(w.readys) {
		log.Debug(w.table.Format("waiter done"))
		w.table.ChangeState(proto.TableState_CHECK_RES)
	}
}

func (w *FriendWaiter) GetInfo() *proto.TableInfo_Waiter {
	return &proto.TableInfo_Waiter{
		Readys: w.readys,
	}
}

// Ready 准备
func (w *FriendWaiter) Ready(s *session.Session) error {
	uid := s.UID()
	w.readys[uid] = z.NowUnix()
	w.table.ChangeState(proto.TableState_WAITREADY)
	return nil
}

func (w *FriendWaiter) Leave(s *session.Session) error {
	delete(w.readys, s.UID())
	w.table.ChangeState(proto.TableState_WAITREADY)
	return nil
}
