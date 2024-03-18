package service

import (
	"github.com/lonng/nano/component"
	"github.com/lonng/nano/session"
	"tetris/config"
	"tetris/internal/game/util"
	"tetris/models"
	"tetris/pkg/log"
	"tetris/proto/proto"
)

type RoomService struct {
	*component.Base
	serviceName string
	rooms       map[string]util.RoomEntity
}

func NewRoomService() *RoomService {
	return &RoomService{
		rooms: make(map[string]util.RoomEntity, 0),
	}
}

func (r *RoomService) AfterInit() {
	// 处理玩家断开连接
	session.Lifetime.OnClosed(func(s *session.Session) {
		for _, v := range r.rooms {
			var (
				conf   = v.GetConfig()
				roomId = conf.RoomId
			)
			err := v.Leave(s)
			if err != nil {
				log.Info("player %d leave room %s err %+v", s.UID(), roomId, err)
			}
		}
	})
}

func (r *RoomService) BeforeShutdown() {
	for _, room := range r.rooms {
		room.BeforeShutdown()
	}
}

func (r *RoomService) AddRoomEntity(roomId string, entity util.RoomEntity) {
	r.rooms[roomId] = entity
}

func (r *RoomService) Entity(roomId string) util.RoomEntity {
	return r.rooms[roomId]
}

func (r *RoomService) GetRoomList(s *session.Session, _ *proto.GetRoomList) error {
	var (
		roomList = make([]*proto.Room, 0)
	)

	for _, v := range config.ServerConfig.Rooms {
		var (
			roomId   = v.RoomId
			room     = r.Entity(roomId)
			roomInfo = room.GetInfo()
		)
		roomList = append(roomList, roomInfo)
	}

	return s.Response(&proto.GetRoomListResp{
		Code:     proto.ErrorCode_OK,
		RoomList: roomList,
	})
}

func (r *RoomService) GetRoomInfo(s *session.Session, msg *proto.GetRoomInfo) error {
	var (
		roomId = msg.RoomId
		room   = r.Entity(roomId)
	)

	return s.Response(&proto.GetRoomInfoResp{
		Code: proto.ErrorCode_OK,
		Room: room.GetInfo(),
	})
}

func (r *RoomService) Join(s *session.Session, msg *proto.Join) error {
	var (
		roomId = msg.RoomId
		uid    = s.UID()
		room   = r.Entity(roomId)
	)

	if rs, err := models.GetRoundSession(uid); err == nil {
		// 从老的房间离开，并加入新的房间，如果不能离开其它的房间返回一个房间号，由客户端处理
		if err = r.Entity(rs.RoomId).Leave(s); err != nil {
			return s.Response(&proto.JoinResp{
				Code: proto.ErrorCode_AlreadyInRoom,
			})
		}
	}

	if err := room.Join(s); err != nil {
		return s.Response(&proto.JoinResp{
			Code: proto.ErrorCode_JoinError,
		})
	}

	return s.Response(&proto.JoinResp{
		Code:     proto.ErrorCode_OK,
		RoomInfo: room.GetInfo(),
	})
}

func (r *RoomService) Leave(s *session.Session, _ *proto.Leave) error {
	var (
		uid = s.UID()
	)

	if rs, err := models.GetRoundSession(uid); err == nil {
		// 从老的房间离开，并加入新的房间，如果不能离开其它的房间返回一个房间号，由客户端处理
		if err = r.Entity(rs.RoomId).Leave(s); err != nil {
			return s.Response(&proto.LeaveResp{
				Code: proto.ErrorCode_LeaveError,
			})
		}
	}
	return s.Response(&proto.LeaveResp{
		Code: proto.ErrorCode_OK,
	})
}

func (r *RoomService) CreateTable(s *session.Session, msg *proto.CreateTable) error {
	rs, err := models.GetRoundSession(s.UID())
	if err != nil {
		return err
	}

	var (
		roomId   = rs.RoomId
		tableId  = msg.TableId
		password = msg.Password
	)
	table, err := r.Entity(roomId).CreateTable(s, tableId, password)
	if err != nil {
		return s.Response(&proto.CreateTableResp{
			Code: proto.ErrorCode_CreateTableError,
		})
	}

	return s.Response(&proto.CreateTableResp{
		Code:  proto.ErrorCode_OK,
		Table: table.GetInfo(),
	})
}

func (r *RoomService) getTableFromSession(s *session.Session) (util.TableEntity, error) {
	var (
		uid   = s.UID()
		rs    *models.RoundSession
		err   error
		table util.TableEntity
	)

	rs, err = models.GetRoundSession(uid)
	if err != nil {
		return nil, err
	}
	table, err = r.Entity(rs.RoomId).Entity(rs.TableId)
	if err != nil {
		return nil, err
	}
	return table, nil
}

func (r *RoomService) KickUser(s *session.Session, msg *proto.KickUser) error {
	var (
		err      error
		table    util.TableEntity
		kickUser = msg.UserId
	)
	table, err = r.getTableFromSession(s)
	if err != nil {
		goto EXIT
	}
	err = table.KickUser(s, kickUser)
	if err != nil {
		goto EXIT
	}

	return s.Response(&proto.KickUserResp{
		Code: proto.ErrorCode_OK,
	})
EXIT:
	return s.Response(&proto.KickUserResp{
		Code: proto.ErrorCode_KickUserError,
	})
}

