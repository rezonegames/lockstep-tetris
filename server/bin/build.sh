#!/bin/bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}")" && pwd )
ROOT=$DIR/

pushd $ROOT/../
echo 'Building server...'
export GO111MODULE=on
GOOS=linux GOARCH=amd64 go build -ldflags "-X main.buildTime=$BUILD_TIME -X main.buildTimeStr=`date "+%Y-%m-%d,%H:%M:%S"` -X main.version=local" -o ${DIR}/server
popd