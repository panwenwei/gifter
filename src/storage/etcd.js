const {Etcd3} = require('etcd3')
class giftEtcd {
    client = null
    hosts = '127.0.0.1:2379'
    prefix = 'server/'
    container = null // 容器
    ttl = 30  //租约时间也是健康检测时间
    constructor(param){
        const {hosts,prefix,ttl} = param
        this.hosts = hosts || this.hosts
        this.prefix = prefix || this.prefix
        this.ttl = ttl || this.ttl
        this.client = new Etcd3({hosts:this.hosts})
        this.lease = this.client.lease(this.ttl)
    }

    async put(key,value){
        if(key==null || value==null){
            throw new Error('添加服务参数缺少')
        }
        if(typeof value =='object'){
            value = JSON.stringify(value)
        }
        await this.lease.put(`${this.prefix}${key}`).value(value)
    }

    async get(key){
        return await this.client.get(key).string()
    }

    async getAll(){
       return  await this.client.getAll().strings()
    }

    async getPrefix(key){
        return  await this.client.getAll().prefix(key).strings()
    }

    
    async delete(key){
        console.log('删除',key)
        return await this.client.delete().key(`${this.prefix}${key}`)
    }

    /**
     * 拉取指定服务
     * @param {*} serverName 
     */
    async pull(serverName){
        const data =  await this.getPrefix(`${this.prefix}${serverName}`)
        if(data){
            //拉去
           Object.keys(data).forEach(async key=>{
               const item = JSON.parse(data[key]) 
               await this.container.add(item)
           })
        }

    }

    async pullAll(){
        const data =  await this.getPrefix(`${this.prefix}`)
        if(data){
            //拉去
           Object.keys(data).forEach(async key=>{
               const item = JSON.parse(data[key]) 
               await this.container.masterAdd(item)
           })
        }
    }

    /**
     * 开启监听
     *
     * @memberof giftEtcd
     */
    watch(serverName){
        this.client.watch()
        .prefix(`${this.prefix}${serverName}`)
        .create()
        .then(watcher=>{
            watcher.on('put',res =>  {
                console.log(`join server ${serverName} `)
                const Serverinfo =  JSON.parse(res.value.toString())
                this.container.add(Serverinfo)
            })
            watcher.on('connected', () => console.log('successfully reconnected!'))
            watcher.on('disconnected', () => console.log('disconnected...'))
            watcher.on('delete', res=> {
                console.log(`out server ${serverName}`)
                const deleteKey = (res.key.toString()).split(this.prefix)[1]
                this.container.remove(deleteKey)  
            })
        })
    }

    masterWatch(){
        this.client.watch()
        .prefix(`${this.prefix}`)
        .create()
        .then(watcher=>{
            watcher.on('put',res =>  {
                console.log(`join server ${serverName} `)
                const Serverinfo =  JSON.parse(res.value.toString())
                this.container.masterAdd(Serverinfo)
            })
            watcher.on('connected', () => console.log('successfully reconnected!'))
            watcher.on('disconnected', () => console.log('disconnected...'))
            watcher.on('delete', res=> {
                const deleteKey = (res.key.toString()).split(this.prefix)[1]
                this.container.remove(deleteKey)  
                this.container.masterRemove(deleteKey)  
            })
        })
    }


    keepalive(){
        this.lease.on("keepaliveSucceeded",err=>{
                //需要健康检测
                this.container.checkAll()
        })
    }



}


module.exports = giftEtcd