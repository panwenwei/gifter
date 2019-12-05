const grpc = require('grpc')
const healthMessages = require('./proto/health_pb');
const healthServices = require('./proto/health_grpc_pb');

const {retry} = require('./tools')

class container {
    servers = {}            // map
    keys = {}               //负载
    clientHandle = {}       //grpc handle
    serverlist = {}         // grpc 客户端连接池
    masterServerList = {}   // 主服客户端连接池
    storage = null 

    /**
     *Creates an instance of container.
     * @param {*} storage
     * @memberof container
     */
    constructor(storage){
        this.storage = storage
    }

    /**
     * 主服务的健康检测
     *
     * @memberof container
     */
    async checkAll (){
        Object.keys(this.masterServerList).forEach(async key=>{
            const client = this.masterServerList[key]
            const message =  new healthMessages.HealthCheckRequest()
            message.getService('SERVING')
            client.ping(message).then(res=>{
            })
        })
    }


    /**
     *  添加主服务连接
     *
     * @param {*} serverInfo
     * @memberof container
     */
    async masterAdd( serverInfo ){
        const {ip,port,name} = serverInfo 
        const serverKey = `${name}@${ip}:${port}` 
        const client = await new healthServices.HealthClient(`${ip}:${port}`,grpc.credentials.createInsecure())
        client['ping'] = async  (...args)=>{
            return await retry(3,async ()=>{
                   client.check(...args, async (err,response)=>{
                    return new Promise ((resolve, reject) =>{
                        if(err){
                            if(err.code===14){
                                 this.storage.delete(serverKey)
                                 //删除连接
                            }else{
                                 reject({error:'Gateway error'})
                            }
                         }else{
                             console.log(serverKey,response.array[0])
                            resolve(response)
                         }
                    })
                })
            })
        }
        this.masterServerList[serverKey] = client
        this.storage.masterWatch()
    }

    /**
     * 绑定关联链接池
     *
     * @param {*} name
     * @param {*} clientHandle
     * @memberof container
     */
    async bindHandle(name,clientHandle){
        this.clientHandle[name] = clientHandle
        const serverArray = this.servers[name]
        if(!serverArray){
            this.storage.watch(name)
            //拉去服务
            return
        }
    }

    /**
     * 添加服务
     * @param {*} serverInfo 
     */
    async add(serverInfo){
        const {ip,port,name} = serverInfo  
        const serverKey = `${name}@${ip}:${port}`
        //判断服务集群是否存在没有的话创建
        const currentServers = this.servers[name]
        if(!currentServers){
        // 未存在开始创建
            const tmepServer = []
            tmepServer.push(serverKey)
            this.servers[name] = tmepServer
        }else{
            const index = currentServers.indexOf(serverKey)
                if(index<0){
                    this.servers[name].push(serverKey) 
                }
        }
        if(!this.clientHandle[name]){
            return
        }
        const client = await new this.clientHandle[name](`${ip}:${port}`,grpc.credentials.createInsecure())
       for(let service in this.clientHandle[name]){
            const funcArr = this.clientHandle[name][service]
            const giftMethods = {}
            for(let funcName in funcArr) {
                giftMethods[funcName] = async  (...args)=>{
                    const res = await retry(3,async ()=>{
                        return new Promise ((resolve, reject) =>{
                                client[funcName](...args,async (err,response)=>{
                                    if(err){
                                       if(err.code===14){
                                            this.remove(serverKey)
                                            this.storage.delete(serverKey)
                                            console.log('删除服务')
                                            //切换连接
                                            resolve({message:'NEXT'})
                                       }else{
                                            reject({error:'Gateway error'})
                                       }
                                    }
                                    resolve(response)
                                })
                        }) 
                    })
                    if(res['message']==='NEXT'){
                        const tempres = await this.nextFunc(name,funcName,...args)
                        return tempres
                    }else{
                        return res
                    }
                } 
            }
            client['giftMethods'] = giftMethods
       }
        this.serverlist[serverKey] = client
        if(!this.keys[name]){
            this.keys[name] = {
                index:0
            }
        }

    }

     /**
     * 如果函数无法执行调用下一个连接的函数
     * @param {*} name 
     * @param {*} funcName 
     * @param  {...any} args 
     */
    async nextFunc(name,funcName,...args){
        let res = null
        const clientTemp = await this.get(name)
        if(clientTemp){
            return await clientTemp[funcName](...args)
        } 
        return res
    }


    /**
     * 移除服务
     * @param {*} key 
     */
    async remove(key){
        const serverName = key.split('@')[0]
        this.servers[serverName].splice(this.servers[serverName].indexOf(key),1)
        // 应该先关闭连接再删除
        delete this.serverlist[key]
    }

     /**
     * 删除主服
     * @param {*} key 
     */
    async masterRemove(key){
        // 应该先关闭连接再删除
        delete this.masterServerList[key]
    }

    /**
     * 获得服务
     *
     * @memberof container
     */
    async get(name){
        const serverArray = this.servers[name]
        if(!serverArray){
            //开启监听
            this.storage.watch(name,this)
            //拉去服务
            await this.storage.pull(name,this)
            return
        }
        if(serverArray.length==0){
            return null
        }
        const client = await this.lb(serverArray,name)
        return client['giftMethods']

    }

    /**
     * 服务器连接论选
     * @param {*} serverArray 
     * @param {*} name 
     */
    async lb(serverArray,name){
        const {index} = this.keys[name]
        const clientlen = serverArray.length
        const lbKey = index % clientlen
        const clientKey = serverArray[lbKey]
        const client = this.serverlist[clientKey]
        if(index>=clientlen-1){
            this.keys[name]['index'] = 0
        }else{
            this.keys[name]['index'] = index + 1
        }
        return client
    }


}


module.exports = container