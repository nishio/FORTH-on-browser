
// Forth interface

// Install Forth interface. terminal, stack are jQuery objects
forth.interface = function(terminal, stack) {
    terminal.terminal(
        function(str, terminal) {
            try {
                if (forth.dbg.enabled) {
                    forth.feedString(str);
                    terminal.echo('Input loaded into debugger');
                } else
                    forth.runString(str);
            } catch(err) {
                terminal.error(err);
            }
            forth.redrawDebugger();
            forth.redrawStack();
        },
        {
            greetings: "FORTH Interpreter. Type 'clear' to clear",
            prompt: '> '
        });
    forth.terminal = terminal.terminal();
    forth.stackElt = $(stack);
};


// Clicking 'button' will load 'source' to the interpreter
forth.sourceLoader = function(source, button) {
    button.click(
        function() {
            forth.terminal.echo('Loading source...');
            try {
                if (forth.dbg.enabled) {
                    forth.feedString(source.val());
                    forth.terminal.echo('Source loaded into debugger');
                } else {
                    forth.runString(source.val());
                    forth.terminal.echo('Source loaded');
                }
                forth.redrawDebugger();
                forth.redrawStack();
            } catch(err) {
                console.log(err);
                forth.terminal.error(err);
            }
        });
};

forth.redrawStack = function() {
    forth.stackElt.empty();
    for (var i = 0; i < forth.stack.data.length; i++) {
        var val = forth.stack.data[i];
        var elt = $('<div class="stackElt">'+val+'</div>');
        forth.stackElt.append(elt);
    }
};

forth.debuggerInterface = function(prefix) {
    forth.dbg = {
        enabled: false,
        elt: function(sel) {
            return $(prefix+sel);
        }
    };

    forth.dbg.elt('mode').change(
        function() {
            var enabled = forth.dbg.elt('mode').attr('checked') == 'checked';
            forth.dbg.enabled = enabled;
            forth.redrawDebugger();
            forth.terminal.echo('Debugger is ' +
                                (enabled ? 'enabled' : 'disabled'));
            forth.terminal.set_prompt(enabled ? 'debug> ' : '> ');
        });
    var step = function(goInside) {
        try {
                forth.step(goInside);
        } catch(err) {
            terminal.error(err);
        }
        forth.redrawDebugger();
        forth.redrawStack();
    };
    forth.dbg.elt('step-inside').click(function() { step(true); });
    forth.dbg.elt('step-over').click( function() { step(false); });
};

forth.redrawDebugger = function() {
    var src = forth.source.input;
    src = src.replace(/\s+/g, ' ');
    console.log(src);
    if (src.length > 40)
        src = src.substr(0, 40)+'...';
    forth.dbg.elt('source').text(src);
    forth.dbg.elt('step-inside').attr('disabled', !(forth.dbg.enabled && forth.running));
    forth.dbg.elt('step-over').attr('disabled', !(forth.dbg.enabled && forth.running));
};
