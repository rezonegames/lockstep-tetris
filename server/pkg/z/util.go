package z

import (
	"encoding/json"
	"fmt"
	"github.com/getsentry/raven-go"
	"math/rand"
)

// 注：在server启动的时候已经向全局rand.Default生成了随机种子，这里不用每次都new一个新Rand对象出来
// RandInt 区间随机数 [min, max]
func RandInt(min, max int) int {
	if min >= max || max == 0 {
		return max
	}
	return rand.Intn(max+1-min) + min
}

// RandInt32 区间随机数 [min, max]
func RandInt32(min, max int32) int32 {
	if min >= max || max == 0 {
		return max
	}
	return rand.Int31n(max+1-min) + min
}

// RandInt64 区间随机数 [min, max]
func RandInt64(min, max int64) int64 {
	if min >= max || max == 0 {
		return max
	}
	return rand.Int63n(max+1-min) + min
}

func ToString(v interface{}) string {
	out, err := json.Marshal(v)
	if err != nil {
		return ""
	}
	return string(out)
}

func Safe(f func()) {
	defer func() {
		if r := recover(); r != nil {
			raven.CaptureError(fmt.Errorf("goroutine recover"), nil)
		}
	}()
	f()
}
