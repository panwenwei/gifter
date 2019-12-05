const messages = require('./proto/proto/test_pb');
const services = require('./proto/proto/test_grpc_pb');
const Gift = require('../src/index')

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

const gift = new Gift({})
const giftSer = gift.server()

giftSer.register('Greeter',services,ser,{
    port:'50051',
    ip:'127.0.0.1',
    health:true
})

giftSer.start()



const gift1 = new Gift({})
const giftSer1= gift1.server()
giftSer1.register('Greeter',services,ser2,{
    port:'50052',
    ip:'127.0.0.1',
    health:true
})
giftSer1.start()