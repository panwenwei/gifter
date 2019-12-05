const grpc =require('grpc')
const healthMessages = require('./proto/health_pb')
const healthServices = require('./proto/health_grpc_pb')

class server {
    storage = null 
    grpcServer = null
    port = null
    ip=null
    servserName = null

    /** 
     * 
     *Creates an instance of server.
     * @param {*} storage
     * @memberof server
     */
    constructor(storage){
        this.storage = storage
        this.grpcServer = new grpc.Server()
    }

    /**
     * 
     *   register('Greeter',services,{test:testFunc},{
     *      port:'50052',
     *      ip:'127.0.0.1',
     *      health:true
     *  })
     *
     * @param {*} servserName  注册的服务名
     * @param {*} services     注册的服务grpc
     * @param {*} serverFunc   注册的函数集合
     * @param {*} info         注册的服务详情
     * @memberof server
     */
    async register(servserName,services,serverFunc,info){
        this.servserName =servserName
        const {ip,port} = info
        this.ip = ip
        this.port = port
        const key = `${servserName}Service`
        const serverhandle = services[key]
        this.grpcServer.addService(serverhandle,serverFunc)
    }

    /**
     * 服务健康检测函数
     *
     * @param {*} call
     * @param {*} callback
     * @memberof server
     */
    Check(call,callback){
        const service = call.request.getService()
        const response = new healthMessages.HealthCheckResponse()
        response.setStatus('1')
        callback(null, response)
    }

    /**
     * 运行并注册服务
     *
     * @memberof server
     */
    async start(){
        // 添加健康检测函数
        this.grpcServer.addService(healthServices.HealthService, {check: this.Check})
         //绑定服务
        this.grpcServer.bind(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure())
        this.grpcServer.start()
        //服务注册 广播
        await  this.storage.put(`${this.servserName}@${this.ip}:${this.port}`,{
            port:this.port,
            ip:this.ip,
            name:this.servserName
        })
        console.log(`server run is ${this.port}`)
    }
}


module.exports = server
