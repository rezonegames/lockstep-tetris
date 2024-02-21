package web

import (
	"bytes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"tetris/config"
	"tetris/internal/web/api"
	"tetris/pkg/log"
	"time"
)

type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// Logger todo：protobuf的logger如何处理
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {

		var (
			t = time.Now()
		)

		url := c.Request.URL.Path
		c.Next()
		latency := time.Since(t)

		var (
			param, _ = c.Get("body")
			resp, _  = c.Get("resp")
		)

		log.Info("url: %s latency: %+v body: %+v resp: %+v", url, latency, param, resp)
	}
}

func Register(r *gin.Engine) {
	r.POST("/v1/login", api.QueryHandler)
}

func StartUp() {
	sc := config.ServerConfig

	r := gin.New()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowCredentials: true,
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"x-checksum"},
	}))
	r.Use(Logger())
	Register(r)
	srv := &http.Server{
		Addr:    sc.ServerPort,
		Handler: r,
	}
	go func() {
		err := srv.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			return
		}
	}()
	sg := make(chan os.Signal)
	signal.Notify(sg, syscall.SIGINT, syscall.SIGQUIT, syscall.SIGKILL)
	// stop server
	select {
	case s := <-sg:
		log.Info("got signal: %s", s.String())
	}
}
