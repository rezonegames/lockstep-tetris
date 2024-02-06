package zredis

import (
	"context"
	"encoding/json"
	"github.com/go-redis/redis/v8"
	"tetris/pkg/z"
	"time"
)

const (
	SPIN_TIME = 10
	SPIN_NUM  = 3
)

type RedisClient struct {
	ctx context.Context

	*redis.Client
	clientName string
	reconnect  chan struct{}
}

type RedisPipeliner struct {
	redis.Pipeliner
}

func NewRedisClient(ctx context.Context, opt *redis.Options) (*redis.Client, error) {
	r := redis.NewClient(opt)
	_, err := r.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}
	return r, nil
}

func NewClient(ctx context.Context, opt *redis.Options, clientName string) (*RedisClient, error) {
	cli, err := NewRedisClient(ctx, opt)
	if err != nil {
		return nil, err
	}

	return &RedisClient{ctx, cli, clientName, make(chan struct{})}, nil
}

func (c RedisClient) Keys(pattern string) (cmd *redis.StringSliceCmd) {
	return c.Client.Keys(c.ctx, pattern)
}

func (c RedisClient) Scan(cursor uint64, match string, count int64) (cmd *redis.ScanCmd) {
	return c.Client.Scan(c.ctx, cursor, match, count)
}

func (c RedisClient) Publish(channel string, message interface{}) (cmd *redis.IntCmd) {
	return c.Client.Publish(c.ctx, channel, message)
}

func (c RedisClient) Subscribe(channels ...string) (cmd *redis.PubSub) {
	return c.Client.Subscribe(c.ctx, channels...)
}

func (c RedisClient) GetPoolConnections() uint32 {
	poolStats := c.Client.PoolStats()
	cons := poolStats.TotalConns - poolStats.IdleConns
	if int32(cons) < 0 {
		cons = 0
	}
	return cons
}

func (c RedisClient) Pipeline() RedisPipeliner {
	return RedisPipeliner{c.Client.Pipeline()}
}

func (pipe RedisPipeliner) Exec(ctx context.Context) (cmd []redis.Cmder, err error) {
	return pipe.Pipeliner.Exec(ctx)
}

func (c RedisClient) AcquireMux(key, val string, expireTime time.Duration) bool {
	return c.SetMuxWithSpins(key, val, expireTime, time.Duration(SPIN_TIME)*time.Millisecond, SPIN_NUM)
}

func (c RedisClient) SetMuxWithSpins(key, val string, expireTime, spinTime time.Duration, spinNum int) bool {
	for i := 0; i < spinNum; i++ {
		isSet := c.SetNX(key, val, expireTime)
		if isSet.Val() {
			return true
		}
		time.Sleep(spinTime)
	}
	return false
}

func (c RedisClient) ReleaseMux(key string) {
	c.Unlink(key)
}

func (c RedisClient) Get(key string) (cmd *redis.StringCmd) {
	return c.Client.Get(c.ctx, key)
}

func (c RedisClient) Set(key string, value interface{}, expiration time.Duration) (cmd *redis.StatusCmd) {
	return c.Client.Set(c.ctx, key, value, expiration)
}

func (c RedisClient) Del(keys ...string) (cmd *redis.IntCmd) {
	return c.Client.Del(c.ctx, keys...)
}

func (c RedisClient) Unlink(key ...string) (cmd *redis.IntCmd) {
	cmd = c.Client.Unlink(c.ctx, key...)
	if cmd.Err() != nil {
		return c.Del(key...)
	}
	return
}

func (c RedisClient) Incr(key string) (cmd *redis.IntCmd) {
	return c.Client.Incr(c.ctx, key)
}

func (c RedisClient) SetNX(key string, value interface{}, expiration time.Duration) (cmd *redis.BoolCmd) {
	return c.Client.SetNX(c.ctx, key, value, expiration)
}

func (c RedisClient) Expire(key string, expiration time.Duration) (cmd *redis.BoolCmd) {
	return c.Client.Expire(c.ctx, key, expiration)
}

