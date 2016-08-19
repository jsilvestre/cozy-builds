cozydb = require 'cozydb'

# Object required to store the automatically generated webdav credentials.
module.exports = CozyInstance = cozydb.getModel 'CozyInstance',
    id: String
    domain: String
    locale: String

CozyInstance.first = (callback) ->
    CozyInstance.request 'all', (err, instances) ->
        if err then callback err
        else if not instances or instances.length is 0 then callback null, null
        else  callback null, instances[0]
