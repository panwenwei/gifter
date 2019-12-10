> 这个是一个关于nodejs基于grpc采用etcd进行的服务发现注册。

# 环境准备
 
grpc必须采用静态编译方式书写接口

## etcd 的安装以及开启

需要golang环境进行编译 https://etcd.io/docs/v3.4.0/dl_build/ 如果是mac平台可直接菜用brew安装即可，当然你也可以直接使用docker运行

## 简单使用


### 安装gifter

```bash
    npm install gifter   
```

### 客户端

```node
    const messages = require('./proto/proto/test_pb')
    const services = require('./proto/proto/test_grpc_pb')
    const Gift = require('gift')
    const http = require('http')

    const gift = new Gift()
    const client =  gift.client()
    client.bind('Greeter',services)

    http.createServer(async function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<h1>Node.js</h1>');
      if(req.url==='/'){
            const Greeter = await  client.get('Greeter')
            var request = new messages.HelloRequest();
            var user = 'wenwen';
            request.setName(user);
              if(Greeter){
                const data = await Greeter.sayHello(request)
                if(data){
                  const h =  data.getMessage()
                  res.end(`<p>${h}</p>`);
                  return 
                }else{
                  res.end(`<p>server miss</p>`);
                }
              }
              res.end(`<p>server miss</p>`);
          }
      }).listen(3000);
    console.log("HTTP server is listening at port 3000.");

```

### 主服

> 负责服务的健康检测。

```node
    const Gift = require('gift')
    const gift = new Gift()
    const server =  gift.master()
```


### 服务端



```node
    const messages = require('./proto/proto/test_pb');
    const services = require('./proto/proto/test_grpc_pb');
    const Gift = require('gift')

    function sayHello(call, callback) {
        const reply = new messages.HelloReply();
        console.log('被请求了1')
        reply.setMessage('server 1 : Hello ' + call.request.getName());
        callback(null, reply);
    }

    function sayHello2(call, callback) {
        const reply = new messages.HelloReply();
        console.log('被请求了2')
        reply.setMessage('server 2 : Hello ' + call.request.getName());
        callback(null, reply);
    }


    const ser =  {
        sayHello
    }

    const ser2 = {
        sayHello:sayHello2
    }

    const gift = new Gift()
    const giftSer = gift.server()

    giftSer.register('Greeter',services,ser,{
        port:'50051',
        ip:'127.0.0.1',
        health:true
    })

    giftSer.start()

    const gift1 = new Gift()
    const giftSer1= gift1.server()
    giftSer1.register('Greeter',services,ser2,{
        port:'50052',
        ip:'127.0.0.1',
        health:true
    })
    giftSer1.start()
```


