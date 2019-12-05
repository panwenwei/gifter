const grpc = require('grpc')
const healthMessages = require('./proto/health_pb')
const healthServices = require('./proto/health_grpc_pb')

class master {
    storage = null 
    container = null
    serverData = null  

    /**
     *Creates an instance of master.
     *  拉去并挂载全部服务
     * @param {*} storage
     * @param {*} container
     * @memberof master
     */
    constructor(storage,container){
        this.container = container
        this.storage = storage
    }


     /**
     *  加载
     */
    async downAll(){
        await this.storage.pullAll()
        await this.storage.keepalive()
    }

}


module.exports = master