package room

import (
	"github.com/lonng/nano/session"
	"sync"
	"tetris/internal/game/util"
	"tetris/pkg/z"
	"tetris/proto/proto"
)

type NormalClient struct {
	player      *proto.TableInfo_Player
	s           *session.Session
	frames      map[int64][]*proto.Action
	lock        sync.RWMutex //锁，用于存帧
	lastFrameId int64        // 当前客户端到了哪帧
	resProgress int32
	joinTime    int64
}

func NewNormalClient(opt *util.ClientOption) *NormalClient {
	var (
		s      = opt.S
		teamId = opt.TeamId
		seatId = opt.SeatId
		p, _   = util.GetProfile(s)
		now    = z.NowUnixMilli()
	)

	client := &NormalClient{
		player: &proto.TableInfo_Player{
			TeamId:     teamId,
			SeatId:     seatId,
			Profile:    util.ConvProfileToProtoProfile(p),
			WantSeatId: -1,
		},
		s:        s,
		joinTime: now,
	}

	client.ResetClient()

	return client
}

func (c *NormalClient) AfterInit() {

}

func (c *NormalClient) SetSeatId(seatId int32) {
	c.player.SeatId = seatId
}

func (c *NormalClient) GetSeatId() int32 {
	return c.player.SeatId
}

func (c *NormalClient) ResetClient() {
	c.frames = make(map[int64][]*proto.Action, 0)
	c.player.End = false
	c.lastFrameId = 0
	c.resProgress = 0
}

func (c *NormalClient) SetLastFrame(frameId int64) {
	c.lastFrameId = frameId
}

func (c *NormalClient) GetLastFrame() int64 {
	return c.lastFrameId
}

func (c *NormalClient) SaveFrame(frameId int64, msg *proto.UpdateFrame) {
	c.lock.Lock()
	defer c.lock.Unlock()

	action := msg.Action
	// 判断游戏是否结束，打一个标记
	if action.Key == proto.ActionType_END {
		c.player.End = true
	}
	uf, ok := c.frames[frameId]
	if !ok {
		uf = make([]*proto.Action, 0)
	}
	uf = append(uf, action)
	c.frames[frameId] = uf
}

func (c *NormalClient) GetFrame(frameId int64) []*proto.Action {
	c.lock.RLock()
	defer c.lock.RUnlock()
	al := make([]*proto.Action, 0)
	if uf, ok := c.frames[frameId]; ok {
		al = uf
	}
	return al
}

func (c *NormalClient) GetSession() *session.Session {
	return c.s
}

func (c *NormalClient) Reconnect(s *session.Session, frameId int64) {
	c.s = s
	c.resProgress = 0
	c.lastFrameId = frameId
}

func (c *NormalClient) SetResProgress(progress int32) {
	c.resProgress = progress
}

func (c *NormalClient) GetResProgress() int32 {
	return c.resProgress
}

func (c *NormalClient) GetUserId() int64 {
	return c.player.Profile.UserId
}

func (c *NormalClient) GetPlayer() *proto.TableInfo_Player {
	return c.player
}

func (c *NormalClient) GetTeamId() int32 {
	return c.player.TeamId
}

func (c *NormalClient) IsGameOver() bool {
	return c.player.End
}

func (c *NormalClient) SetWantSeat(seatId int32) {
	//TODO implement me
	c.player.WantSeatId = seatId
	c.SetWantSeat(-1)
}

func (c *NormalClient) GetWantSeat() int32 {
	return c.player.WantSeatId
}

func (c *NormalClient) GetJoinTime() int64 {
	return c.joinTime
}
