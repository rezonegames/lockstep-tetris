package room

import (
	"github.com/google/uuid"
	"github.com/lonng/nano"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/session"
	"tetris/internal/game/util"
	"tetris/pkg/log"
	"tetris/pkg/z"
	"tetris/proto/proto"
	"time"
)

type QuickWaiter struct {
	uiid        string
	group       *nano.Group
	readys      map[int64]int64
	room        util.RoomEntity
	table       util.TableEntity
	timeCounter int32
	countDown   int32
	stime       *scheduler.Timer
	sList       []*session.Session
}

// NewWaiter返回错误代表有人下线了
func NewQuickWaiter(sList []*session.Session, room util.RoomEntity, table util.TableEntity) *QuickWaiter {
	uiid := uuid.New().String()
	w := &QuickWaiter{
		uiid:      uiid,
		group:     nano.NewGroup(uiid),
		room:      room,
		sList:     make([]*session.Session, 0),
		table:     table,
		readys:    make(map[int64]int64, 0),
		countDown: 30,
	}
	for _, v := range sList {
		w.group.Add(v)
	}
	w.sList = sList
	return w
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
	//log.Debug("CheckAndDismiss %d %d", len(w.readys), w.group.Count())
	hasLeave := w.group.Count() != len(w.sList)
	if len(w.readys) == len(w.sList) {
		log.Debug("waiter %s done ", w.table.GetTableId())
		w.table.BackToTable()
	} else if (w.timeCounter >= w.countDown && len(w.readys) < len(w.sList)) || hasLeave {
		log.Debug("waiter %s Dismiss", w.table.GetTableId())
		bList := make([]*session.Session, 0)
		for _, v := range w.sList {
			back := false
			if _, ok := w.readys[v.UID()]; ok {
				back = true
			} else {
				if hasLeave && w.group.Contains(v.UID()) {
					back = true
				}
			}
			w.table.Leave(v)
			if back {
				bList = append(bList, v)
			} else {
				w.room.Leave(v)
			}
		}
		w.room.BackToWait(bList)
	} else {
		w.table.ChangeState(proto.TableState_WAITREADY)
		return
	}
	w.group.Close()
	w.sList = make([]*session.Session, 0)
	w.stime.Stop()
}

//
// 返回等待信息
func (w *QuickWaiter) GetInfo() *proto.TableInfo_Waiter {
	return &proto.TableInfo_Waiter{
		Readys:    w.readys,
		CountDown: w.countDown - w.timeCounter,
	}
}

//
// Ready 准备
func (w *QuickWaiter) Ready(s *session.Session) error {
	uid := s.UID()
	if _, ok := w.readys[uid]; ok {
		return s.Response(&proto.ReadyResp{Code: proto.ErrorCode_OK})
	}
	w.readys[uid] = z.NowUnix()
	w.table.ChangeState(proto.TableState_WAITREADY)
	return s.Response(&proto.ReadyResp{Code: proto.ErrorCode_OK})
}

func (w *QuickWaiter) Leave(s *session.Session) error {
	delete(w.readys, s.UID())
	return w.group.Leave(s)
}
