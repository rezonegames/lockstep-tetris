package z

import "os"

func GetEnv() string {
	return os.Getenv("ENV")
}

func IsProd() bool {
	return GetEnv() == "prod"
}

func IsDev() bool {
	return GetEnv() == "dev"
}

func IsLocal() bool {
	return GetEnv() == "local"
}
