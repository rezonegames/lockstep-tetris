package zmongo

import (
	"context"
	"fmt"
	"github.com/pkg/errors"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"reflect"
	"time"
)

const (
	// MongoConnPoolLimit is the maximum number of sockets in use in a single server
	// before this session will block waiting for a socket to be available.
	// The default limit is 4096.
	//
	// This limit must be set to cover more than any expected workload of the
	// application. It is a bad practice and an unsupported use case to use the
	// database driver to define the concurrency limit of an application. Prevent
	// such concurrency "at the door" instead, by properly restricting the amount
	// of used resources and number of goroutines before they are created.
	MongoConnPoolLimit = 128
)

type MongoClient struct {
	ctx context.Context

	client *mongo.Client
	dbs    map[string]*mongo.Database
}

// NewMongoClient create MongoClient use default options.ClientOptions
func NewMongoClient(ctx context.Context, uri string, secondary bool) (*MongoClient, error) {
	return newClient(ctx, getOptions(uri, secondary))
}

// NewClient NewMongoClient create MongoClient by your options.ClientOptions
func newClient(ctx context.Context, opts ...*options.ClientOptions) (*MongoClient, error) {
	client, err := mongo.NewClient(opts...)
	if err != nil {
		return nil, fmt.Errorf("create mongo fail:%+v", err)
	}

	ctx1, cancelFn := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancelFn()

	err = client.Connect(ctx1)
	if err != nil {
		return nil, fmt.Errorf("mongo connect error: %v", err)
	}

	err = client.Ping(context.Background(), nil)
	if err != nil {
		return nil, fmt.Errorf("ping mongo fail: %+v", err)
	}
	return &MongoClient{ctx: ctx, client: client, dbs: make(map[string]*mongo.Database)}, nil
}

func getOptions(uri string, secondary bool) *options.ClientOptions {
	opts := options.Client()
	opts.ApplyURI(uri)
	opts.SetMaxPoolSize(MongoConnPoolLimit)
	if secondary {
		opts.SetReadPreference(readpref.SecondaryPreferred())
	}
	return opts
}

func (c *MongoClient) Database(name string) *mongo.Database {
	if db, ok := c.dbs[name]; ok {
		return db
	}
	db := c.client.Database(name)
	c.dbs[name] = db
	return db
}

func (c *MongoClient) DbColl(dbName, coll string) *mongo.Collection {
	return c.Database(dbName).Collection(coll)
}

func (c *MongoClient) FindOne(result interface{}, dbName, collName string, query interface{}, opts ...*options.FindOneOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection: %+v, %+v", dbName, collName)
	}

	findResult := coll.FindOne(c.ctx, query, opts...)
	if findResult.Err() != nil {
		return findResult.Err()
	}

	return findResult.Decode(result)
}

func (c *MongoClient) FindAll(result interface{}, dbName, collName string, query interface{}, opts ...*options.FindOptions) (err error) {
	resultv := reflect.ValueOf(result)
	if resultv.Kind() != reflect.Ptr || resultv.Elem().Kind() != reflect.Slice {
		return errors.New("result argument must be a slice address")
	}

	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	cursor, err := coll.Find(c.ctx, query, opts...)
	if err != nil {
		return
	}

	return DecodeAll(cursor, c.ctx, result)
}

func (c *MongoClient) FindOneAndUpdate(dbName, collName string, filter interface{}, update interface{}, v interface{}, opts ...*options.FindOneAndUpdateOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	result := coll.FindOneAndUpdate(c.ctx, filter, update, opts...)
	return result.Decode(v)
}

func (c *MongoClient) FindOneAndDelete(dbName, collName string, filter interface{}, opts ...*options.FindOneAndDeleteOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	result := coll.FindOneAndDelete(c.ctx, filter, opts...)
	return result.Err()
}

func (c *MongoClient) UpdateOne(dbName, collName string, filter interface{}, update interface{}, opts ...*options.UpdateOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	_, err = coll.UpdateOne(c.ctx, filter, update, opts...)
	return
}

func (c *MongoClient) UpdateAll(dbName, collName string, filter interface{}, update interface{}, opts ...*options.UpdateOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	_, err = coll.UpdateMany(c.ctx, filter, update)
	return
}

