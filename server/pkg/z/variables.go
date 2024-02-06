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

// NilError nil error
type NilError struct {
	Msg string
}

func (e NilError) Error() string {
	return fmt.Sprintf("Error nil %s", e.Msg)
}

// ValidError nil error
type ValidError struct {
	Msg string
}

func (e ValidError) Error() string {
	return fmt.Sprintf("Valid err %s", e.Msg)
}

// OtherError normal error
type OtherError struct {
	Msg string
}

func (e OtherError) Error() string {
	return fmt.Sprintf("Other err %s", e.Msg)
}

// LockError lock error
type LockError struct {
	Key string
}

func (e LockError) Error() string {
	return fmt.Sprintf("Lock Error %s", e.Key)
}
