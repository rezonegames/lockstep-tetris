package z

import (
	"fmt"
	"go.mongodb.org/mongo-driver/x/bsonx/bsoncore"
	"strconv"
	"strings"
)

type Intslice []int

func (is *Intslice) UnmarshalBSON(data []byte) error {
	s, _, ok := bsoncore.ReadString(data)
	if !ok {
		return fmt.Errorf("invalid bson string value")
	}
	sa := strings.Split(s, ",")

	for _, c := range sa {
		if v, err := strconv.Atoi(strings.TrimSpace(c)); err == nil {
			*is = append(*is, v)
		} else {
			return err
		}
	}
	return nil
}

// NilError nil error for db
type NilError struct {
	Msg string
}

func (e NilError) Error() string {
	return fmt.Sprintf("Error nil %s", e.Msg)
}
