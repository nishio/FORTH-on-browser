
// Forth interface

// Install Forth interface. terminal is a jQuery object
forth.interface = function(terminal) {
    terminal.terminal(
        function(str, terminal) {
            try {
                var words = forth.parse(str);
                forth.execute(words);
            } catch(err) {
                terminal.error(err);
            }
        },
        {
            greetings: "FORTH Interpreter. Type 'clear' to clear",
            prompt: '> '
        });
    forth.terminal = terminal.terminal();
};
