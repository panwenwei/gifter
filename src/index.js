'use strict';

const storage  = require('./storage')
const server = require('./server')  //服务注册
const master = require('./master')
const client = require('./client')
const container = require('./container')


class Gift {
    storage = null          
    giftServer = null       
    giftClient = null
    giftMaster = null
    giftContainer = null

    /**
     * Example  暂时未去实现ssl
     *  new gift({
     *   hosts:'127.0.0.1:2379',
     *   prefix:'server/'
     *  })
     * @param {*} param 
     */
    constructor(param={}){
        this.storage = new storage(param)
        this.giftContainer = new container(this.storage)
        this.storage.container = this.giftContainer
    }

    /**
     * 实例化注册服务
     *
     * @returns
     * @memberof Gift
     */
    server(){
        if(!this.giftServer){
            this.giftServer = new server(this.storage,this.giftContainer)
        }
        return  this.giftServer
    }

    /**
     * 实例化客服端与服务发现
     *
     * @returns
     * @memberof Gift
     */
    client(){
        if(!this.giftClient){
            this.giftClient = new client(this.storage,this.giftContainer)
        }
        return this.giftClient
    }

     /**
     * 实例化主服务
     * 负责健康检测·在线服务监控·等。。。
     * @memberof Gift
     */
    async master(){
        if(!this.giftMaster){
            this.giftMaster = new master(this.storage,this.giftContainer)
            await this.giftMaster.downAll()
        }
        return  this.giftMaster
    }
}


module.exports = Gift
