package service

import (
	"github.com/lonng/nano/component"
	"github.com/lonng/nano/session"
	"tetris/internal/game/util"
	"tetris/models"
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
			r.Leave(s, &proto.Leave{
				RoomId: v.GetConfig().RoomId,
				Force:  true,
			})
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

func (r *RoomService) Join(s *session.Session, msg *proto.Join) error {
	if rs, err := models.GetRoundSession(s.UID()); err == nil {
		if rs.RoomId == msg.RoomId {
			// 在这个房间里直接返回成功，进入等待页面
			goto EXIT
		} else {

			// 从老的房间离开，并加入新的房间，如果不能离开其它的房间返回一个房间号，由客户端处理
			err = r.Entity(rs.RoomId).Leave(s)
			if err != nil {
				return s.Response(&proto.GameStateResp{
					Code:   proto.ErrorCode_AlreadyInRoom,
					RoomId: rs.RoomId,
				})
			}
		}

	}

	if err := r.Entity(msg.RoomId).Join(s); err != nil {
		return s.Response(&proto.GameStateResp{
			Code: proto.ErrorCode_JoinError,
		})
	}

EXIT:
	return s.Response(&proto.GameStateResp{
		Code:  proto.ErrorCode_OK,
		State: proto.GameState_WAIT,
	})
}

func (r *RoomService) Leave(s *session.Session, msg *proto.Leave) error {
	if rs, err := models.GetRoundSession(s.UID()); err != nil {
		goto EXIT
	} else {
		if msg.Force && rs.RoomId != msg.RoomId {
			goto EXIT
		}
		err = r.Entity(rs.RoomId).Leave(s)
		if err != nil {
			s.Response(&proto.LeaveResp{Code: proto.ErrorCode_UnknownError})
		}
	}
EXIT:
	return s.Response(&proto.LeaveResp{
		Code:     proto.ErrorCode_OK,
		RoomList: util.GetRoomList(),
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
		// todo：当所在当桌子解散了，需要把数据清除，返回错误让玩家重新连接
		models.RemoveRoundSession(s.UID())
		return s.Response(&proto.GameStateResp{
			Code:     proto.ErrorCode_TableDismissError,
			RoomList: util.GetRoomList(),
		})
	}
	return table.ResumeTable(s, msg)
}

func (r *RoomService) ResumeRoom(s *session.Session, _ *proto.ResumeRoom) error {
	models.RemoveRoundSession(s.UID())
	return s.Response(&proto.GameStateResp{
		Code:     proto.ErrorCode_OK,
		RoomList: util.GetRoomList(),
	})
}
