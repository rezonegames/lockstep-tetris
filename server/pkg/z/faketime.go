package z

import (
	"sync"
	"time"
)

var StartTime = time.Date(2014, 1, 1, 0, 0, 0, 0, time.UTC)
var StartTimeNano = StartTime.UnixNano()

var timeDiff struct {
	sync.RWMutex
	diff time.Duration
}

func SetTimeDiff(datetime string) {
	var diff time.Duration
	if datetime == "" {
		return
	}
	diff, err := time.ParseDuration(datetime)
	if err != nil {
		return
	}
	timeDiff.Lock()
	defer timeDiff.Unlock()
	timeDiff.diff = diff
}

func GetTime() time.Time {
	t := time.Now()
	timeDiff.RLock()
	defer timeDiff.RUnlock()

	if !IsProd() {
		t = t.Add(timeDiff.diff)
	}

	return t
}

func Day0Unix() int64 {
	t := GetTime()
	t0 := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
	return t0.Unix()
}

func Hour0Unix(offset int) int64 {
	t := GetTime()
	t0 := time.Date(t.Year(), t.Month(), t.Day(), t.Hour()+offset, 0, 0, 0, t.Location())
	return t0.Unix()
}

func NowUnixMilli() int64 {
	return GetTime().UnixMilli()
}

func NowUnix() int64 {
	return GetTime().Unix()
}

func IsSameWeek(milliSec int64) bool {
	nowMilli := NowUnixMilli()
	return ((milliSec - 345600000) / 604800000) == ((nowMilli - 345600000) / 604800000)
}

// 相对起点的时间
func RelativeTimestamp() int64 {
	t := time.Now()
	d := int64(t.UnixNano()-StartTimeNano) / int64(time.Second)
	return d
}
