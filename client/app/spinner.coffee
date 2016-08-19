# Prepare spin
$.fn.spin = (opts, color, content) ->
    presets =
        tiny:
            lines: 8
            length: 2
            width: 2
            radius: 3

        small:
            lines: 8
            length: 1
            width: 2
            radius: 5

        large:
            lines: 10
            length: 8
            width: 4
            radius: 8

    if Spinner
        @each ->
            $this = $ this
            $this.html "&nbsp;"
            spinner = $this.data "spinner"
            if spinner?
                spinner.stop()
                $this.data "spinner", null
                $this.html content

            else if opts isnt false
                if typeof opts is "string"
                    if opts of presets
                        opts = presets[opts]
                    else
                        opts = {}
                    opts.color = color if color
                spinner = new Spinner(
                    $.extend(color: $this.css("color"), opts))
                spinner.spin this
                $this.data "spinner", spinner

    else
        console.log "Spinner class not available."
        null