BaseView = require 'lib/base_view'
PopoverDescriptionView = require 'views/popover_description'
ApplicationRow = require 'views/market_application'
ColorButton = require 'widgets/install_button'
AppCollection = require 'collections/application'
Application = require 'models/application'
slugify = require 'helpers/slugify'


REPOREGEX =  /// ^
    (https?://)?                   #protocol
    ([\da-z\.-]+\.[a-z\.]{2,})     #domain
    (:[0-9]{1,5})?                 #optional domain's port
    ([/\w \.-]*)*                  #path to repo
    (?:\.git)?                     #.git extension
    (@[/\w\.-]+)?                  #branch
     $ ///


module.exports = class MarketView extends BaseView
    id: 'market-view'
    template: require 'templates/market'
    tagName: 'div'

    events:
        'keyup #app-git-field':'onEnterPressed'
        "click #your-app .app-install-button": "onInstallClicked"


    ### Constructor ###

    constructor: (installedApps, marketApps) ->
        @marketApps = marketApps
        @installedApps = installedApps
        super()


    afterRender: =>
        @appList = @$ '#market-applications-list'
        @appGitField = @$ "#app-git-field"
        @installInfo = @$ "#add-app-modal .loading-indicator"
        @infoAlert = @$ "#your-app .info"
        @infoAlert.hide()
        @errorAlert = @$ "#your-app .error"
        @errorAlert.hide()
        @noAppMessage = @$ '#no-app-message'
        @installAppButton = new ColorButton @$ "#add-app-submit"
        @onAppListsChanged()

        @listenTo @installedApps, 'reset',  @onAppListsChanged
        @listenTo @installedApps, 'change',  @onAppListsChanged
        @listenTo @installedApps, 'remove', @onAppListsChanged
        @listenTo @marketApps, 'reset',  @onAppListsChanged


    # Display only apps with state equals to installed or broken.
    onAppListsChanged: =>
        installedApps = new AppCollection @installedApps.filter (app) ->
            app.get('state') in ['installed', 'stopped', 'broken']
        installeds = installedApps.pluck 'slug'

        @$('.cozy-app').remove()
        @marketApps.each (app) =>
            slug = app.get 'slug'
            if installeds.indexOf(slug) is -1
                if @$("#market-app-#{app.get 'slug'}").length is 0
                    @addApplication app

        if @$('.cozy-app').length is 0
            @noAppMessage.show()


    # Add an application row to the app list.
    addApplication: (application) =>
        row = new ApplicationRow(application, @)
        @noAppMessage.hide()
        @appList.append row.el
        appButton = @$(row.el)


    onEnterPressed: (event) =>
        if event.which is 13 and not @popover?.$el.is(':visible')
            @onInstallClicked(event)
        else if event.which is 13
            @popover?.confirmCallback()


    onInstallClicked: (event) =>
        data = git: @$("#app-git-field").val()
        @parsedGit data
        event.preventDefault()


    # parse git url before install application
    parsedGit: (app) ->
        parsed = @parseGitUrl app.git
        if parsed.error
            @displayError parsed.msg
        else
            @hideError()
            application = new Application(parsed)
            if @marketApps._byId[application.id]
                icon = @marketApps._byId[application.id].get 'icon'
                application.set 'icon', icon
            data =
                app: application
            @showDescription data


    # pop up with application description
    showDescription: (appWidget) ->

        @popover = new PopoverDescriptionView
            model: appWidget.app
            confirm: (application) =>
                $('#no-app-message').hide()
                @popover.hide()
                @appList.show()
                if appWidget.$el
                    appWidget.installing()
                    @runInstallation appWidget.app, false
                else
                    @runInstallation appWidget.app, true
            cancel: (application) =>
                @popover.hide()
                @appList.show()

        @$el.append @popover.$el
        @popover.show()

        if $(window).width() <= 640
            @appList.hide()


    runInstallation: (application, shouldRedirect) ->
        @hideError()

        application.install
            ignoreMySocketNotification: true
            success: (data) =>
                if (data?.state is "broken") or not data.success
                    alert data.message
                else
                    @resetForm()
                if shouldRedirect
                    app?.routers.main.navigate 'home', true

            error: (jqXHR) =>
                @displayError t JSON.parse(jqXHR.responseText).message


    parseGitUrl: (url) ->
        url = url.trim()
        url = url.slice(0, url.length - 1) if url.lastIndexOf('/') is url.length - 1
        url = url.replace 'git@github.com:', 'https://github.com/'
        url = url.replace 'git://', 'https://'
        parsed = REPOREGEX.exec url
        unless parsed?
            error =
                error: true
                msg: t "Git url should be of form https://.../my-repo.git"
            return error
        [git, proto, domain, port, path, branch] = parsed
        if not (proto? and domain? and path?)
            error =
                error: true
                msg: t "Git url should be of form https://.../my-repo.git"
            return error
        path = path.replace /\.git$/, ''
        parts = path.split "/"
        name = parts[parts.length - 1]
        name = name.replace /-|_/g, " "
        name = name.replace 'cozy ', ''

        slug = slugify(name)
        port = "" unless port?
        git = proto + domain + port + path + '.git'
        branch = branch.substring(1) if branch?

        out = git:git, name:name, slug:slug
        out.branch = branch if branch?
        return out


    # Display message inside info box.
    displayInfo: (msg) =>
        @errorAlert.hide()
        @infoAlert.html msg
        @infoAlert.show()


    # Display message inside error box.
    displayError: (msg) =>
        @infoAlert.hide()
        @errorAlert.html msg
        @errorAlert.show()


    hideError: =>
        @errorAlert.hide()


    resetForm: =>
        @appGitField.val ''
