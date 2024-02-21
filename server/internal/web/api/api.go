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

	var (
		req proto.AccountLoginReq
		err error
	)

	err = zweb.BindProto(c, &req)
	if err != nil {
		goto EXIT
	}

	{
		var (
			partition = req.Partition
			accountId = req.AccountId
			userId    int64
			name      string
			config    = config.ServerConfig
			ip        string
			profile   *models.Profile
			account   *models.Account
		)

		if accountId == "" {
			goto EXIT
		}

		switch partition {
		case proto.AccountType_DEVICEID:
			fallthrough
		case proto.AccountType_FB:
			fallthrough
		case proto.AccountType_WX:
			account, err = models.GetAccount(accountId)
			if err != nil {
				if _, ok := err.(z.NilError); ok {
					account = models.NewAccount(int32(partition), accountId)
					err = models.CreateAccount(account)
					if err != nil {
						goto EXIT
					}
				} else {
					goto EXIT
				}
			}
			userId = account.UserId

			if userId != 0 {
				profile, err = models.GetProfile(userId, "name")
				if err == nil {
					name = profile.Name
				}
			}

		default:
			log.Error("queryHandler no account %d %s", partition, accountId)
			goto EXIT
		}

		ip, err = z.GetIp()
		if err != nil {
			goto EXIT
		}

		zweb.Response(c, &proto.AccountLoginResp{
			Code:   proto.ErrorCode_OK,
			UserId: userId,
			Addr:   fmt.Sprintf("%s%s", ip, config.Addr),
			Name:   name,
		})
		return
	}

EXIT:
	zweb.Response(c, &proto.AccountLoginResp{
		Code: proto.ErrorCode_UnknownError,
	})
}
