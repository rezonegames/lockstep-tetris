package config

import (
	"fmt"
	"gopkg.in/yaml.v3"
	"os"
	"path/filepath"
)

var (
	ServerConfig = &Server{}
)

func InitServerConfig() {
	serverConfigPath := "/configVolume/app.yaml"
	if _, err := os.Stat(serverConfigPath); os.IsNotExist(err) {
		exec, _ := os.Executable()
		workingDir := filepath.Dir(exec)
		serverConfigPath = fmt.Sprintf("%s/server.yaml", workingDir)
	}
	err := readYaml(serverConfigPath, ServerConfig)
	if err != nil {
		panic("InitServerConfig read app config error !!!")
	}
}

func readYaml(filename string, v any) error {
	data, err := os.ReadFile(filename)
	if err != err {
		return err
	}
	return yaml.Unmarshal(data, v)
}
