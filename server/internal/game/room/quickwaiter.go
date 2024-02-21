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

type QuickWaiter struct {
	readys      map[int64]int64
	sessions    map[int64]*session.Session
	room        util.RoomEntity
	table       util.TableEntity
	timeCounter int32
	countDown   int32
	stime       *scheduler.Timer
	leaves      map[int64]bool
}

func (w *QuickWaiter) ResetWaiter() {
	//TODO implement me
	return
}

func (w *QuickWaiter) CancelReady(s *session.Session) {
	//TODO implement me
	return
}

// NewQuickWaiter 类似王者荣耀的waiter
func NewQuickWaiter(opt *util.WaiterOption) *QuickWaiter {

	var (
		room  = opt.Room
		table = opt.Table
		sList = opt.SessionList
	)
	waiter := &QuickWaiter{
		room:      room,
		table:     table,
		readys:    make(map[int64]int64, 0),
		sessions:  make(map[int64]*session.Session, 0),
		countDown: 30,
		leaves:    make(map[int64]bool, 0),
	}

	for _, v := range sList {
		var uid = v.UID()
		waiter.sessions[uid] = v
	}

	return waiter
}

func (w *QuickWaiter) AfterInit() {
	w.stime = scheduler.NewCountTimer(time.Second, int(w.countDown), func() {
		w.timeCounter++
		// 都准备好了或者又离开的，解散waiter
		w.CheckAndDismiss()
	})
}

// Dismiss 解散
func (w *QuickWaiter) CheckAndDismiss() {
	// 中途有离开或者10秒倒计时有玩家没有准备，返回到队列
	if len(w.readys) == len(w.sessions) {
		log.Debug(w.table.Format("waiter done"))
		w.table.ChangeState(proto.TableState_CHECK_RES)

	} else if (w.timeCounter >= w.countDown && len(w.readys) < len(w.sessions)) || len(w.leaves) > 0 {
		log.Debug(w.table.Format("waiter dismiss"))

		var bList = make([]*session.Session, 0)
		// 已经ready的，或者没有退出的，在某个人退出的时候，重新把玩家拉回
		for k, v := range w.sessions {

			var (
				back       = false
				_, isLeave = w.leaves[k]
				_, isReady = w.readys[k]
			)

			if isReady {
				back = true
			} else if len(w.leaves) > 0 && !isLeave {
				back = true
			}

			if back {
				bList = append(bList, v)
			}
		}

		w.table.ChangeState(proto.TableState_CANCEL)

		scheduler.NewAfterTimer(100*time.Millisecond, func() {
			// todo：注意这个最后执行，有个时间差
			w.room.BackToWait(bList)
		})

	} else {
		// 倒计时
		w.table.ChangeState(proto.TableState_WAITREADY)
		return
	}
	w.sessions = make(map[int64]*session.Session, 0)
	w.stime.Stop()
}

func (w *QuickWaiter) GetInfo() *proto.TableInfo_Waiter {
	return &proto.TableInfo_Waiter{
		Readys:    w.readys,
		CountDown: w.countDown - w.timeCounter,
	}
}

// Ready 准备
func (w *QuickWaiter) Ready(s *session.Session) error {
	uid := s.UID()
	w.readys[uid] = z.NowUnix()
	w.table.ChangeState(proto.TableState_WAITREADY)
	return nil
}

func (w *QuickWaiter) Leave(s *session.Session) error {
	var uid = s.UID()
	delete(w.readys, uid)
	w.leaves[uid] = true
	return nil
}
