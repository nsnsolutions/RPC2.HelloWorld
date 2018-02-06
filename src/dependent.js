"use strict";

const util = require("util");

module.exports = function Dependent() { };
module.exports.preload = function DependentPreload() {

    const seneca = this;
    let dynamoClient, redisClient;

    seneca.rpc.add("role:dependent,inject:DocumentClient", getDocumentClient);
    seneca.rpc.add("role:dependent,inject:redis", getRedisClient);
    seneca.rpc.add("role:dependent,inject:got", async () => require("got"));

    seneca.add({ init: module.exports.name }, (args, done) => {
        init()
            .then(() => done())
            .catch((err) => done(err));
    });

    this.sub("role:seneca,cmd:close,closing$:true", shutdown);

    return { name: module.exports.name };

    // ------------------------------------------------------------------------

    async function init() { }

    async function shutdown() { 
        if (redisClient) {
            redisClient.quit();
        }
    }

    async function getDocumentClient() {

        if (!dynamoClient) {
            const AWS = require("aws-sdk");
            dynamoClient = new AWS.DynamoDB.DocumentClient();
        }

        return dynamoClient;
    }

    async function getRedisClient() {

        if (!redisClient) {
            const uri = await seneca.env.get("common.redisUrl");
            redisClient = _createRedisClient(uri);
        }

        return redisClient;
    }

    function _createRedisClient(uri) {

        const redis = require("redis");
        const client = redis.createClient(uri);

        client.on("error", (err) => seneca.log.warn({ msg: `Redis Error: ${err}` }));
        client.on("ready", () => seneca.log.info({ msg: "Redis Connected: Ready"}));

        // Promisify common functions for ease of use.
        client.getAsync = util.promisify(client.get).bind(client);
        client.setAsync = util.promisify(client.set).bind(client);
        client.exprAsync = util.promisify(client.expire).bind(client);

        return client;
    }
};
