package room

import (
	"tetris/internal/game/util"
	"tetris/pkg/log"
)

// 桌子
type QuickTable struct {
	*Table
}

func NewQuickTable(opt *util.TableOption) *QuickTable {
	var (
		room  = opt.Room
		sList = opt.SessionList
	)

	table := &QuickTable{
		Table: NewNormalTable(opt),
	}

	table.waiter = NewWaiter(&util.WaiterOption{
		SessionList: sList,
		Room:        room,
		Table:       table,
	})

	return table
}

func (t *QuickTable) AfterInit() {
	t.Table.AfterInit()

	go func() {
		defer log.Info(t.Format("[AfterInit] chRoundOver"))

		for {
			select {
			case <-t.chRoundOver:
				t.chEnd <- true

				// 直接退出房间，等待重新加入
				for _, v := range t.clients {
					err := t.room.Leave(v.GetSession())
					if err != nil {
					}
				}
				return
			}
		}
	}()

}
