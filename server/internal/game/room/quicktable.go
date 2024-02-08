package room

import (
	"fmt"
	"github.com/lonng/nano"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/session"
	"sync"
	"tetris/config"
	"tetris/internal/game/util"
	"tetris/models"
	"tetris/pkg/log"
	"tetris/pkg/z"
	"tetris/proto/proto"
	"time"
)

// 桌子
type QuickTable struct {
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
}

func NewQuickTable(opt *util.TableOption) *QuickTable {
	var (
		room    = opt.Room
		conf    = room.GetConfig()
		now     = z.NowUnixMilli()
		tableId = opt.CustomTableId
		sList   = opt.SessionList
	)

	t := &QuickTable{
		group:         nano.NewGroup(tableId),
		tableId:       tableId,
		clients:       make(map[int64]util.ClientEntity, 0),
		conf:          conf,
		loseTeams:     make(map[int32]int64, 0),
		teamGroupSize: conf.Pvp / conf.Divide,
		room:          room,
		begin:         z.GetTime(),
		end:           make(chan bool, 0),
		resCountDown:  100,
		randSeed:      now,
		pieceList:     make([]int32, 0),
		frameTimes:    make(map[int64]int64, 0),
	}

	for i := 0; i < 500; i++ {
		t.pieceList = append(t.pieceList, z.RandInt32(0, 6))
	}

	var teamId int32
	for i, v := range sList {
		uid := v.UID()
		if i > 0 && int32(i)%t.conf.Divide == 0 {
			teamId++
		}
		c := NewClient(v, teamId, t)
		t.clients[uid] = c
		t.Join(v, tableId)

		log.Info("player %d sit table %s seat %d", uid, tableId, teamId)
	}

	t.waiter = NewWaiter(sList, room, t)
	return t
}

// todo：关不掉
func (t *QuickTable) BackToTable() {
	t.ChangeState(proto.TableState_CHECK_RES)
}

func (t *QuickTable) AfterInit() {
	go t.Run()
}

func (t *QuickTable) Run() {
	// 帧
	ticker := time.NewTicker(33 * time.Millisecond)
	defer ticker.Stop()

	// 其它
	ticker1 := time.NewTicker(1 * time.Second)
	defer ticker1.Stop()

	for {
		select {

		case <-t.end:
			log.Info("clear table %s", t.tableId)

			switch t.state {
			case proto.TableState_WAITREADY:
				// waitready状态不需要处理房间的离开，因为要返回队列
				break
			default:
				for _, v := range t.clients {
					t.room.Leave(v.GetSession())
				}
			}
			t.resCountDown = 0

			// 通知房间释放table资源
			t.room.OnTableDeleted(t.tableId)
			return

		case <-ticker1.C:
			switch t.state {
			case proto.TableState_CHECK_RES:
				b := true
				for _, v := range t.clients {
					if v.GetResProgress() != 100 {
						b = false
					}
				}
				if b || t.resCountDown == 1 {
					t.ChangeState(proto.TableState_GAMING)
				}
				t.resCountDown--
				break
			}

		case <-ticker.C:
			switch t.state {
			case proto.TableState_GAMING:
				t.frameTimes[t.nextFrameId] = z.NowUnixMilli()
				for _, v := range t.clients {
					// 检查资源，如果资源没加载完，不发送游戏中的帧数据
					if v.GetResProgress() != 100 {
						continue
					}

					msg := &proto.OnFrameList{FrameList: make([]*proto.OnFrame, 0)}
					lastFrameId := v.GetLastFrame()

					var i int64
					for i = lastFrameId; i <= t.nextFrameId; i++ {

						frame := &proto.OnFrame{
							FrameId:    i,
							FrameTime:  t.frameTimes[i],
							PlayerList: make([]*proto.OnFrame_Player, 0),
						}

						if i == 0 {
							frame.PieceList = t.pieceList
						} else {
							for _, v := range t.clients {
								if al := v.GetFrame(i); len(al) > 0 {
									frame.PlayerList = append(frame.PlayerList, &proto.OnFrame_Player{
										UserId:     v.GetUserId(),
										ActionList: al,
									})
								}
							}
						}
						msg.FrameList = append(msg.FrameList, frame)
					}

					s := v.GetSession()
					if err := s.Push("onFrame", msg); err == nil {
						v.SetLastFrame(i)
					}

				}
				t.nextFrameId++
			}
			break
		}
	}
}

func (t *QuickTable) ChangeState(state proto.TableState) {
	t.state = state
	tableInfo := t.GetInfo()
	switch state {
	case proto.TableState_CHECK_RES:

		var (
			players = make(map[int64]int32, 0)
		)

		for k, v := range t.clients {
			players[k] = v.GetResProgress()
		}

		tableInfo.Res = &proto.TableInfo_Res{
			Players:   players,
			CountDown: t.resCountDown,
		}
		break

	case proto.TableState_SETTLEMENT:
		playerItems := make(map[int64]*proto.OnItemChange, 0)
		itemList := make([]*proto.Item, 0)
		itemList = append(itemList, &proto.Item{
			Key: proto.ItemType_COIN,
			Val: 1,
		})
		for k, v := range t.clients {
			if _, ok := t.loseTeams[v.GetTeamId()]; !ok {
				models.AddItems(k, itemList)
				playerItems[k] = &proto.OnItemChange{
					ItemList: itemList,
					Reason:   "win",
					To:       k,
				}
			}
		}
		tableInfo.PlayerItems = playerItems

		// 1s后结束，清理
		scheduler.NewAfterTimer(100*time.Millisecond, func() {
			t.Clear()
		})

		break
	// 游戏的过程中，中断了
	case proto.TableState_ABORT:
		t.Clear()
		return
	}
	t.group.Broadcast("onState", &proto.GameStateResp{
		State:     proto.GameState_INGAME,
		TableInfo: tableInfo,
	})
}

