
forth = {};

forth.Parser = function(str) {
    this.str = str;
    // we parse by chopping off characters from the start of 'input'
    this.input = str;
};
forth.Parser.prototype = {
    empty: function() {
        return this.input.length == 0;
    },

    // Read all characters satisfying a given regexp.
    readWhile: function(re) {
        var n = 0;
        while (n < this.input.length && re.test(this.input.charAt(n)))
            n++;
        var result = this.input.substr(0, n);
        this.input = this.input.substr(n);
        return result;
    },

    readChar: function() {
        this.input = this.input.substr(1);
    },

    // Read a token (delimited by spaces)
    readToken: function() {
        // drop all spaces
        this.readWhile(/\s/);

        var result = this.readWhile(/\S/);

        if (result == '')
            return null;

        if (/^-?\d+$/.test(result))
            return parseFloat(result);

        // unlike original Forth, we'll be case-insensitive
        return result.toLowerCase();
    },

    readAll: function() {
        var codes = [];
        var c;
        while((c = this.readToken()) != null)
            codes.push(c);
        if (!this.empty())
            throw 'parse error';
        return codes;
    }
};

// Parse input, returning Forth tokens
forth.parse = function(s) {
    return new forth.Parser(s).readAll();
};

// Format a list of tokens
forth.printTokens = function(tokens) {
    return tokens.join(' ');
};

// Execute a token
forth.runToken = function(token) {
    if (typeof token == 'number') // a number literal
        forth.stack.push(token);
    else if (token in forth.dict)
        forth.dict[token].run();
    else
        throw 'unknown word: '+token;
};

forth.compileToken = function(token, code) {
    if (typeof token == 'number')
        code.push({op: 'number', value: token});
    else if (token in forth.dict)
        forth.dict[token].compile(code);
    else
        throw 'unknown word: '+token;
};

// Run compiled code; word is the word we're in
forth.runCode = function(code, word) {
    var ip = 0;
    while (ip < code.length)
        ip = forth.stepCode(ip, code, word, false);
};

// Perform one step of execution, return new IP
// goInside - create a Context on a 'call' opcode
//  (if we call a word that supports initContext())
forth.stepCode = function(ip, code, word, goInside) {
    var cmd = code[ip];

    switch (cmd.op) {
    case 'number':
    case 'addr': // variable 'address', a string
        forth.stack.push(cmd.value);
        ip++;
        break;
    case 'call':
        if (goInside && cmd.value.initContext)
            cmd.value.initContext();
        else
            cmd.value.run();
        ip++;
        break;
    case 'goto':
        ip = cmd.value;
        break;
    case 'goto-on-false': {
        var val = forth.stack.pop();
        forth.checkType(val, 'boolean');
        if (!val)
            ip = cmd.value;
        else
            ip++;
        break;
    }
    case 'recurse':
        word.run();
        ip++;
        break;
    default:
        throw 'bug: bad opcode '+cmd.op;
    }

    return ip;
};

// Context represents a chunk of code that is currently being stepped through,
// stored in forth.contexts and displayed in the visual debugger
forth.Context = function(word, code) {
    this.word = word;
    this.code = code;
    this.ip = 0;
};
forth.Context.prototype = {
    init: function() {
        forth.contexts.push(this);
        forth.stackTrace.push(this.word.name);
    },
    step: function(goInside) {
        if (forth.contexts[forth.contexts.length-1] != this)
            throw 'bug: step() on a non-topmost context';

        if (this.ip < this.code.length) {
            this.ip = forth.stepCode(this.ip, this.code, this.word, goInside);
            forth.terminal.echo(this.word.name+' ip='+this.ip);
        } else {
            this.end();
        }
    },
    end: function() {
        forth.stackTrace.pop();
        forth.contexts.pop();
        forth.terminal.echo(this.word.name+' exiting');
    }
};

// Load a string to the interpreter and initialize it.
forth.feedString = function(s) {
    forth.source = new forth.Parser(s);
    forth.reset();
    forth.running = true;
};

forth.runString = function(s) {
    forth.feedString(s);
    while (forth.running)
        forth.step(false);
};

// Perform a top-level step of execution (read a current word, or execute one
// command if we're inside a word).
// If goInside is true, step inside a word if we can
forth.step = function(goInside) {
    try {
        if (forth.contexts.length > 0) {
            forth.contexts[forth.contexts.length-1].step(goInside);
        } else {
            var token = forth.source.readToken();
            if (token == null) {
                forth.running = false;
                return;
            }

            if (goInside) {
                if (token in forth.dict &&
                    forth.dict[token].initContext) {

                    forth.dict[token].initContext();
                    return;
                }
            }

            forth.runToken(token);
        }
    } catch (err) {
        forth.running = false;
        for (var i = forth.stackTrace.length-1;
             i >= 0;
             i--)
            err += '\nin '+forth.stackTrace[i];
        throw err;
    }
};

forth.stack = {
    data: [],

    push: function (elt) { this.data.push(elt); },

    pushList: function(list) {
        for (var i = 0; i < list.length; i++)
            this.data.push(list[i]);
    },

    pop: function() {
        if (this.data.length == 0)
            throw 'empty stack';
        return this.data.pop();
    },

    popList: function(n) {
        if (this.data.length < n)
            throw 'not enough elements on stack';
        var result = this.data.slice(this.data.length-n);
        this.data.splice(this.data.length-n, n);
        return result;
    },

    print: function() {
        return '['+this.data.join(', ')+']';
    },

    reset: function() {
        this.data.splice(0, this.data.length);
    }
};

// Variables
forth.variables = {};

// Words
forth.dict = {};

// Stack trace - a list of strings
forth.stackTrace = [];

// Loop control stack. Contains objects {i, n}; the
// loop executes while i < n
forth.loopStack = [];

// Execution context - list of Context objects
forth.contexts = [];

// Reset the execution state
forth.reset = function() {
    forth.stackTrace = [];
    forth.loopStack = [];
    forth.contexts = [];
};
