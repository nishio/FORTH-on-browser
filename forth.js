
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
        forth.dict[token]();
    else
        throw 'unknown word: '+token;
};

forth.compileToken = function(token, code) {
    if (typeof token == 'number')
        code.push({op: 'number', value: token});
    else if (token in forth.dict)
        code.push({op: 'call', value: forth.dict[token]});
    else
        throw 'unknown word: '+token;
};

forth.runCode = function(code) {
    for (var ip = 0; ip < code.length; ip++) {
        var cmd = code[ip];
        console.log(cmd);
        switch (cmd.op) {
        case 'number':
            forth.stack.push(cmd.value);
            break;
        case 'call':
            cmd.value();
            break;
        default:
            throw 'bug: bad opcode';
        }
    }
};

forth.runString = function(s) {
    forth.source = new forth.Parser(s);
    for (;;) {
        var token = forth.source.readToken();
        if (token == null)
            break;
        forth.runToken(token);
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

forth.standardWord = function(types, func) {
    return function() {
        var args = forth.stack.popList(types.length);

        for (var i = 0; i < types.length; i++) {
            var type = types[i];
            if (type != 'any')
                forth.checkType(args[i], type);
        }

        var result = func.apply(null, args);
        forth.stack.pushList(result);
    };
};

forth.checkType = function(val, type) {
    if (typeof val != type)
        throw 'expected '+type;
};

// Dictionary of words (as functions to execute)
forth.dict = {};

forth.dict[':'] = function() {
    var name = forth.source.readToken();
    if (typeof name != 'string')
        throw 'a name expected';

    var code = [];
    var token;
    while ((token = forth.source.readToken()) != ';') {
        if (token == null)
            throw '; expected';
        forth.compileToken(token, code);
    }

    var func = function() {
        forth.runCode(code);
    };
    forth.dict[name] = func;
    //forth.terminal.echo('defined '+name);
};

// Built-in words

forth.dict['+'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a+b]; });

forth.dict['-'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a-b]; });

forth.dict['*'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a*b]; });

forth.dict['/'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) {
        if (b == 0)
            throw 'division by zero';
        return [Math.floor(a/b)];
    });

forth.dict['.'] = forth.standardWord(
    ['any'],
    function(a) {
        forth.terminal.echo(a);
        return [];
    });

forth.dict['print'] = forth.dict['.'];

// Stack manipulation

forth.dict['drop'] =
    forth.standardWord(['any'],
                       function(a) { return []; });
forth.dict['swap'] =
    forth.standardWord(['any', 'any'],
                       function(a, b) { return [b, a]; });
forth.dict['dup'] =
    forth.standardWord(['any'],
                       function(a) { return [a, a]; });
forth.dict['over'] =
    forth.standardWord(['any', 'any'],
                       function(a, b) { return [a, b, a]; });
forth.dict['rot'] =
    forth.standardWord(['any', 'any', 'any'],
                       function(a, b, c) { return [b, c, a]; });
forth.dict['-rot'] =
    forth.standardWord(['any', 'any', 'any'],
                       function(a, b, c) { return [c, a, b]; });

// True and false are standard words, not literals
forth.dict['true'] = forth.standardWord([], function() { return [true]; });
forth.dict['false'] = forth.standardWord([], function() { return [false]; });

forth.dict['and'] = forth.standardWord(
    ['boolean', 'boolean'],
    function(a, b) { return [a && b]; });

forth.dict['or'] = forth.standardWord(
    ['boolean', 'boolean'],
    function(a, b) { return [a || b]; });

forth.dict['not'] = forth.standardWord(
    ['boolean'],
    function(a) { return [!a]; });

// comparison

forth.dict['='] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a == b]; });

forth.dict['<>'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a != b]; });

forth.dict['<'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a < b]; });

forth.dict['>'] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a > b]; });

forth.dict['<='] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a <= b]; });

forth.dict['>='] = forth.standardWord(
    ['number', 'number'],
    function(a, b) { return [a >= b]; });
