package log

import (
	"github.com/sirupsen/logrus"
	"os"
	"tetris/pkg/z"
)

var log = logrus.New()

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

func Info(format string, v ...interface{}) {
	log.Infof(format, v...)
}

func Warn(format string, v ...interface{}) {
	log.Warnf(format, v...)
}

func Debug(format string, v ...interface{}) {
	log.Debugf(format, v...)
}

func Error(format string, v ...interface{}) {
	log.Errorf(format, v...)
}

func Fatal(v ...interface{}) {
	log.Fatal(v...)
}
