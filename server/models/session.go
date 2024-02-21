package models

import (
	"fmt"
	"strconv"
	"tetris/pkg/z"
	"time"
)

type RoundSession struct {
	RoomId  string
	TableId string
	RoundId int32
}

func ROUND_SESSION_KEY(userId int64) string {
	return fmt.Sprintf("rs:%d", userId)
}

func GetRoundSession(userId int64) (*RoundSession, error) {
	var (
		cmds map[string]string
		err  error
		rs   = &RoundSession{}
	)
	cmds, err = rclient.HGetAll(ROUND_SESSION_KEY(userId)).Result()
	if err != nil {
		return nil, err
	}
	for k, v := range cmds {
		if k == "room" {
			rs.RoomId = v
		}
		if k == "table" {
			rs.TableId = v
		}
		if k == "round" {
			var roundId, _ = strconv.Atoi(v)
			rs.RoundId = int32(roundId)
		}
	}
	if rs.RoomId == "" {
		return nil, z.NilError{}
	}
	return rs, nil
}

func SetRoomId(userId int64, roomId string) error {
	var (
		key = ROUND_SESSION_KEY(userId)
		err error
	)

	err = rclient.HSet(key, "room", roomId).Err()
	if err != nil {
		return err
	}
	return rclient.Expire(key, 20*time.Minute).Err()
}

func SetTableId(userId int64, tableId string, roundId int32) error {
	var (
		key    = ROUND_SESSION_KEY(userId)
		err    error
		fields = make(map[string]interface{}, 0)
	)

	fields["table"] = tableId
	fields["round"] = roundId

	err = rclient.HMSet(key, fields).Err()
	if err != nil {
		return err
	}
	return rclient.Expire(key, 20*time.Minute).Err()
}

func RemoveTableId(userId int64) {
	rclient.HDel(ROUND_SESSION_KEY(userId), "table")
	rclient.HDel(ROUND_SESSION_KEY(userId), "round")
}

func RemoveRoundSession(userId int64) {
	rclient.Del(ROUND_SESSION_KEY(userId))
}