func (c RedisClient) ExpireAt(key string, tm time.Time) (cmd *redis.BoolCmd) {
	return c.Client.ExpireAt(c.ctx, key, tm)
}

func (c RedisClient) Rename(key, newkey string) (cmd *redis.StatusCmd) {
	return c.Client.Rename(c.ctx, key, newkey)
}

func (c RedisClient) HSet(key, field string, value interface{}) (cmd *redis.IntCmd) {
	return c.Client.HSet(c.ctx, key, field, value)
}

func (c RedisClient) HGet(key, field string) (cmd *redis.StringCmd) {
	return c.Client.HGet(c.ctx, key, field)
}

func (c RedisClient) HDel(key string, fields ...string) (cmd *redis.IntCmd) {
	return c.Client.HDel(c.ctx, key, fields...)
}

func (c RedisClient) HExists(key, field string) (cmd *redis.BoolCmd) {
	return c.Client.HExists(c.ctx, key, field)
}

func (c RedisClient) HGetAll(key string) (cmd *redis.StringStringMapCmd) {
	return c.Client.HGetAll(c.ctx, key)
}

func (c RedisClient) HIncrBy(key, field string, incr int64) (cmd *redis.IntCmd) {
	return c.Client.HIncrBy(c.ctx, key, field, incr)
}

func (c RedisClient) HMSet(key string, fields map[string]interface{}) (cmd *redis.BoolCmd) {
	return c.Client.HMSet(c.ctx, key, fields)
}

func (c RedisClient) HMGet(key string, fields ...string) (cmd *redis.SliceCmd) {
	return c.Client.HMGet(c.ctx, key, fields...)
}

func (c RedisClient) HSetNX(key, field string, value interface{}) (cmd *redis.BoolCmd) {
	return c.Client.HSetNX(c.ctx, key, field, value)
}

func (c RedisClient) HScan(key string, cursor uint64, match string, count int64) (cmd *redis.ScanCmd) {
	return c.Client.HScan(c.ctx, key, cursor, match, count)
}

func (c RedisClient) SAdd(key string, members ...interface{}) (cmd *redis.IntCmd) {
	return c.Client.SAdd(c.ctx, key, members...)
}

func (c RedisClient) SCard(key string) (cmd *redis.IntCmd) {
	return c.Client.SCard(c.ctx, key)
}

func (c RedisClient) SIsMember(key string, member interface{}) (cmd *redis.BoolCmd) {
	return c.Client.SIsMember(c.ctx, key, member)
}

func (c RedisClient) SMembers(key string) (cmd *redis.StringSliceCmd) {
	return c.Client.SMembers(c.ctx, key)
}

func (c RedisClient) SRem(key string, members ...interface{}) (cmd *redis.IntCmd) {
	return c.Client.SRem(c.ctx, key, members...)
}

func (c RedisClient) ZAdd(key string, members ...*redis.Z) (cmd *redis.IntCmd) {
	return c.Client.ZAdd(c.ctx, key, members...)
}

func (c RedisClient) ZScore(key, member string) (cmd *redis.FloatCmd) {
	return c.Client.ZScore(c.ctx, key, member)
}

func (c RedisClient) ZAddXX(key string, members ...*redis.Z) (cmd *redis.IntCmd) {
	return c.Client.ZAddXX(c.ctx, key, members...)
}

func (c RedisClient) ZAddNX(key string, members ...*redis.Z) (cmd *redis.IntCmd) {
	return c.Client.ZAddNX(c.ctx, key, members...)
}

func (c RedisClient) ZCard(key string) (cmd *redis.IntCmd) {
	return c.Client.ZCard(c.ctx, key)
}

func (c RedisClient) ZRem(key string, members ...interface{}) (cmd *redis.IntCmd) {
	return c.Client.ZRem(c.ctx, key, members...)
}

func (c RedisClient) ZCount(key, min, max string) (cmd *redis.IntCmd) {
	return c.Client.ZCount(c.ctx, key, min, max)
}

