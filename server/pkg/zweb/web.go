package zweb

import (
	"github.com/gin-gonic/gin"
	"github.com/golang/protobuf/proto"
	protov2 "google.golang.org/protobuf/proto"
	"io/ioutil"
	"net/http"
)

func BindProto(c *gin.Context, form protov2.Message) error {
	data, err := ioutil.ReadAll(c.Request.Body)
	err = protov2.Unmarshal(data, form)
	if err != nil {
		return err
	}
	return nil
}

// Response setting gin.JSON
func Response(c *gin.Context, data proto.Message) {
	c.Header("Content-Type", "application/x-protobuf")
	c.ProtoBuf(http.StatusOK, data)
}