func (c *MongoClient) UpsertOne(dbName, collName string, filter interface{}, update interface{}, opts ...*options.UpdateOptions) (err error) {
	upsert := true
	if len(opts) > 0 {
		opts[0].Upsert = &upsert
		return c.UpdateOne(dbName, collName, filter, update, opts...)
	} else {
		opt := options.UpdateOptions{}
		opt.Upsert = &upsert
		return c.UpdateOne(dbName, collName, filter, update, &opt)
	}

}

func (c *MongoClient) InsertOne(dbName, collName string, document interface{}, opts ...*options.InsertOneOptions) (insertedID interface{}, err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return nil, fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	result, err := coll.InsertOne(c.ctx, document, opts...)
	if err != nil {
		return
	}

	return result.InsertedID, err
}

func (c *MongoClient) InsertMany(dbName, collName string, documents []interface{}, opts ...*options.InsertManyOptions) (result *mongo.InsertManyResult, err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		err = fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
		return
	}

	return coll.InsertMany(c.ctx, documents, opts...)
}

func (c *MongoClient) DeleteOne(dbName, collName string, filter interface{}, opts ...*options.DeleteOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	_, err = coll.DeleteOne(c.ctx, filter, opts...)
	return
}

func (c *MongoClient) DeleteMany(dbName, collName string, filter interface{}, opts ...*options.DeleteOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	_, err = coll.DeleteMany(c.ctx, filter, opts...)
	return err
}

func (c *MongoClient) Count(dbName, collName string, filter interface{}, opts ...*options.CountOptions) (count int64, err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return count, fmt.Errorf("cannot find collection:%+v,%+v", dbName, collName)
	}

	return coll.CountDocuments(c.ctx, filter, opts...)
}

func (c *MongoClient) Aggregate(result interface{}, dbName, collName string, pipeline interface{}, opts ...*options.AggregateOptions) (err error) {
	resultv := reflect.ValueOf(result)
	if resultv.Kind() != reflect.Ptr || resultv.Elem().Kind() != reflect.Slice {
		return errors.New("result argument must be a slice address")
	}

	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection: %+v, %+v", dbName, collName)
	}

	ctx := c.ctx
	cursor, err := coll.Aggregate(ctx, pipeline, opts...)
	if err != nil {
		return
	}

	return DecodeAll(cursor, ctx, result)
}

func (c *MongoClient) BulkWrite(dbName, collName string, models []mongo.WriteModel, opts ...*options.BulkWriteOptions) (err error) {
	coll := c.DbColl(dbName, collName)
	if coll == nil {
		return fmt.Errorf("cannot find collection: %+v, %+v", dbName, collName)
	}

	_, err = coll.BulkWrite(c.ctx, models, opts...)
	return err
}

type MongoCursor struct {
	ctx context.Context
	*mongo.Cursor
}

func NewMongoCursor(ctx context.Context, c *mongo.Cursor) *MongoCursor {
	mc := &MongoCursor{ctx: ctx, Cursor: c}
	return mc
}

func (mc *MongoCursor) All(result interface{}) (err error) {
	resultv := reflect.ValueOf(result)
	if resultv.Kind() != reflect.Ptr || resultv.Elem().Kind() != reflect.Slice {
		return errors.New("result argument must be a slice address")
	}
	slicev := resultv.Elem()
	slicev = slicev.Slice(0, slicev.Cap())
	elemt := slicev.Type().Elem()

	i := 0
	for mc.Next(mc.ctx) {
		elemp := reflect.New(elemt)
		err = mc.Decode(elemp.Interface())
		if err != nil {
			return errors.Wrap(err, "decode data failed")
		}
		slicev = reflect.Append(slicev, elemp.Elem())
		i++
	}
	resultv.Elem().Set(slicev.Slice(0, i))
	return mc.Close(mc.ctx)
}

func DecodeAll(cursor *mongo.Cursor, ctx context.Context, result interface{}) error {
	defer cursor.Close(ctx)

	resultv := reflect.ValueOf(result)
	slicev := resultv.Elem()
	elemt := slicev.Type().Elem()

	for cursor.Next(ctx) {
		elemp := reflect.New(elemt)
		if err := cursor.Decode(elemp.Interface()); err != nil {
			return err
		}

		slicev = reflect.Append(slicev, elemp.Elem())
	}

	resultv.Elem().Set(slicev)

	return nil
}

func NewString(value string) *string {
	r := value
	return &r
}

func NewInt64(value int64) *int64 {
	r := new(int64)
	*r = value
	return r
}

func NewTrue() *bool {
	r := new(bool)
	*r = true
	return r
}
