package room

import (
	"errors"
	"github.com/lonng/nano/session"
	"tetris/internal/game/util"
	"tetris/pkg/log"
)

type FriendTable struct {
	*Table
}

func NewFriendTable(opt *util.TableOption) *FriendTable {
	var (
		room = opt.Room
	)

	table := &FriendTable{
		Table: NewNormalTable(opt),
	}

	table.waiter = NewWaiter(&util.WaiterOption{
		Room:  room,
		Table: table,
	})

	return table
}

func (f *FriendTable) AfterInit() {
	f.Table.AfterInit()

	go func() {
		defer log.Info(f.Format("[AfterInit] chRoundOver"))

		for {
			select {
			case <-f.chRoundOver:
				// 清理，为下一局准备
				f.ResetTable()
			}
		}
	}()
}

func (f *FriendTable) KickUser(s *session.Session, kickUser int64) error {
	var (
		uid        = s.UID()
		client     = f.Entity(uid)
		kickClient = f.Entity(kickUser)
	)
	client = f.Entity(uid)
	if client.GetSeatId() != 0 {
		return errors.New("player permission error")
	}
	return f.StandUp(kickClient.GetSession())
}
