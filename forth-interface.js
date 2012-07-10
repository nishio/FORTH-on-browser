
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
            forth.dbg.redraw();
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
                forth.dbg.redraw();
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

// Visual debugger interface
forth.dbg = {
    enabled: false,
    elt: function(sel) {
        return $(this.prefix+sel);
    }
};

forth.dbg.init = function(prefix) {
    forth.dbg.prefix = prefix;

    var step = function(goInside) {
        try {
            forth.step(goInside);
        } catch(err) {
            forth.terminal.error(err);
        }
        forth.dbg.redraw();
        forth.redrawStack();
    };

    var run = function() {
        while (forth.running)
            step(false);
        forth.dbg.redraw();
    };

    forth.dbg.elt('mode').change(
        function() {
            var enabled = forth.dbg.elt('mode').attr('checked') == 'checked';
            forth.dbg.enabled = enabled;
            forth.dbg.redraw();
            forth.terminal.echo('Debugger is ' +
                                (enabled ? 'enabled' : 'disabled'));
            forth.terminal.set_prompt(enabled ? 'debug> ' : '> ');
        });

    forth.dbg.elt('step-inside').click(function() { step(true); });
    forth.dbg.elt('step-over').click( function() { step(false); });
    forth.dbg.elt('run').click(run);
};

forth.dbg.redraw = function() {
    var src = forth.source.input;
    src = src.replace(/\s+/g, ' ');
    if (src.length > 40)
        src = src.substr(0, 40)+'...';
    forth.dbg.elt('source').text(src);

    var allDisabled = !(forth.dbg.enabled && forth.running);
    forth.dbg.elt('run').attr('disabled', allDisabled);
    forth.dbg.elt('step-inside').attr('disabled', allDisabled);
    forth.dbg.elt('step-over').attr('disabled', allDisabled);
};

forth.dbg.pushContext = function(number, name, code) {
    var c = $('<div class="context">'+
              '<div class="name">#'+number+': '+name+
              '</div></div>');
    var commandElt = function(i, cmd) {
        var v;
        switch(cmd.op) {
        case 'call':
            v = cmd.value.name;
            break;
        case 'recurse':
        case '(end)':
            v = '';
            break;
        default:
            v = cmd.value;
            break;
        }
        return $('<div class="command"><span class="number">'+i+'</span> '+
                 '<span class="op">'+cmd.op+'</span>'+
                 '<span class="value">'+v+'</span></div>');
    };

    for (var i = 0; i < code.length; ++i)
        c.append(commandElt(i, code[i]));
    // last, "empty" command
    c.append(commandElt(code.length, {op: '(end)'}));
    
    c.hide();
    forth.dbg.elt('call-stack').prepend(c);
    c.slideDown();
    return c;
};

forth.dbg.popContext = function() {
    forth.dbg.elt('call-stack').find('.context:first').slideUp(
        function() { $(this).remove(); });
};

forth.dbg.clearContexts = function() {
    forth.dbg.elt('call-stack').find('.context').remove();
};

forth.dbg.setIp = function(c, ip) {
    c.find('.command.active').removeClass('active');
    $(c.find('.command')[ip]).addClass('active');
};
