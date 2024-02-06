package models

import (
	"context"
	"fmt"
	"github.com/go-redis/redis/v8"
	"tetris/pkg/log"
	"tetris/pkg/zmongo"
	"tetris/pkg/zredis"
)

var (
	mclient *zmongo.MongoClient
	rclient *zredis.RedisClient

	DB_NAME     = ""
	COL_ACCOUNT = "accounts"
	COL_PROFILE = "profiles"
	COL_COUNTER = "counters"
)

func StartMongo(ctx context.Context, uri string, db string, secondary bool) {
	log.Info("[StartMongo] ready connecting")

	client, err := zmongo.NewMongoClient(ctx, uri, secondary)
	if err != nil {
		panic(fmt.Sprintf("start mongo error!! uri: %s err: %+v", uri, err))
	}
	DB_NAME = db
	mclient = client

	log.Info("[StartMongo] success %s %s %v", uri, db, secondary)
}

func StartRedis(ctx context.Context, host string, db int, auth string) {
	log.Info("[StartRedis] ready connecting")
	
	client, err := zredis.NewClient(ctx, &redis.Options{
		Addr: host,
		DB:   db,
	}, "")
	if err != nil {
		panic(fmt.Sprintf("start redis error!! uri: %s err: %+v", host, err))
	}
	rclient = client

	log.Info("[StartRedis] success %s %d", host, db)
}
