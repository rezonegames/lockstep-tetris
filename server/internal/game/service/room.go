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
			err := r.Leave(s, &proto.Leave{
				RoomId: roomId,
			})
			if err != nil {
				log.Info("player %d leave room %s err", s.UID(), roomId)
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

func (r *RoomService) getTable(s *session.Session) (util.TableEntity, error) {
	rs, err := models.GetRoundSession(s.UID())
	if err != nil {
		return nil, err
	}
	table, err := r.Entity(rs.RoomId).Entity(rs.TableId)
	if err != nil {
		return nil, err
	}
	return table, nil
}

func (r *RoomService) Ready(s *session.Session, _ *proto.Ready) error {
	table, err := r.getTable(s)
	if err != nil {
		return err
	}
	return table.Ready(s)
}

func (r *RoomService) LoadRes(s *session.Session, msg *proto.LoadRes) error {
	table, err := r.getTable(s)
	if err != nil {
		return err
	}
	return table.LoadRes(s, msg)
}

func (r *RoomService) Update(s *session.Session, msg *proto.UpdateFrame) error {
	table, err := r.getTable(s)
	if err != nil {
		return err
	}
	return table.Update(s, msg)
}

func (r *RoomService) ResumeTable(s *session.Session, msg *proto.ResumeTable) error {
	table, err := r.getTable(s)
	if err != nil {
		models.RemoveRoundSession(s.UID())
		return s.Response(&proto.ResumeTableResp{
			Code: proto.ErrorCode_TableDismissError,
		})
	}
	err = table.ResumeTable(s, msg)
	if err != nil {
		return err
	}
	return s.Response(&proto.ResumeTableResp{
		Code: proto.ErrorCode_OK,
		State: &proto.GameStateResp{
			Code:      proto.ErrorCode_OK,
			State:     proto.GameState_INGAME,
			TableInfo: table.GetInfo(),
		},
	})
}
