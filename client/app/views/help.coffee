BaseView = require 'lib/base_view'
request = require 'lib/request'


# View that displays:
# * available links to find support.
# * a widget to send a message easily to the cozy support email.
module.exports = class exports.HelpView extends BaseView
    el: '#help-menu'
    template: require 'templates/help'

    events:
        'click #send-message-button': 'onSendMessageClicked'


    afterRender: ->
        @sendMessageButton = @$ '#send-message-button'
        @sendMessageInput = @$ '#send-message-textarea'
        @alertMessageError = @$ '#send-message-error'
        @alertMessageSuccess = @$ '#send-message-success'
        @configureHelpUrl()
        @$el.hide()


    # If a special help url is defined at the instance level, it's the one used
    # for it.
    configureHelpUrl: ->
        helpUrl = window.app.instance?.helpUrl
        if helpUrl?
            template = require 'templates/help_url'
            @$el.find('.help-section:last').prepend template helpUrl: helpUrl


    # When send message is clicked, the content of the message textarea is
    # send to the server. That way he can send an email to the Cozy support
    # team.
    # It grabs the send logs checkbox state and add this as parameter of the
    # server request. That way, the server knows if it must add the logs to the
    # sent message.
    onSendMessageClicked: =>
        @alertMessageError.hide()
        @alertMessageSuccess.hide()

        messageText = @sendMessageInput.val()
        sendLogs = @$('#send-message-logs').is(':checked')
        if messageText.length > 0
            @sendMessageButton.spin true
            request.post "help/message", {messageText, sendLogs}, (err) =>
                @sendMessageButton.spin false
                if err
                    @alertMessageError.show()
                else
                    @alertMessageSuccess.show()

    toggle: ->
        if @$el.is ':visible'
            @$el.hide()
        else
            $('.right-menu').hide()
            @$el.show()
