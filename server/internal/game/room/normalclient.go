package room

import (
	"github.com/lonng/nano/session"
	"sync"
	"tetris/internal/game/util"
	"tetris/proto/proto"
)

type NormalClient struct {
	player      *proto.TableInfo_Player
	s           *session.Session
	frames      map[int64][]*proto.Action
	lock        sync.RWMutex //锁，用于存帧
	lastFrameId int64        // 当前客户端到了哪帧
	resProgress int32
}

func NewNormalClient(opt *util.ClientOption) *NormalClient {
	var (
		s      = opt.S
		teamId = opt.TeamId
		seatId = opt.SeatId
		p, _   = util.GetProfile(s)
	)

	client := &NormalClient{
		player: &proto.TableInfo_Player{
			TeamId:  teamId,
			SeatId:  seatId,
			Profile: util.ConvProfileToProtoProfile(p),
		},
		s: s,
	}

	client.ResetClient()

	return client
}

func (c *NormalClient) AfterInit() {
	//go func() {
	//
	//	var ticker = time.NewTicker(time.Second)
	//	defer ticker.Stop()
	//
	//	for {
	//		select {
	//
	//		case <-ticker.C:
	//
	//		}
	//	}
	//}()
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
