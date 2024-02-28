package room

import (
	"errors"
	"fmt"
	"github.com/lonng/nano"
	"github.com/lonng/nano/session"
	"tetris/config"
	"tetris/internal/game/util"
	"tetris/models"
	"tetris/pkg/log"
	"tetris/proto/proto"
)

type Room struct {
	group  *nano.Group
	config *config.Room
	tables map[string]util.TableEntity
	roomId string
}

func (f *Room) BackToWait(sList []*session.Session) {
	//TODO implement me
	panic("implement me")
}

func (r *Room) CreateTable(s *session.Session, tableId, password string) (util.TableEntity, error) {
	panic("CreateTable not implement")
}

func (r *Room) GetInfo() *proto.Room {
	var (
		roomInfo = r.config.Conv2Proto()
	)
	roomInfo.PlayerCount = int32(r.group.Count())
	return roomInfo
}

func (r *Room) Format(format string, v ...interface{}) string {
	format = fmt.Sprintf("[room %s] ", r.roomId) + fmt.Sprintf(format, v...)
	return format
}

func NewNormalRoom(opt *util.RoomOption) *Room {
	var (
		conf   = opt.Config
		roomId = conf.RoomId
	)

	room := &Room{
		roomId: roomId,
		group:  nano.NewGroup(roomId),
		config: conf,
		tables: make(map[string]util.TableEntity, 0),
	}

	return room
}

func (r *Room) AfterInit() {
	go r.Run()
}

func (r *Room) Run() {
}

// BeforeShutdown 清理一下roundsession缓存
func (r *Room) BeforeShutdown() {
	for _, uid := range r.group.Members() {
		log.Info(r.Format("[BeforeShutdown] leave user %d", uid))
		models.RemoveRoundSession(uid)
	}
	log.Info(r.Format("[BeforeShutdown]"))
}

func (r *Room) Entity(tableId string) (util.TableEntity, error) {
	t, ok := r.tables[tableId]
	if !ok {
		return nil, errors.New("table not found")
	}
	return t, nil
}

func (r *Room) GetConfig() *config.Room {
	return r.config
}

func (r *Room) Join(s *session.Session) error {
	var (
		uid    = s.UID()
		roomId = r.roomId
		err    error
	)
	err = models.SetRoomId(uid, roomId)
	if err != nil {
		return err
	}
	log.Info(r.Format("[Join] user %d", uid))
	return r.group.Add(s)
}

func (r *Room) Leave(s *session.Session) error {
	var (
		rs    *models.RoundSession
		err   error
		table util.TableEntity
		uid   = s.UID()
	)
	rs, err = models.GetRoundSession(uid)
	if err == nil {
		// 说明在桌子里
		table, err = r.Entity(rs.TableId)
		if err != nil {
			// 说明桌子已解散
			goto EXIT
		}

		err = table.Leave(s)
		if err != nil {
			// 数据不能移除，因为要断线重连
			log.Error(r.Format("[Leave] user %d err %+v", uid, err))
			return err
		}
	}

EXIT:
	log.Info(r.Format("[Leave] user %d", uid))
	models.RemoveRoundSession(uid)
	return r.group.Leave(s)
}

func (r *Room) OnTableDeleted(tableId string) {
	delete(r.tables, tableId)
	log.Info(r.Format("[OnTableDeleted] delete table %s", tableId))
}
