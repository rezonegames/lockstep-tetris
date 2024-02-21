package test

import (
	"bytes"
	"flag"
	"fmt"
	"github.com/lonng/nano/benchmark/wsio"
	"github.com/lonng/nano/serialize/protobuf"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"testing"
	"tetris/pkg/z"
	proto2 "tetris/proto/proto"
	"time"
)

func client(deviceId, rid string) {
	ss := protobuf.NewSerializer()

	url := "http://127.0.0.1:8000/v1/login"
	aa := &proto2.AccountLoginReq{
		Partition: proto2.AccountType_DEVICEID,
		AccountId: deviceId,
	}
	input, _ := ss.Marshal(aa)
	req, err := http.NewRequest("POST", url, bytes.NewReader(input))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Content-Type", "application/x-protobuf")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Sprintf("Error http client do %+v", err)
		return
	}

	respData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Sprintf("Error reading response body: %v", err)
		return
	}
	respMsg := &proto2.AccountLoginResp{}
	if err := ss.Unmarshal(respData, respMsg); err != nil {
		fmt.Sprintf("Error unmarshaling response: %v", err)
		return
	}

	// 长链接
	c := wsio.NewConnector()
	chReady := make(chan struct{})
	c.OnConnected(func() {
		chReady <- struct{}{}
	})

	path := respMsg.Addr
	println(path, respMsg.UserId)
	if err := c.Start(path, "/nano"); err != nil {
		panic(err)
	}
	<-chReady

	chLogin := make(chan struct{})
	chEnd := make(chan interface{}, 0)

	uid := respMsg.UserId
	state := proto2.GameState_IDLE
	tableState := proto2.TableState_STATE_NONE

	if uid == 0 {
		c.Request("g.register", &proto2.RegisterGameReq{Name: deviceId, AccountId: aa.AccountId}, func(data interface{}) {
			chLogin <- struct{}{}

			v := proto2.LoginToGameResp{}
			ss.Unmarshal(data.([]byte), &v)
			ss.Unmarshal(data.([]byte), &v)
			fmt.Println(deviceId, "register", v)
		})
	} else {
		c.Request("g.login", &proto2.LoginToGame{UserId: uid}, func(data interface{}) {
			chLogin <- struct{}{}
			v := proto2.LoginToGameResp{}
			ss.Unmarshal(data.([]byte), &v)
			fmt.Println(deviceId, "login", v)
		})
	}
	<-chLogin

	// 状态变化
	c.On("onState", func(data interface{}) {
		v := proto2.GameStateResp{}
		ss.Unmarshal(data.([]byte), &v)
		state = v.State
		tableInfo := v.TableInfo

		if tableInfo != nil {

			tableState = tableInfo.TableState
			switch tableInfo.TableState {
			case proto2.TableState_WAITREADY:
				fmt.Println(tableState, tableInfo.Waiter.CountDown, tableInfo.Waiter.Readys)
			case proto2.TableState_CHECK_RES:
				fmt.Println(tableState)

			case proto2.TableState_SETTLEMENT:
				fmt.Println(tableState, tableInfo.LoseTeams)
			}

		} else {
			fmt.Println(deviceId, "onState", v.State)
		}
	})

	c.On("onFrame", func(data interface{}) {
		v := proto2.OnFrameList{}
		ss.Unmarshal(data.([]byte), &v)
		//for _, v0 := range v.FrameList {
		//	v0.PlayerList
		//}
		//fmt.Println(z.ToString(v))
	})

	ra := z.RandInt(1, 2)
	ticker := time.NewTicker(time.Duration(ra) * time.Second)
	defer ticker.Stop()
	bSendCheckRes := false

	//dida := 0
	isReady := false

	for {
		select {

		case <-chEnd:
			fmt.Println("游戏结束了", uid)
			c.Close()
			return
		case <-ticker.C:
			switch state {
			case proto2.GameState_IDLE:
				c.Request("r.join", &proto2.Join{
					RoomId: rid,
				}, func(data interface{}) {
					v := proto2.JoinResp{}
					ss.Unmarshal(data.([]byte), &v)
					if v.Code == proto2.ErrorCode_OK {
						state = proto2.GameState_WAIT
						bSendCheckRes = false
						isReady = false
						fmt.Println(deviceId, "join", state)

					} else {
						return
					}
				})
			case proto2.GameState_INGAME:

				switch tableState {
				case proto2.TableState_WAITREADY:
					if !isReady {
						c.Notify("r.ready", &proto2.Ready{})
						isReady = true
					}
					break
				case proto2.TableState_CHECK_RES:
					if !bSendCheckRes {
						c.Notify("r.loadres", &proto2.LoadRes{Current: 100})
						bSendCheckRes = true
					}
					break
				case proto2.TableState_GAMING:

					//dida++
					//if dida == 3 {
					//	c.Notify("r.update", &proto2.UpdateFrame{Action: &proto2.Action{
					//		Key: proto2.ActionType_END,
					//	}})
					//}

					break
				case proto2.TableState_SETTLEMENT:
					state = proto2.GameState_IDLE
					//dida = 0
					fmt.Println(deviceId, "round over")
				}
			}
		default:

		}
	}
}

var (
	args = flag.String("args", "1-1 1 1", "room robot.count mode")
)

func TestGame(t *testing.T) {
	// wait server startup
	flag.Parse()

	var (
		argList       = strings.Split(*args, " ")
		roomId        = argList[0]
		robotCount, _ = strconv.Atoi(argList[1])
	)

	wg := sync.WaitGroup{}
	for i := 0; i < robotCount; i++ {
		wg.Add(1)
		time.Sleep(50 * time.Millisecond)
		// 创建客户端
		go func(index int) {
			defer wg.Done()
			client(fmt.Sprintf("robot%d", index), roomId)
		}(i)
	}

	wg.Wait()

	t.Log("exit")
}

func TestWeb(t *testing.T) {
	al := proto2.AccountLoginReq{
		Partition: 0,
		AccountId: "11111",
	}

	s := protobuf.NewSerializer()
	data, err := s.Marshal(&al)
	if err != nil {
		fmt.Println("创建失败", err)
	}
	c := &http.Client{}

	url := "http://127.0.0.1:8000/v1/login"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		fmt.Println("请求失败", err)
	}
	req.Header.Set("Content-Type", "application/x-protobuf")
	resp, err := c.Do(req)
	if err != nil {
		fmt.Println("发送请求失败", err)
	}

	respData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Sprintf("Error reading response body: %v", err)
	}
	respMsg := &proto2.AccountLoginResp{}
	if err := s.Unmarshal(respData, respMsg); err != nil {
		fmt.Sprintf("Error unmarshaling response: %v", err)
	}
	defer resp.Body.Close()
}
