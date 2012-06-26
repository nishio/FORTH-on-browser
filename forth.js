
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
        default:
            throw 'bug: bad opcode '+cmd.op;
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

// Words
// Word is an object with the following properties:
//  run() - run immediately
//  compile(code) - add yourself to the code

forth.genericWord = {
    compile: function(code) {
        code.push({op: 'call', value: this});
    }
};

forth.StandardWord = function(types, func) {
    this.types = types;
    this.func = func;
};
forth.StandardWord.prototype = {
    run: function() {
        var args = forth.stack.popList(this.types.length);

        for (var i = 0; i < this.types.length; i++) {
            var type = this.types[i];
            if (type != 'any')
                forth.checkType(args[i], type);
        }

        var result = this.func.apply(null, args);
        forth.stack.pushList(result);
    },
    compile: forth.genericWord.compile
};

forth.CodeWord = function(code) {
    this.code = code;
};
forth.CodeWord.prototype = {
    run: function() {
        forth.runCode(this.code);
    },
    compile: forth.genericWord.compile
};

forth.checkType = function(val, type) {
    if (typeof val != type)
        throw 'expected '+type;
};

// Dictionary of words (as functions to execute)
forth.dict = {};

forth.compileUntil = function(endTokens, code) {
    for (;;) {
        var token = forth.source.readToken();
        if (token == null)
            throw endTokens.join('/')+' expected';

        for (var i = 0; i < endTokens.length; i++)
            if (token == endTokens[i])
                return token;

        forth.compileToken(token, code);
    }
};

forth.dict[':'] = {
    run: function() {
        var name = forth.source.readToken();
        if (typeof name != 'string')
            throw 'a name expected';

        var code = [];
        var token;
        forth.compileUntil([';'], code);

        var word = new forth.CodeWord(code);
        forth.dict[name] = word;
    },

    compile: function() {
        throw ': unavailable in compile mode';
    }
};

forth.dict['if'] = {
    run: function() {
        throw '"if" unavailable in run mode';
    },
    compile: function(code) {
        var goto = {op: 'goto-on-false'};
        code.push(goto);
        if (forth.compileUntil(['then', 'else'], code) == 'then') {
            goto.value = code.length;
        } else {
            var goto2 = {op: 'goto'};
            code.push(goto2);
            goto.value = code.length;
            forth.compileUntil(['then'], code);
            goto2.value = code.length;
        }

    }
};

forth.dict['repeat'] = {
    run: function() {
        throw '"repeat" unavailable in run mode';
    },
    compile: function(code) {
        var dest = code.length;
        forth.compileUntil(['until'], code);
        code.push({op: 'goto-on-false', value: dest});
    }
};

forth.dict['('] = {
    readComment: function() {
        // Read until the ')' character
        forth.source.readWhile(/[^)]/);
        if (forth.source.empty())
            throw ') expected';
        forth.source.readChar();
        console.log(forth.source.input);
    },
    run: function() { this.readComment(); },
    compile: function(code) { this.readComment(); }
};

// Built-in words

forth.dict['+'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a+b]; });

forth.dict['-'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a-b]; });

forth.dict['*'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a*b]; });

forth.dict['/'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) {
        if (b == 0)
            throw 'division by zero';
        return [Math.floor(a/b)];
    });

forth.dict['.'] = new forth.StandardWord(
    ['any'],
    function(a) {
        forth.terminal.echo(a);
        return [];
    });

forth.dict['print'] = forth.dict['.'];

// Stack manipulation

forth.dict['drop'] =
    new forth.StandardWord(
        ['any'],
        function(a) { return []; });

forth.dict['swap'] =
    new forth.StandardWord(
        ['any', 'any'],
        function(a, b) { return [b, a]; });

forth.dict['dup'] =
    new forth.StandardWord(
        ['any'],
        function(a) { return [a, a]; });

forth.dict['over'] =
    new forth.StandardWord(
        ['any', 'any'],
        function(a, b) { return [a, b, a]; });

forth.dict['rot'] =
    new forth.StandardWord(
        ['any', 'any', 'any'],
        function(a, b, c) { return [b, c, a]; });

forth.dict['-rot'] =
    new forth.StandardWord(
        ['any', 'any', 'any'],
        function(a, b, c) { return [c, a, b]; });

// True and false are standard words, not literals
forth.dict['true'] = new forth.StandardWord([], function() { return [true]; });
forth.dict['false'] = new forth.StandardWord([], function() { return [false]; });

forth.dict['and'] = new forth.StandardWord(
    ['boolean', 'boolean'],
    function(a, b) { return [a && b]; });

forth.dict['or'] = new forth.StandardWord(
    ['boolean', 'boolean'],
    function(a, b) { return [a || b]; });

forth.dict['not'] = new forth.StandardWord(
    ['boolean'],
    function(a) { return [!a]; });

// comparison

forth.dict['='] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a == b]; });

forth.dict['<>'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a != b]; });

forth.dict['<'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a < b]; });

forth.dict['>'] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a > b]; });

forth.dict['<='] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a <= b]; });

forth.dict['>='] = new forth.StandardWord(
    ['number', 'number'],
    function(a, b) { return [a >= b]; });
