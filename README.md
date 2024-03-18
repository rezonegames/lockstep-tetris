介绍

```
不知道你们有没有玩过火拼俄罗斯方块，可以发送道具，消三层，敌人加一层等等的道具玩法？
项目是帧同步，不过传输层用的是tcp，协议为websocket，如果想迁移到其它的协议，可以扩展mynano。
gate可以运行多种协议，供不同平台的客户端连接。
```

git submodle使用

```
https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E5%AD%90%E6%A8%A1%E5%9D%97
```



```
启动数据库mongo
version: "3"
services:
  master:
    image: mongo:5.0.0
    volumes:
      - ./data/:/data/db
      - ./tools/:/data/tools
    command: mongod --bind_ip_all
    ports:
      - 27017:27017

启动 docker-compose up -d
```

启动缓存redis

```angular2html
version: '2'
services:
  redis:
    image: redis
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - ./data:/data

启动 docker-compose up -d
```

服务器配置

```angular2html
./server/bin/server.yaml
配置里包括数据库地址，房间配置，也可拆出
```

服务器创建机器人

```
go test -v io_test.go -args="1-1（房间） 2（人数） 1（模式）"
模式指的是快速匹配，还是自建桌
```

linux打包

```angular2html
./server/bin/build.sh
将生成的文件拷贝到目标服务器，运行之，也可放入docker
```

客户端

```angular2html
客户端使用的是cocos creator = 3.8.0
1.第一个场景加载资源
2.加载完，运行第二个场景main.scene，通过game.init启动初始界面
```

```

```
