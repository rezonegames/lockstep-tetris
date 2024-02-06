package web

import (
	"bytes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"io"
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

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()
		bodyBytes, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		url := c.Request.URL.Path
		//log.Info("request url %s body %+v", url, string(bodyBytes))
		w := &responseBodyWriter{body: &bytes.Buffer{}, ResponseWriter: c.Writer}
		c.Writer = w
		c.Next()
		latency := time.Since(t)
		log.Info("response for url %s latency %+v body %s resp %s", url, latency, string(bodyBytes), w.body.String())
	}
}

func Register(r *gin.Engine) {
	/**
	 */
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