func (r *RoomService) JoinTable(s *session.Session, msg *proto.JoinTable) error {
	var (
		rs      *models.RoundSession
		err     error
		tableId = msg.TableId
		table   util.TableEntity
	)

	rs, err = models.GetRoundSession(s.UID())
	if err != nil {
		goto EXIT
	}

	table, err = r.Entity(rs.RoomId).Entity(tableId)
	if err != nil {
		goto EXIT
	}
	err = table.Join(s)
	if err != nil {
		goto EXIT
	}
	return s.Response(&proto.JoinTableResp{
		Code: proto.ErrorCode_OK,
	})

EXIT:
	return s.Response(&proto.JoinTableResp{
		Code: proto.ErrorCode_JoinTableError,
	})
}

func (r *RoomService) LeaveTable(s *session.Session, _ *proto.LeaveTable) error {
	var (
		table util.TableEntity
		err   error
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		// 解散等原因
		return s.Response(&proto.LeaveTableResp{
			Code: proto.ErrorCode_OK,
		})
	}
	err = table.Leave(s)
	if err != nil {
		goto EXIT
	}

	return s.Response(&proto.LeaveTableResp{
		Code: proto.ErrorCode_OK,
	})

EXIT:
	return s.Response(&proto.LeaveTableResp{
		Code: proto.ErrorCode_LeaveTableError,
	})
}

func (r *RoomService) ReplyChangeSeat(s *session.Session, msg *proto.ReplyChangeSeat) error {
	var (
		accept         = msg.Accept
		wantSeatId     = msg.WantSeatId
		wantSeatUserId = msg.WantSeatUserId
		table          util.TableEntity
		err            error
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		return err
	}

	return table.ReplyChangeSeat(s, accept, wantSeatId, wantSeatUserId)
}

func (r *RoomService) SitDown(s *session.Session, msg *proto.SitDown) error {
	var (
		rs       *models.RoundSession
		err      error
		tableId  = msg.TableId
		password = msg.Password
		seatId   = msg.SeatId
		table    util.TableEntity
		ok       bool
		uid      = s.UID()
	)

	rs, err = models.GetRoundSession(uid)
	if err != nil {
		goto EXIT
	}

	table, err = r.Entity(rs.RoomId).Entity(tableId)
	if err != nil {
		goto EXIT
	}

	// 换座位，通知要换的人，等同意
	if _, ok = table.GetSeatUser(seatId); ok {
		err = table.ChangeSeat(s, seatId)
		if err != nil {

		}

		goto EXIT
	}

	err = table.SitDown(s, seatId, password)
	if err != nil {
		goto EXIT
	}
	return s.Response(&proto.SitDownResp{
		Code: proto.ErrorCode_OK,
	})

EXIT:
	return s.Response(&proto.SitDownResp{
		Code: proto.ErrorCode_SitDownError,
	})
}

func (r *RoomService) StandUp(s *session.Session, _ *proto.StandUp) error {
	var (
		table util.TableEntity
		err   error
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		// 解散等原因
		return s.Response(&proto.StandUpResp{
			Code: proto.ErrorCode_OK,
		})
	}
	err = table.StandUp(s)
	if err != nil {
		goto EXIT
	}

	return s.Response(&proto.StandUpResp{
		Code: proto.ErrorCode_OK,
	})

EXIT:
	return s.Response(&proto.StandUpResp{
		Code: proto.ErrorCode_StandUpErrpr,
	})
}

// Ready notify不需要返回
func (r *RoomService) Ready(s *session.Session, _ *proto.Ready) error {
	var (
		table util.TableEntity
		err   error
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		return err
	}

	return table.Ready(s)
}

// LoadRes notify加载资源的进度，不需要返回
func (r *RoomService) LoadRes(s *session.Session, msg *proto.LoadRes) error {
	var (
		table util.TableEntity
		err   error
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		return err
	}
	return table.LoadRes(s, msg)
}

// Update 同步帧数据，不需要返回
func (r *RoomService) Update(s *session.Session, msg *proto.UpdateFrame) error {
	var (
		table util.TableEntity
		err   error
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		return err
	}
	return table.Update(s, msg)
}

// ResumeTable 断线重连，用来恢复游戏用的
func (r *RoomService) ResumeTable(s *session.Session, msg *proto.ResumeTable) error {
	var (
		table   util.TableEntity
		err     error
		frameId = msg.FrameId
		rs      *models.RoundSession
		uid     = s.UID()
	)

	table, err = r.getTableFromSession(s)
	if err != nil {
		models.RemoveRoundSession(uid)
		// 解散了
		return s.Response(&proto.ResumeTableResp{
			Code: proto.ErrorCode_TableDismissError,
		})
	}

	// todo：再取一次redis
	rs, err = models.GetRoundSession(uid)
	if err != nil {
		goto EXIT
	}

	err = table.ResumeTable(s, rs.RoundId, frameId)
	if err != nil {
		goto EXIT
	}

	// 包括桌子信息与帧信息
	return s.Response(&proto.ResumeTableResp{
		Code: proto.ErrorCode_OK,
		State: &proto.OnGameState{
			State:     proto.GameState_INGAME,
			TableInfo: table.GetInfo(),
		},
	})

EXIT:
	models.RemoveRoundSession(uid)
	return s.Response(&proto.ResumeTableResp{
		Code: proto.ErrorCode_UnknownError,
	})
}