func (t *QuickTable) WaiterEntity() util.WaiterEntity {
	return t.waiter
}

func (t *QuickTable) Entity(uid int64) util.ClientEntity {
	return t.clients[uid]
}

func (t *QuickTable) Ready(s *session.Session) error {
	return t.waiter.Ready(s)
}

func (t *QuickTable) LoadRes(s *session.Session, msg *proto.LoadRes) error {
	var (
		uid      = s.UID()
		client   = t.Entity(uid)
		progress = msg.Current
	)

	client.SetResProgress(progress)
	log.Info("LoadRes down %d", s.UID())
	return nil
}

func (t *QuickTable) Update(s *session.Session, msg *proto.UpdateFrame) error {
	if t.state != proto.TableState_GAMING {
		return nil
	}

	uid := s.UID()
	// 有些操作可能是其它客户端上传的，因为掉线的玩家没有逻辑判断，输赢需要在线的玩家判断
	who := msg.Action.From
	if who != 0 {
		uid = who
	}

	c := t.Entity(uid)
	if c.IsGameOver() {
		return nil
	}
	c.SaveFrame(t.nextFrameId, msg)

	// 如果已经结束了，判断输赢
	if c.IsGameOver() {
		isTeamLose := true
		var loseCount int32
		teamId := c.GetTeamId()
		for _, v := range t.clients {
			if v.GetTeamId() == teamId {
				if !v.IsGameOver() {
					isTeamLose = false
				}
			}
		}
		log.Info("table %s team %d player %d is over", t.tableId, teamId, uid)
		if isTeamLose {
			loseCount++
			if _, ok := t.loseTeams[teamId]; !ok {
				t.loseTeams[teamId] = z.NowUnix()
			}
			t.ChangeState(proto.TableState_GAMING)
			log.Info("table %s team %d over", t.tableId, teamId)
		}

		if len(t.loseTeams) >= int(t.teamGroupSize-1) {
			t.ChangeState(proto.TableState_SETTLEMENT)
			log.Info("table %s round over", t.tableId)
		}
	}
	return nil
}

func (t *QuickTable) Clear() {
	t.group.Close()
	t.end <- true
}

func (t *QuickTable) Leave(s *session.Session) error {
	shouldLeaveTable := false
	switch t.state {
	case proto.TableState_STATE_NONE:
		fallthrough
	case proto.TableState_WAITREADY:
		t.waiter.Leave(s)
		shouldLeaveTable = true
		break
	case proto.TableState_SETTLEMENT:
		shouldLeaveTable = true
		break
	case proto.TableState_CHECK_RES:
		fallthrough
	case proto.TableState_GAMING:
		// 如果游戏过程中，只剩下一个人，要中断游戏，并清理桌子
		if t.group.Count() == 1 {
			t.ChangeState(proto.TableState_ABORT)
		} else {
			log.Info("%d leave table %s wait back", s.UID(), t.tableId)
		}
		break
	case proto.TableState_ABORT:
		shouldLeaveTable = true
		break
	}

	t.group.Leave(s)

	if shouldLeaveTable {
		models.RemoveTableId(s.UID())
		return nil
	}

	return z.OtherError{Msg: fmt.Sprintf("player cant leave for continue game...")}
}

func (t *QuickTable) Join(s *session.Session, tableId string) error {
	if err := models.SetTableId(s.UID(), tableId); err != nil {
		return err
	}
	return t.group.Add(s)
}

func (t *QuickTable) GetInfo() *proto.TableInfo {
	players := make(map[int64]*proto.TableInfo_Player, 0)
	for k, v := range t.clients {
		players[k] = v.GetPlayer()
	}
	return &proto.TableInfo{
		Players:    players,
		TableId:    t.tableId,
		TableState: t.state,
		LoseTeams:  t.loseTeams,
		Waiter:     t.waiter.GetInfo(),
		Room: &proto.Room{
			RoomId:  t.conf.RoomId,
			Pvp:     t.conf.Pvp,
			Name:    t.conf.Name,
			MinCoin: t.conf.MinCoin,
			Prefab:  t.conf.Prefab,
		},
		RandSeed: t.randSeed,
	}
}

func (t *QuickTable) GetTableId() string {
	return t.tableId
}

func (t *QuickTable) ResumeTable(s *session.Session, msg *proto.ResumeTable) error {
	var (
		uid         = s.UID()
		lastFrameId = msg.FrameId
	)
	err := t.group.Add(s)
	if err != nil {
		return err
	}
	client := t.Entity(uid)
	client.Reconnect(s, lastFrameId)
	return nil
}
