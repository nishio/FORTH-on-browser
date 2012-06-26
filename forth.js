
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

// Words
// Word is an object with the following properties:
//  name
//  run() - run immediately
//  compile(code) - add yourself to the code

forth.genericWord = {
    compile: function(code) {
        code.push({op: 'call', value: this});
    }
};

forth.StandardWord = function(name, types, func) {
    this.name = name;
    this.types = types;
    this.func = func;
};
forth.StandardWord.prototype = {
    run: function() {
        forth.callStack.push(this);

        var args = forth.stack.popList(this.types.length);

        for (var i = 0; i < this.types.length; i++) {
            var type = this.types[i];
            if (type != 'any')
                forth.checkType(args[i], type);
        }

        var result = this.func.apply(null, args);
        forth.stack.pushList(result);

        forth.callStack.pop();
    },
    compile: forth.genericWord.compile
};

forth.CodeWord = function(name, code) {
    this.name = name;
    this.code = code;
};
forth.CodeWord.prototype = {
    run: function() {
        forth.callStack.push(this);
        forth.runCode(this.code);
        forth.callStack.pop();
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
    name: ':',
    run: function() {
        var name = forth.source.readToken();
        if (typeof name != 'string')
            throw 'a name expected';

        // invoking the name inside a function will compile
        // to a 'recurse'
        forth.dict[name] = forth.dict['recurse'];

        var code = [];
        var token;
        forth.compileUntil([';'], code);

        var word = new forth.CodeWord(name, code);
        forth.dict[name] = word;
    },

    compile: function() {
        throw ': unavailable in compile mode';
    }
};

forth.dict['if'] = {
    name: 'if',
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
    name: 'repeat',
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
    name: '(',
    readComment: function() {
        // Read until the ')' character
        forth.source.readWhile(/[^)]/);
        if (forth.source.empty())
            throw ') expected';
        forth.source.readChar();
    },
    run: function() { this.readComment(); },
    compile: function(code) { this.readComment(); }
};

forth.dict['recurse'] = {
    name: 'recurse',
    run: function() {
        throw '"recurse" unavailable in run mode';
    },
    compile: function(code) {
        code.push({op: 'recurse'});
    }
};

// Built-in words

forth.dict['+'] = new forth.StandardWord(
    '+',
    ['number', 'number'],
    function(a, b) { return [a+b]; });

forth.dict['-'] = new forth.StandardWord(
    '-',
    ['number', 'number'],
    function(a, b) { return [a-b]; });

forth.dict['*'] = new forth.StandardWord(
    '*',
    ['number', 'number'],
    function(a, b) { return [a*b]; });

forth.dict['/'] = new forth.StandardWord(
    '/',
    ['number', 'number'],
    function(a, b) {
        if (b == 0)
            throw 'division by zero';
        return [Math.floor(a/b)];
    });

forth.dict['.'] = new forth.StandardWord(
    '.',
    ['any'],
    function(a) {
        forth.terminal.echo(a);
        return [];
    });

forth.dict['print'] = forth.dict['.'];

// Stack manipulation

forth.dict['drop'] =
    new forth.StandardWord(
        'drop',
        ['any'],
        function(a) { return []; });

forth.dict['swap'] =
    new forth.StandardWord(
        'swap',
        ['any', 'any'],
        function(a, b) { return [b, a]; });

forth.dict['dup'] =
    new forth.StandardWord(
        'dup',
        ['any'],
        function(a) { return [a, a]; });

forth.dict['over'] =
    new forth.StandardWord(
        'over',
        ['any', 'any'],
        function(a, b) { return [a, b, a]; });

forth.dict['rot'] =
    new forth.StandardWord(
        'rot',
        ['any', 'any', 'any'],
        function(a, b, c) { return [b, c, a]; });

forth.dict['-rot'] =
    new forth.StandardWord(
        '-rot',
        ['any', 'any', 'any'],
        function(a, b, c) { return [c, a, b]; });

// True and false are standard words, not literals
forth.dict['true'] = new forth.StandardWord('true', [], function() { return [true]; });
forth.dict['false'] = new forth.StandardWord('false', [], function() { return [false]; });

forth.dict['and'] = new forth.StandardWord(
    'and',
    ['boolean', 'boolean'],
    function(a, b) { return [a && b]; });

forth.dict['or'] = new forth.StandardWord(
    'or',
    ['boolean', 'boolean'],
    function(a, b) { return [a || b]; });

forth.dict['not'] = new forth.StandardWord(
    'not',
    ['boolean'],
    function(a) { return [!a]; });

// comparison

forth.dict['='] = new forth.StandardWord(
    '=',
    ['number', 'number'],
    function(a, b) { return [a == b]; });

forth.dict['<>'] = new forth.StandardWord(
    '<>',
    ['number', 'number'],
    function(a, b) { return [a != b]; });

forth.dict['<'] = new forth.StandardWord(
    '<',
    ['number', 'number'],
    function(a, b) { return [a < b]; });

forth.dict['>'] = new forth.StandardWord(
    '>',
    ['number', 'number'],
    function(a, b) { return [a > b]; });

forth.dict['<='] = new forth.StandardWord(
    '<=',
    ['number', 'number'],
    function(a, b) { return [a <= b]; });

forth.dict['>='] = new forth.StandardWord(
    '>=',
    ['number', 'number'],
    function(a, b) { return [a >= b]; });
