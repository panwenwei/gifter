const messages = require('./proto/proto/test_pb')
const services = require('./proto/proto/test_grpc_pb')
const Gift = require('../src/index')
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


