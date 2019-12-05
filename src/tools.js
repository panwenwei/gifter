// 重试
const  retry = (retries, fn) => {
    return fn().catch((err) => retries > 1 ? retry(retries - 1, fn) :  Promise.reject(err))
}

module.exports = {
    retry
}