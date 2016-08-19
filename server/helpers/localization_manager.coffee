Polyglot = require 'node-polyglot'
cozydb = require 'cozydb'

class LocalizationManager

    polyglot: null
    defaultPolyglot: null

    # should be run when app starts
    initialize: (callback = ->) ->
        @ensureReady callback

    setRenderer: (renderer) ->
        @renderer = renderer

    retrieveLocale: (callback) ->
        cozydb.api.getCozyLocale (err, locale) ->
            if err? or not locale then locale = 'en' # default value
            callback null, locale

    ensureReady: (callback) ->
        return callback null, @polyglot if @polyglot
        # we are not ready, let's get ready
        @retrieveLocale (err, locale) =>
            return callback err if err
            defaultPhrases = require '../locales/en'
            try
                phrases = require "../locales/#{locale}"
            catch err
                phrases = defaultPhrases

            @polyglot = new Polyglot locale: locale, phrases: phrases
            @defaultPolyglot  = new Polyglot
                locale: 'en'
                phrases: defaultPhrases
            callback null, @polyglot

    # execute polyglot.t, for server-side localization
    t: (key, params = {}) ->
        unless params._?
            params._ = @defaultPolyglot?.t key, params
        return @polyglot?.t key, params

    render: (name, options, callback) ->
        @ensureReady (err) =>
            return callback err if err
            viewName = "#{@polyglot.currentLocale}_#{name}"
            @renderer viewName, options, callback

module.exports = new LocalizationManager()
