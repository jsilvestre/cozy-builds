# Simple HTTP client to request backend easily.
module.exports =
    get: (url, callbacks) ->
        $.ajax
            type: 'GET'
            url: url
            success: (response) ->
                if response.success
                    callbacks.success response
                else
                    callbacks.error response
            error: (response) ->
                callbacks.error response

    post: (url, data, callbacks) ->
        $.ajax
            type: 'POST'
            url: url
            data: JSON.stringify data
            dataType: "json"
            success: (response) ->
                if response.success
                    callbacks.success response
                else
                    callbacks.error response
            error: (response) ->
                callbacks.error response

