protoc --go_out=. *.proto

output_path=/Users/zyh/work/cocos-code/demo1-client/assets/Script/example/proto/
protoc  --plugin=/Users/zyh/.nvm/versions/node/v14.20.1/bin/protoc-gen-ts_proto \
--ts_proto_opt=esModuleInterop=true --ts_proto_opt=importSuffix=.js --ts_proto_opt=outputPartialMethods=false --ts_proto_opt=outputJsonMethods=false \
--ts_proto_out=${output_path} -I=. ./*.proto