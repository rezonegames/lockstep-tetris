package models

import (
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"tetris/pkg/z"
	"tetris/pkg/zmongo"
	proto2 "tetris/proto/proto"
)

type Counter struct {
	Id    string `bson:"_id"`
	Count int64  `bson:"count"`
}

type Profile struct {
	Name   string                    `bson:"name"`
	UserId int64                     `bson:"_id"`
	Pic    string                    `bson:"pic"`
	Items  map[proto2.ItemType]int32 `bson:"items"`
}

func GetProfile(userId int64, fields ...string) (*Profile, error) {
	filter := bson.M{
		"_id": userId,
	}
	opts := &options.FindOneOptions{}
	projection := bson.M{}
	for _, field := range fields {
		projection[field] = 1
	}
	opts.Projection = projection
	p := &Profile{}
	err := mclient.FindOne(p, DB_NAME, COL_PROFILE, filter, opts)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, z.NilError{Msg: fmt.Sprintf("%d", userId)}
		}
		return nil, err
	}
	return p, nil
}

func AddItems(userId int64, itemList []*proto2.Item) error {
	filter := bson.M{
		"_id": userId,
	}
	update := bson.D{}
	for _, item := range itemList {
		key := fmt.Sprintf("items.%d", item.Key)
		update = append(update, bson.E{Key: "$inc", Value: bson.D{{key, item.Val}}})
	}
	return mclient.UpsertOne(DB_NAME, COL_PROFILE, filter, update)
}

func CreateProfile(name string, pic string, coin int32) (*Profile, error) {
	// 取id
	filter := bson.M{
		"_id": "_id",
	}
	after := options.After
	opts := &options.FindOneAndUpdateOptions{
		Upsert:         zmongo.NewTrue(),
		ReturnDocument: &after,
	}
	update := bson.M{
		"$inc": bson.M{
			"count": 1,
		},
	}
	counter := &Counter{}
	err := mclient.FindOneAndUpdate(DB_NAME, COL_COUNTER, filter, update, counter, opts)
	if err != nil {
		return nil, err
	}

	// 插之
	p := &Profile{
		Name:   name,
		UserId: counter.Count,
		Pic:    pic,
		Items:  make(map[proto2.ItemType]int32, 0),
	}
	p.Items[proto2.ItemType_COIN] = coin
	_, err = mclient.InsertOne(DB_NAME, COL_PROFILE, p)
	return p, err
}
