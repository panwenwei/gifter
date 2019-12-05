class client {
    storage = null 
    container = null 
    isMaster = false 

    /**
     *Creates an instance of client.
     * @param {*} storage
     * @param {*} container
     * @memberof client
     */
    constructor(storage,container){
        this.container = container
        this.storage = storage
    }

    /**
     *
     *
     * @param {*} name
     * @memberof client
     */
    async get(name){
        return await this.container.get(name)  
    }
    
    /**
     * 
     *
     * @param {*} name
     * @param {*} clientHandle
     * @returns
     * @memberof client
     */
    async bind(name,clientHandle){
        clientHandle = clientHandle[`${name}Client`]
        return await this.container.bindHandle(name,clientHandle)
    }
}



module.exports = client