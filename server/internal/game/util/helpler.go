package util

import (
	"github.com/lonng/nano/session"
	"tetris/models"
	"tetris/pkg/z"
	"tetris/proto/proto"
)

func ConvProfileToProtoProfile(p *models.Profile) *proto.Profile {
	var (
		itemList = make([]*proto.Item, 0)
	)

	for k, v := range p.Items {
		itemList = append(itemList, &proto.Item{
			Key: k,
			Val: v,
		})
	}
	return &proto.Profile{
		Name:     p.Name,
		ItemList: itemList,
		UserId:   p.UserId,
	}
}

// BindUser todo：如果是集群模式，使用remote方法同步profile数据，并保存到session
func BindUser(s *session.Session, p *models.Profile) error {
	err := s.Bind(p.UserId)
	if err != nil {
		return err
	}
	s.Set("profile", p)
	return nil
}

func GetProfile(s *session.Session) (*models.Profile, error) {
	var (
		profile = s.Value("profile")
	)
	if v, ok := profile.(*models.Profile); ok {
		return v, nil
	}
	return nil, z.NilError{}
}
