package models

import (
	"fmt"
	"tetris/pkg/z"
	"time"
)

type RoundSession struct {
	RoomId  string
	TableId string
}

func ROUND_SESSION_KEY(userId int64) string {
	return fmt.Sprintf("rs:%d", userId)
}

func GetRoundSession(userId int64) (*RoundSession, error) {
	vs, err := rclient.HGetAll(ROUND_SESSION_KEY(userId)).Result()
	if err != nil {
		return nil, err
	}
	var rs RoundSession
	for k, v := range vs {
		if k == "roomId" {
			rs.RoomId = v
		}
		if k == "tableId" {
			rs.TableId = v
		}
	}
	if rs.RoomId == "" {
		return nil, z.NilError{}
	}
	return &rs, nil
}

func SetRoomId(userId int64, roomId string) error {
	key := ROUND_SESSION_KEY(userId)
	err := rclient.HSet(key, "roomId", roomId).Err()
	if err != nil {
		return err
	}
	rclient.Expire(key, 20*time.Minute)
	return nil
}

func SetTableId(userId int64, tableId string) error {
	key := ROUND_SESSION_KEY(userId)
	err := rclient.HSet(key, "tableId", tableId).Err()
	if err != nil {
		return err
	}
	rclient.Expire(key, 20*time.Minute)
	return nil
}

func RemoveTableId(userId int64) {
	rclient.HDel(ROUND_SESSION_KEY(userId), "tableId")
}

func RemoveRoundSession(userId int64) {
	rclient.Del(ROUND_SESSION_KEY(userId))
}