func (c RedisClient) ZIncr(key string, member *redis.Z) (cmd *redis.FloatCmd) {
	cmd = c.Client.ZIncr(c.ctx, key, member)
	if cmd.Err() != nil {
		return c.ZIncrBy(key, member.Score, member.Member.(string))
	}
	return cmd
}

func (c RedisClient) ZIncrBy(key string, increment float64, member string) (cmd *redis.FloatCmd) {
	return c.Client.ZIncrBy(c.ctx, key, increment, member)
}

// ZRankX 返回正序 or 倒序
func (c RedisClient) ZRankX(key, member string, rev bool) (cmd *redis.IntCmd) {
	if rev {
		return c.Client.ZRevRank(c.ctx, key, member) //返回member排名
	}
	return c.Client.ZRank(c.ctx, key, member) //返回索引
}

// ZRangeWithScoresX 返回正序 or 倒序的名次范围的zSet
func (c RedisClient) ZRangeWithScoresX(key string, start, stop int64, rev bool) (cmd *redis.ZSliceCmd) {
	if rev {
		return c.Client.ZRevRangeWithScores(c.ctx, key, start, stop)
	}
	return c.Client.ZRangeWithScores(c.ctx, key, start, stop)
}

// ZRangeX 返回正序 or 倒序的名次范围的zSet.Member
func (c RedisClient) ZRangeX(key string, start, stop int64, rev bool) (cmd *redis.StringSliceCmd) {
	if rev {
		return c.Client.ZRevRange(c.ctx, key, start, stop)
	}
	return c.Client.ZRange(c.ctx, key, start, stop)
}

// ZRemRangeByRank 根据倒序排名移出
func (c RedisClient) ZRemRangeByRank(key string, start, stop int64) (cmd *redis.IntCmd) {
	return c.Client.ZRemRangeByRank(c.ctx, key, start, stop)
}

func (c RedisClient) LPush(key string, values ...interface{}) (cmd *redis.IntCmd) {
	return c.Client.LPush(c.ctx, key, values...)
}

func (c RedisClient) RPush(key string, values ...interface{}) (cmd *redis.IntCmd) {
	return c.Client.RPush(c.ctx, key, values...)
}

func (c RedisClient) LLen(key string) (cmd *redis.IntCmd) {
	return c.Client.LLen(c.ctx, key)
}

func (c RedisClient) LPop(key string) (cmd *redis.StringCmd) {
	return c.Client.LPop(c.ctx, key)
}

func (c RedisClient) RPop(key string) (cmd *redis.StringCmd) {
	return c.Client.RPop(c.ctx, key)
}

func (c RedisClient) LRem(key string, count int64, value interface{}) (cmd *redis.IntCmd) {
	return c.Client.LRem(c.ctx, key, count, value)
}

func (c RedisClient) LIndex(key string, index int64) (cmd *redis.StringCmd) {
	return c.Client.LIndex(c.ctx, key, index)
}

func (c RedisClient) PublishJsonData(channel string, message interface{}) *redis.IntCmd {
	jsonBytes, err := json.Marshal(message)
	if err != nil {
		return nil
	}
	messageString := string(jsonBytes)
	return c.Publish(channel, messageString)
}

type ProcessFunc func(string, string)

func (c RedisClient) SubscribeWithRetry(channel string, callback ProcessFunc) {
	go z.Safe(func() {
		c.NewSubscriber(channel, callback)
	})
	for {
		select {
		case <-c.reconnect:
			go z.Safe(func() {
				c.NewSubscriber(channel, callback)
			})
			time.Sleep(1 * time.Second)
		}
	}
}

func (c RedisClient) NewSubscriber(channel string, callback ProcessFunc) {
	sub := c.Subscribe(channel)
	if sub == nil {
		return
	}
	defer sub.Close()

	subC := sub.Channel()
	for {
		select {
		case msg, ok := <-subC:
			if !ok {
				c.reconnect <- struct{}{}
				return
			}
			callback(msg.Channel, msg.Payload)
		}
	}
}
