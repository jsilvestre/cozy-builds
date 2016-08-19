request = require("request-json")

client = request.createClient "http://localhost:9101/"


module.exports = class Adapter

    updateKeys: (pwd, callback) ->

        # Authentication required by the Data System
        if process.env.NODE_ENV in ['production', 'test']

            name = process.env.NAME
            token = process.env.TOKEN
            client.setBasicAuth name, token

        # Update password
        client.put "accounts/password/", password: pwd, (err, res, body) ->
            callback err

    initializeKeys: (pwd, callback) ->

        # Authentication required by the Data System
        if process.env.NODE_ENV in ['production', 'test']

            name = process.env.NAME
            token = process.env.TOKEN
            client.setBasicAuth name, token

        # Update password
        client.post "accounts/password/", password: pwd, (err, res, body) ->
            callback err


    updateUser: (user, data, callback) ->

        # Authentication required by the Data System
        if process.env.NODE_ENV in ['production', 'test']

            name = process.env.NAME
            token = process.env.TOKEN
            client.setBasicAuth name, token

        # Update password
        client.put "user/merge/#{user.id}", data, (err, res, body) ->
            callback err

