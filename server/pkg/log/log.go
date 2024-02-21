package log

import (
	"github.com/sirupsen/logrus"
	"os"
	"tetris/pkg/z"
)

var log = logrus.New()

var (
	Info  = log.Infof
	Warn  = log.Warnf
	Debug = log.Debugf
	Error = log.Errorf
	Fatal = log.Fatal
)

func InitLog() {
	if z.IsLocal() {
		log.Out = os.Stdout
		log.SetLevel(logrus.DebugLevel)
	} else {
		file, err := os.OpenFile("logrus.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			log.Out = file
		} else {
			log.Info("Failed to log to file, uusing default stderr")
		}
		log.SetLevel(logrus.InfoLevel)
	}
	logrus.SetFormatter(&logrus.JSONFormatter{})
	Info("The log ok")
}

func GetLogger() *logrus.Logger {
	return log
}
