BaseView = require 'lib/base_view'
request = require 'lib/request'

module.exports = class PopoverDescriptionView extends BaseView
    id: 'market-popover-description-view'
    className: 'modal md-modal md-effect-1'
    tagName: 'div'
    template: require 'templates/popover_description'

    events:
        'click #cancelbtn':'onCancelClicked'
        'click #confirmbtn':'onConfirmClicked'

    initialize: (options) ->
        super
        @confirmCallback = options.confirm
        @cancelCallback = options.cancel
        @label = if options.label? then options.label else t 'install'
        @$("#confirmbtn").html @label


    afterRender: ->
        @body = @$ ".md-body"
        @header = @$ ".md-header h3"
        @header.html @model.get 'displayName'

        @body.addClass 'loading'
        @body.html t('please wait data retrieval') + \
            '<div class="spinner-container" />'
        @body.find('.spinner-container').spin true
        @model.getMetaData
            success: =>
                @body.removeClass 'loading'
                @renderDescription()
            error: (error) =>
                @body.removeClass 'loading'
                @body.addClass 'error'
                if error.responseText.indexOf('Not Found') isnt -1
                    @body.html t 'package.json not found'
                else if error.responseText.indexOf('unknown provider') isnt -1
                    @body.html t 'unknown provider'
                    @$("#confirmbtn").hide()
                else
                    @body.html """
                        #{t 'error connectivity issue'}
                        #{error.responseText}
                        """

        @overlay = $ '.md-overlay'
        @overlay.click =>
            @hide()

    renderDescription: =>

        @body.html ""

        # Update displayName for applications not in marketplace
        @header = @$ ".md-header h3"
        @header.html @model.get 'displayName'

        description = @model.get 'description'
        if description?
            localeKey = "#{@model.get 'name'} description"
            localeDesc = t localeKey
            if localeDesc is localeKey
                # description is not translated
                localeDesc = t description
        else
            # for applications not in the market
            localeDesc = @model.get 'remoteDescription'
        # applications not in the market may have no description
        if localeDesc?
            @header.parent().append "<p class=\"line\"> #{localeDesc} </p>"

        permissions = @model.get("permissions")
        if not permissions? or Object.keys(permissions).length is 0
            permissionsDiv = $ """
                <div class='permissionsLine'>
                    <h5>#{t('no specific permissions needed')} </h5>
                </div>
            """
            @body.append permissionsDiv
        else
            @body.append "<h5>#{t('required permissions')}</h5>"
            for docType, permission of @model.get("permissions")
                permissionsDiv = $ """
                  <div class='permissionsLine'>
                    <strong> #{docType} </strong>
                    <p> #{permission.description} </p>
                  </div>
                """
                @body.append permissionsDiv

        @handleContentHeight()
        @body.slideDown()
        #@body.niceScroll() # must be done in the end to avoid weird render

    handleContentHeight: ->
        @body.css 'max-height', "#{$(window).height() / 2}px"
        $(window).on 'resize', =>
            @body.css 'max-height', "#{$(window).height() / 2}px"


    show: =>
        @$el.addClass 'md-show'
        @overlay.addClass 'md-show'
        setTimeout =>
            @$('.md-content').addClass 'md-show'
        , 300
        document.addEventListener 'keydown', @onCancelClicked

    hide: =>
        @body.getNiceScroll().hide()
        $('.md-content').fadeOut =>
            @overlay.removeClass 'md-show'
            @$el.removeClass 'md-show'
            @remove()
        $('#home-content').removeClass 'md-open'
        document.removeEventListener 'keydown', @onCancelClicked

    onCancelClicked: (event) =>
        return if event.keyCode? and event.keyCode isnt 27
        @hide()
        @cancelCallback(@model)

    onConfirmClicked: () =>
        @confirmCallback(@model)
