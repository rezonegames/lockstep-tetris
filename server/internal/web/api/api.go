package api

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"tetris/config"
	"tetris/models"
	"tetris/pkg/log"
	"tetris/pkg/z"
	"tetris/pkg/zweb"
	"tetris/proto/proto"
)

// QueryHandler 登录，如果玩家没有注册，自动注册之，只实现一种deviceId登录， todo：host暂时写死
func QueryHandler(c *gin.Context) {
	var req proto.AccountLoginReq
	err := zweb.BindProto(c, &req)
	if err != nil {
		zweb.Response(c, &proto.AccountLoginResp{
			Code: proto.ErrorCode_UnknownError,
		})
		return
	}

	partition := req.Partition
	accountId := req.AccountId
	if accountId == "" {
		zweb.Response(c, &proto.AccountLoginResp{
			Code: proto.ErrorCode_UnknownError,
		})
		return
	}
	var userId int64
	switch partition {
	case proto.AccountType_DEVICEID:
		fallthrough
	case proto.AccountType_FB:
		fallthrough
	case proto.AccountType_WX:
		a, err := models.GetAccount(accountId)
		if err != nil {
			if _, ok := err.(z.NilError); ok {
				a = models.NewAccount(int32(partition), accountId)
				err = models.CreateAccount(a)
				if err != nil {
					zweb.Response(c, &proto.AccountLoginResp{
						Code: proto.ErrorCode_UnknownError,
					})
					return
				}
			} else {
				zweb.Response(c, &proto.AccountLoginResp{
					Code: proto.ErrorCode_UnknownError,
				})
				return
			}
		}
		userId = a.UserId
	default:
		log.Error("queryHandler no account %d %s", partition, accountId)
		zweb.Response(c, &proto.AccountLoginResp{
			Code: proto.ErrorCode_UnknownError,
		})
		return
	}

	var name string
	if userId != 0 {
		if p, err := models.GetProfile(userId, "name"); err == nil {
			name = p.Name
		}
	}
	sc := config.ServerConfig
	ip, err := z.GetIp()
	if err != nil {
		zweb.Response(c, &proto.AccountLoginResp{
			Code: proto.ErrorCode_UnknownError,
		})
		return
	}
	resp := &proto.AccountLoginResp{
		Code:   proto.ErrorCode_OK,
		UserId: userId,
		Addr:   fmt.Sprintf("%s%s", ip, sc.Addr),
		Name:   name,
	}
	zweb.Response(c, resp)
}
