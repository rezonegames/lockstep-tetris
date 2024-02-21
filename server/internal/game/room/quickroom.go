package room

import (
	"fmt"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/session"
	"sync"
	"tetris/internal/game/util"
	"tetris/pkg/log"
	"tetris/pkg/z"
	"tetris/proto/proto"
	"time"
)

type QuickRoom struct {
	*Room
	lock    sync.RWMutex
	waitMap map[int64]int64
}

func NewQuickRoom(opt *util.RoomOption) *QuickRoom {
	room := &QuickRoom{
		Room:    NewNormalRoom(opt),
		waitMap: make(map[int64]int64, 0),
	}
	return room
}

func (r *QuickRoom) AfterInit() {
	r.Room.AfterInit()

	// 处理玩家加入队列
	scheduler.NewTimer(time.Second, func() {
		r.lock.Lock()
		defer r.lock.Unlock()

		pvp := int(r.config.Pvp)
		ok := len(r.waitMap) >= pvp
		for ok {
			sList := make([]*session.Session, 0)
			for k, _ := range r.waitMap {
				s, err := r.group.Member(k)
				if err == nil {
					sList = append(sList, s)
				}
				delete(r.waitMap, k)
				if len(sList) >= pvp {
					// 开启一个桌子
					r.WaitReady(sList)
					break
				}
			}
			ok = len(r.waitMap) >= pvp
		}
	})
}

// WaitReady 准备就绪后，进入确认界面，所有玩家都点击确认以后，才开始游戏
func (r *QuickRoom) WaitReady(sList []*session.Session) {
	var (
		now     = z.NowUnixMilli()
		tableId = fmt.Sprintf("%s:%d", r.roomId, now)
		err     error
	)
	table := NewTable(&util.TableOption{
		Room:          r,
		SessionList:   sList,
		CustomTableId: tableId,
	})
	r.tables[tableId] = table

	scheduler.NewAfterTimer(100*time.Millisecond, func() {
		for i, v := range sList {
			err = table.SitDown(v, int32(i), "")
			if err != nil {
				panic(table.Format("[WaitReady] sit down error %+v", err))
			}
		}
	})

}

func (r *QuickRoom) BackToWait(sList []*session.Session) {
	for _, v := range sList {
		var (
			uid = v.UID()
			now = z.NowUnix()
			err error
		)
		r.waitMap[uid] = now
		err = r.Join(v)
		if err != nil {
			log.Error(r.Format("[BackToWait] err %+v", err))
			continue
		}
		log.Info(r.Format("[BackToWait] %d", uid))
	}
}

func (r *QuickRoom) Leave(s *session.Session) error {
	r.lock.Lock()
	defer r.lock.Unlock()

	var (
		uid = s.UID()
		err error
	)

	// 从队列中删除
	defer delete(r.waitMap, uid)

	err = r.Room.Leave(s)
	if err != nil {
		return err
	}

	return nil
}

func (r *QuickRoom) Join(s *session.Session) error {
	r.lock.Lock()
	defer r.lock.Unlock()

	var (
		err error
		now = z.NowUnixMilli()
		uid = s.UID()
	)

	err = r.Room.Join(s)
	if err != nil {
		return err
	}
	// 加入队列
	r.waitMap[uid] = now

	return s.Push("onState", &proto.GameStateResp{
		State: proto.GameState_WAIT,
	})
}
