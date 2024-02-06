package models

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"tetris/pkg/z"
)

type Account struct {
	Partition int32  `bson:"partition"`
	AccountId string `bson:"_id"`
	UserId    int64  `bson:"user_id"`
	Password  string `bson:"password"`
}

func GetAccount(accountId string) (*Account, error) {
	filter := bson.M{
		"_id": accountId,
	}
	opts := &options.FindOneOptions{}
	a := &Account{}
	err := mclient.FindOne(a, DB_NAME, COL_ACCOUNT, filter, opts)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, z.NilError{Msg: accountId}
		}
		return nil, err
	}
	return a, nil
}

func NewAccount(partition int32, accountId string) *Account {
	return &Account{
		Partition: partition,
		AccountId: accountId,
		//UserId:    0,
		Password: "",
	}
}

func BindAccount(accountId string, userId int64) error {
	filter := bson.M{
		"_id": accountId,
	}
	update := bson.M{
		"$set": bson.M{
			"user_id":    userId,
			"updated_at": z.NowUnixMilli(),
		},
	}
	err := mclient.UpsertOne(DB_NAME, COL_ACCOUNT, filter, update)
	return err
}

func CreateAccount(a *Account) error {
	_, err := mclient.InsertOne(DB_NAME, COL_ACCOUNT, a)
	return err
}
