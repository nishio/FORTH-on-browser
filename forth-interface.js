
// Forth interface

// Install Forth interface. terminal, stack are jQuery objects
forth.interface = function(terminal, stack) {
    terminal.terminal(
        function(str, terminal) {
            try {
                forth.runString(str);
            } catch(err) {
                terminal.error(err);
            }
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
                forth.runString(source.val());
                forth.terminal.echo('Source loaded');
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
