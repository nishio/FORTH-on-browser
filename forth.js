
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

forth.runCode = function(code) {
    var ip = 0;
    while (ip < code.length) {
        var cmd = code[ip];
        switch (cmd.op) {
        case 'number':
            forth.stack.push(cmd.value);
            ip++;
            break;
        case 'call':
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
            forth.callStack[forth.callStack.length-1].run();
            ip++;
            break;
        default:
            throw 'bug: bad opcode '+cmd.op;
        }
    }
};

forth.runString = function(s) {
    forth.source = new forth.Parser(s);
    forth.callStack = [];
    try {
        for (;;) {
            var token = forth.source.readToken();
            if (token == null)
                break;
            forth.runToken(token);
        }
    } catch (err) {
        while (forth.callStack.length > 0)
            err += '\nin '+forth.callStack.pop().name;
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
