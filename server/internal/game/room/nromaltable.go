package room

import (
	"errors"
	"fmt"
	"github.com/lonng/nano"
	"github.com/lonng/nano/scheduler"
	"github.com/lonng/nano/session"
	"math"
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
type Table struct {
	group         *nano.Group
	tableId       string
	conf          *config.Room
	clients       map[int64]util.ClientEntity
	loseTeams     map[int32]int64
	teamGroupSize int32
	lock          sync.RWMutex
	waiter        util.WaiterEntity
	room          util.RoomEntity
	state         proto.TableState
	chState       chan proto.TableState
	chRoundOver   chan bool
	chEnd         chan bool
	nextFrameId   int64
	frameTimes    map[int64]int64
	randSeed      int64
	pieceList     []int32
	resCountDown  int32 // 检查资源是否加载成功
	password      string
	seatTeam      map[int32]int32
	roundCounter  int32
	createTime    int64
	owner         int64 // 房主
}

func NewNormalTable(opt *util.TableOption) *Table {
	var (
		room     = opt.Room
		conf     = room.GetConfig()
		tableId  = opt.CustomTableId
		password = opt.Password
		teamId   int32
		i        int32
		now      = z.NowUnixMilli()
	)

	table := &Table{
		group:         nano.NewGroup(tableId),
		tableId:       tableId,
		clients:       make(map[int64]util.ClientEntity, 0),
		conf:          conf,
		teamGroupSize: conf.Pvp / conf.Divide,
		room:          room,
		createTime:    now,
		chState:       make(chan proto.TableState, 10),
		chRoundOver:   make(chan bool, 6),
		chEnd:         make(chan bool, 6),
		password:      password,
		seatTeam:      make(map[int32]int32, 0),
	}

	for i = 0; i < 6; i++ {
		if i > 0 && i%conf.Divide == 0 {
			teamId++
		}
		table.seatTeam[i] = teamId
	}

	return table
}

func (t *Table) ResetTable() {
	var (
		now = z.NowUnixMilli()
	)

	for _, v := range t.clients {
		v.ResetClient()
	}
	t.waiter.ResetWaiter()
	t.loseTeams = make(map[int32]int64, 0)
	t.resCountDown = 20
	t.randSeed = now
	t.pieceList = make([]int32, 0)
	t.frameTimes = make(map[int64]int64, 0)
	for i := 0; i < 500; i++ {
		t.pieceList = append(t.pieceList, z.RandInt32(0, 6))
	}
	t.ChangeState(proto.TableState_STATE_NONE)
	t.roundCounter++
}

func (t *Table) AfterInit() {
	t.ResetTable()
	go t.Run()
}

func (t *Table) Run() {
	defer log.Info(t.Format("[Run] dismiss!!!"))
	// 帧
	ticker := time.NewTicker(33 * time.Millisecond)
	defer ticker.Stop()

	// 其它
	ticker1 := time.NewTicker(1 * time.Second)
	defer ticker1.Stop()

	for {
		select {

		case <-t.chEnd:
			t.dismiss()
			return

		case state, ok := <-t.chState:
			if !ok {
				log.Error(t.Format("[Run] err for state"))
				return
			}

			t.setState(state)

		case <-ticker1.C:
			t.checkState()

		case <-ticker.C:
			t.broadcastFrame()
		}
	}
}

func (t *Table) checkState() {
	// 每秒执行一次的任务，
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
}

// dismiss 解散
func (t *Table) dismiss() {
	for _, v := range t.clients {
		var (
			uid = v.GetUserId()
			s   = v.GetSession()
			err error
		)
		err = t.Leave(s)
		if err != nil {
			log.Info(t.Format("[dismiss] player %d stand up err %+v", uid, err))
		}
	}
	t.resCountDown = 0

	// 通知房间释放table资源
	t.room.OnTableDeleted(t.tableId)
	err := t.group.Close()
	if err != nil {
	}
}

// broadcastFrame 推送帧数据
func (t *Table) broadcastFrame() {
	// 帧数据
	if t.state != proto.TableState_GAMING {
		return
	}

	t.frameTimes[t.nextFrameId] = z.NowUnixMilli()
	for _, v := range t.clients {
		// 检查资源，如果资源没加载完，不发送游戏中的帧数据
		if v.GetResProgress() != 100 {
			continue
		}

		msg := &proto.OnFrameList{FrameList: make([]*proto.Frame, 0)}
		lastFrameId := v.GetLastFrame()

		var i int64
		for i = lastFrameId; i <= t.nextFrameId; i++ {

			frame := &proto.Frame{
				FrameId:    i,
				FrameTime:  t.frameTimes[i],
				PlayerList: make([]*proto.Frame_Player, 0),
			}

			if i == 0 {
				frame.PieceList = t.pieceList
			} else {
				for _, v := range t.clients {
					if al := v.GetFrame(i); len(al) > 0 {
						frame.PlayerList = append(frame.PlayerList, &proto.Frame_Player{
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

func (t *Table) setState(state proto.TableState) {
	if state < t.state && state != proto.TableState_STATE_NONE {
		log.Error(t.Format("[setState] > new state %v error", state))
		return
	}

	t.state = state
	var (
		tableInfo = t.GetInfo()
		err       error
	)

	switch state {
	case proto.TableState_STATE_NONE:
		return

	case proto.TableState_WAITREADY:
		break

	case proto.TableState_CHECK_RES:
		// 下发每个玩家资源加载进度，用于界面展示
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
		// 结算，目前每赢一局，加一个金币
		var (
			playerItems = make(map[int64]*proto.OnItemChange, 0)
			itemList    = make([]*proto.Item, 0)
		)
		itemList = append(itemList, &proto.Item{
			Key: proto.ItemType_COIN,
			Val: 1,
		})
		for k, v := range t.clients {
			if _, ok := t.loseTeams[v.GetTeamId()]; !ok {
				err = models.AddItems(k, itemList)
				if err != nil {
					log.Error(t.Format("[setState] add item err %d", k))
					continue
				}
				playerItems[k] = &proto.OnItemChange{
					ItemList: itemList,
					Reason:   "win",
					To:       k,
				}
			}
		}
		tableInfo.PlayerItems = playerItems
		scheduler.NewAfterTimer(1000*time.Millisecond, func() {
			t.RoundOver()
		})

	case proto.TableState_CANCEL:
		// 在等待阶段，游戏被取消了
		fallthrough
	case proto.TableState_ABORT:
		// 游戏的过程中，中断了
		t.RoundOver()
		return
	}

	err = t.group.Broadcast("onState", &proto.OnGameState{
		State:     proto.GameState_INGAME,
		TableInfo: tableInfo,
	})
	if err != nil {
		log.Error(t.Format("[setState] broadcast state err %+v", err))
	}
}

// ChangeState 修改桌子状态，不能同时执行
func (t *Table) ChangeState(state proto.TableState) {
	t.chState <- state
}

func (t *Table) WaiterEntity() util.WaiterEntity {
	return t.waiter
}

func (t *Table) Entity(uid int64) util.ClientEntity {
	return t.clients[uid]
}

func (t *Table) Ready(s *session.Session) error {
	return t.waiter.Ready(s)
}

func (t *Table) LoadRes(s *session.Session, msg *proto.LoadRes) error {
	var (
		uid      = s.UID()
		client   = t.Entity(uid)
		progress = msg.Current
	)

	client.SetResProgress(progress)
	log.Info(t.Format("[LoadRes] down %d", s.UID()))
	return nil
}

func (t *Table) Update(s *session.Session, msg *proto.UpdateFrame) error {
	if t.state != proto.TableState_GAMING {
		return nil
	}

	var (
		uid = s.UID()
		who = msg.Action.From
	)

	if who != 0 {
		// 有些操作可能是其它客户端上传的，因为掉线的玩家没有逻辑判断，输赢需要在线的玩家判断
		uid = who
	}

	client := t.Entity(uid)
	if client.IsGameOver() {
		return nil
	}
	client.SaveFrame(t.nextFrameId, msg)

	if client.IsGameOver() {
		// 如果已经结束了，判断输赢
		var (
			isTeamLose = true
			myTeamId   = client.GetTeamId()
		)

		for _, v := range t.clients {
			if v.GetTeamId() == myTeamId {
				if !v.IsGameOver() {
					isTeamLose = false
				}
			}
		}
		log.Info(t.Format("[Update] team %d player %d is over", myTeamId, uid))

		if isTeamLose {
			if _, ok := t.loseTeams[myTeamId]; !ok {
				t.loseTeams[myTeamId] = z.NowUnix()
			}
			t.ChangeState(proto.TableState_GAMING)
			log.Info(t.Format("[Update] team %d over", myTeamId))
		}

		if len(t.loseTeams) >= int(t.teamGroupSize-1) {
			t.ChangeState(proto.TableState_SETTLEMENT)
		}
	}
	return nil
}

func (t *Table) Format(format string, v ...interface{}) string {
	var (
		tableId = t.tableId
	)
	format = fmt.Sprintf("[table %s state %v] ", tableId, t.state) + fmt.Sprintf(format, v...)
	return format
}

func (t *Table) RoundOver() {
	t.chRoundOver <- true
	//panic(t.Format("[RoundOver]"))
}

func (t *Table) GetSeatUser(seatId int32) (util.ClientEntity, bool) {

	for _, client := range t.clients {

		if client.GetSeatId() == seatId {
			return client, true
		}
	}

	return nil, false
}

// SelectOwner 选择帮主
func (t *Table) SelectOwner() {
	var (
		minJoinTime = math.MaxInt64
		ownerClient util.ClientEntity
	)

	for _, client := range t.clients {
		var joinTime = int(client.GetJoinTime())
		if joinTime < minJoinTime {
			minJoinTime = joinTime
			ownerClient = client
		}
	}
	if ownerClient != nil {
		t.owner = ownerClient.GetUserId()
		log.Info(t.Format("[SelectOwner] owner is %d", t.owner))
	}

}

// StandUp 在游戏中退出，要保证重连能继续，不能把所有的资源都删掉
func (t *Table) StandUp(s *session.Session) error {
	var (
		shouldLeaveTable = false
		uid              = s.UID()
	)

	log.Debug(t.Format("[StandUp] %d", uid))

	switch t.state {
	case proto.TableState_STATE_NONE:
		shouldLeaveTable = true
		break

	case proto.TableState_WAITREADY:
		t.waiter.Leave(s)
		shouldLeaveTable = true
		break

	case proto.TableState_CANCEL:
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
			log.Info(t.Format("[StandUp] %d wait back", uid))
		}
		break

	case proto.TableState_ABORT:
		shouldLeaveTable = true
		break
	}

	if shouldLeaveTable {
		models.RemoveTableId(uid)
		delete(t.clients, uid)
		// 为了通知
		t.ChangeState(t.state)
		t.SelectOwner()
		return nil
	}

	return errors.New("player cant leave for continue game...")
}

// SitDown 坐下，可以根据座位号
func (t *Table) SitDown(s *session.Session, seatId int32, password string) error {
	var (
		err                  error
		uid                  = s.UID()
		teamId               = t.seatTeam[seatId]
		tableId              = t.tableId
		roundId              = t.roundCounter
		client, isChangeSeat = t.clients[uid]
	)

	if !t.group.Contains(uid) {
		return errors.New("player not join table")
	}

	if password != t.password {
		return errors.New("password error")
	}

	if !isChangeSeat && t.group.Count() > int(t.conf.Pvp) {
		return errors.New("table is full !!")
	}
	if t.state > proto.TableState_WAITREADY {
		return errors.New("table start!!")
	}

	err = models.SetTableId(uid, tableId, roundId)
	if err != nil {
		return err
	}

	if !isChangeSeat {
		var opt = &util.ClientOption{
			S:      s,
			TeamId: teamId,
			SeatId: seatId,
			Table:  t,
		}

		client = NewClient(opt)
		t.clients[uid] = client

		t.SelectOwner()
	} else {
		// 换桌
		client.SetSeatId(seatId)
		t.waiter.CancelReady(s)
	}

	t.ChangeState(proto.TableState_WAITREADY)

	log.Info(t.Format("[SitDown] player %d team %d seat %d", uid, teamId, seatId))
	return nil
}

func (t *Table) Leave(s *session.Session) error {
	defer func(group *nano.Group, s *session.Session) {
		err := group.Leave(s)
		if err != nil {

		}
	}(t.group, s)

	return t.StandUp(s)
}

func (t *Table) Join(s *session.Session) error {
	return t.group.Add(s)
}

func (t *Table) GetInfo() *proto.TableInfo {
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
		RandSeed:    t.randSeed,
		HasPassword: t.password != "",
		RoundId:     t.roundCounter,
		CreateTime:  t.createTime,
		Owner:       t.owner,
	}
}

func (t *Table) GetTableId() string {
	return t.tableId
}

func (t *Table) ResumeTable(s *session.Session, roundId int32, frameId int64) error {
	var (
		uid         = s.UID()
		lastFrameId = frameId
		err         error
		client      util.ClientEntity
	)

	if roundId != t.roundCounter {
		return errors.New("ResumeTable round id err")
	}

	err = t.group.Add(s)
	if err != nil {
		return err
	}

	client = t.Entity(uid)
	client.Reconnect(s, lastFrameId)
	return nil
}

// KickUser 帮主能踢人
func (t *Table) KickUser(s *session.Session, kickUser int64) error {
	var (
		uid        = s.UID()
		kickClient = t.Entity(kickUser)
	)
	if uid != t.owner {
		return errors.New("player kick user permission deny")
	}
	return t.StandUp(kickClient.GetSession())
}

// ChangeSeat 换座位，正在换座位不能换
func (t *Table) ChangeSeat(s *session.Session, wantSeatId int32) error {
	var (
		client         util.ClientEntity
		uid            = s.UID()
		unableSeatList = make([]int32, 0)
	)

	for _, v := range t.clients {
		var (
			wsi = v.GetWantSeat()
			si  = v.GetSeatId()
		)
		if wsi != -1 {
			unableSeatList = append(unableSeatList, wsi, si)
		}
	}

	for _, v := range unableSeatList {
		if v == wantSeatId {
			return errors.New("player can not seat")
		}
	}

	client = t.Entity(uid)
	client.SetWantSeat(wantSeatId)
	return nil
}

func (t *Table) ReplyChangeSeat(s *session.Session, accept bool, wantSeatId int32, wantSeatUserId int64) error {
	var (
		err        error
		wantClient util.ClientEntity
		ok         bool
		uid        = s.UID()
		client     = t.clients[uid]
	)

	// 位置互换
	if accept {
		wantClient, ok = t.GetSeatUser(wantSeatId)
		if !ok {
			return errors.New("want player leave seat")
		}

		if wantClient.GetUserId() != wantSeatUserId {
			return errors.New("want player not match")
		}

		err = t.SitDown(wantClient.GetSession(), client.GetSeatId(), t.password)
		if err != nil {
			return err
		}

		err = t.SitDown(s, wantSeatId, t.password)
		if err != nil {
			return err
		}
	}
	return nil
}
