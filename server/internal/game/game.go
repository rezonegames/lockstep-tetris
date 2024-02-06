package game

import (
	"github.com/lonng/nano"
	"github.com/lonng/nano/component"
	"github.com/lonng/nano/serialize/protobuf"
	"net/http"
	"strings"
	"tetris/config"
	"tetris/internal/game/room"
	service2 "tetris/internal/game/service"
	"tetris/pkg/log"
	"time"
)

func StartUp() {
	sc := config.ServerConfig
	services := &component.Components{}

	// todo: 可以按照room类型做分服，暂时没有按照gate分服

	// gate
	{
		service := service2.NewGateService()
		opts := []component.Option{
			component.WithName("g"),
			component.WithNameFunc(func(s string) string {
				return strings.ToLower(s)
			}),
		}
		services.Register(service, opts...)
	}

	// rooms
	{
		service := service2.NewRoomService()
		opts := []component.Option{
			component.WithName("r"),
			component.WithNameFunc(func(s string) string {
				return strings.ToLower(s)
			}),
		}
		for _, v := range sc.Rooms {
			r := room.NewRoom(v)
			service.AddRoomEntity(v.RoomId, r)
		}
		services.Register(service, opts...)
	}

	opts := []nano.Option{
		//nano.WithDebugMode(),
		// websocket
		nano.WithWSPath("/nano"),
		nano.WithIsWebsocket(true),
		// 心跳
		nano.WithHeartbeatInterval(30 * time.Second),
		nano.WithLogger(log.GetLogger()),
		nano.WithComponents(services),
		nano.WithSerializer(protobuf.NewSerializer()),
		nano.WithCheckOriginFunc(func(request *http.Request) bool {
			return true
		}),
	}

	nano.Listen(sc.Addr, opts...)
}
