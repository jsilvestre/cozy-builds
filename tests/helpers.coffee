http = require 'http'
Client = require('request-json-light').JsonClient
logger = require('printit')
    date: false
    prefix: 'tests:helper'
helpers = {}
fs = require 'fs'
exec = require('child_process').exec
controller = require '../server/lib/controller'

path = require('path')

# Mandatory
process.env.TOKEN = "token"

if process.env.COVERAGE
    helpers.prefix = '../instrumented/'
else if process.env.USE_JS
    helpers.prefix = '../build/'
else
    helpers.prefix = '../'

# server management
helpers.options =
    serverHost: process.env.HOST or "localhost"
    #serverPort: process.env.PORT or 8888

    # default port must also be changed in server/lib/feed.coffee
    axonPort: parseInt process.env.AXON_PORT or 9105

# default client
client = new Client "http://localhost:9002/"

# set the configuration for the server
#process.env.HOST = helpers.options.serverHost
#process.env.PORT = helpers.options.serverPort

# Returns a client if url is given, default app client otherwise
helpers.getClient = (url = null) ->
    if url?
        return new Client url
    else
        try
            token = fs.readFileSync "/etc/cozy/stack.token", 'utf8'
            client.setToken(token)
        catch error

        return client

initializeApplication = (callback) ->
    src = path.join(path.dirname(fs.realpathSync(__filename)), '..', 'lib')
    require(path.join(src, "#{helpers.prefix}server"))(callback)

helpers.startApp = (callback) ->
    initializeApplication (err, app, server) =>
        console.log err if err?
        @app = app or {}
        @app.server = server
        callback app

helpers.stopApp = (done) ->
    setTimeout =>
        @app.server.close ->
            setTimeout done, 6000
    , 250

helpers.stopCouchDB = (done) ->
    exec 'service couchdb stop', (err) ->
        console.log err if err?
        done()

helpers.startCouchDB = (done) ->
    exec 'service couchdb start', (err) ->
        console.log err if err?
        done()


helpers.clearDB = (db) -> (done) ->
    logger.info "Clearing DB..."
    db.destroy (err) ->
        logger.info "\t-> Database destroyed!"
        if err and err.error isnt 'not_found'
            logger.info "db.destroy err: ", err
            return done err

        setTimeout ->
            logger.info "Waiting a bit..."
            db.create (err) ->
                logger.info "\t-> Database created"
                logger.info "db.create err: ", err if err
                done err
        , 1000

helpers.cleanApp = (done) ->
    if @timeout?
        @timeout 10000
    if fs.existsSync '/etc/cozy/stack.token'
        fs.unlinkSync '/etc/cozy/stack.token'
    if fs.existsSync '/usr/local/cozy/apps/stack.json'
        fs.unlinkSync '/usr/local/cozy/apps/stack.json'
    if fs.existsSync '/usr/local/cozy/stack.json'
        fs.unlinkSync '/usr/local/cozy/stack.json'
    if fs.existsSync '/usr/local/cozy/apps/data-system'
        exec 'rm -rf /usr/local/cozy/apps/data-system', (err,out) ->
            console.log err
            if fs.existsSync '/usr/local/cozy/apps/home'
                exec 'rm -rf /usr/local/cozy/apps/home', (err,out) ->
                    console.log err
                if fs.existsSync '/usr/local/cozy/apps/proxy'
                    exec 'rm -rf /usr/local/cozy/apps/proxy', (err,out) ->
                        console.log err
                        done()
            else
                done()
    else
        done()


helpers.randomString = (length=32) ->
    string = ""
    string += Math.random().toString(36).substr(2) while string.length < length
    string.substr 0, length

helpers.fakeServer = (json, code=200, callback=null) ->
    http.createServer (req, res) ->
        body = ""
        req.on 'data', (chunk) ->
            body += chunk
        req.on 'end', ->
            res.writeHead code, 'Content-Type': 'application/json'
            if callback?
                data = JSON.parse body if body? and body.length > 0
                result = callback req.url, data
            resbody = if result then JSON.stringify result
            else JSON.stringify json
            res.end resbody


helpers.Subscriber = class Subscriber
    calls:[]
    callback: ->
    wait: (callback) ->
        @callback = callback
    listener: (channel, msg) =>
        @calls.push channel:channel, msg:msg
        @callback()
        @callback = ->
    haveBeenCalled: (channel, msg) =>
        @calls.some (call) ->
            call.channel is channel and call.msg is msg

module.exports = helpers
