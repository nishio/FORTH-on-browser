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
        forth.runCode(this.code, this);
        forth.callStack.pop();
    },
    compile: forth.genericWord.compile
};

forth.checkType = function(val, type) {
    if (typeof val != type)
        throw 'expected '+type;
};

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

forth.dict['begin'] = {
    name: 'begin',
    run: function() {
        throw '"begin" unavailable in run mode';
    },
    compile: function(code) {
        var dest = code.length;
        forth.compileUntil(['until'], code);
        code.push({op: 'goto-on-false', value: dest});
    }
};

forth.dict['do'] = {
    name: 'do',
    run: function() {
        throw '"do" unavailable in run mode';
    },
    compile: function(code) {
        // We call helper functions to manage the loop stack
        forth.compileToken('loop-start', code);
        var dest = code.length;
        forth.compileUntil(['loop'], code);
        forth.compileToken('loop-end', code);
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

forth.dict['variable'] = {
    name: 'variable',
    run: function() {
        var name = forth.source.readToken();
        if (typeof name != 'string')
            throw 'a name expected';

        forth.variables[name] = 0;
        forth.dict[name] = new forth.AddressWord(name);
    },
    compile: function(code) {
        throw 'variables have to be defined in run mode';
    }
};

forth.AddressWord = function(name) {
    this.name = name;
};
forth.AddressWord.prototype = {
    run: function() {
        forth.stack.push(this.name);
    },
    compile: function(code) {
        code.push({op: 'addr', value: this.name});
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

// Variable store and fetch

forth.dict['!'] = new forth.StandardWord(
    '!',
    ['any', 'string'],
    function (val, name) {
        if (!(name in forth.variables))
            throw 'undefined variable: '+name;
        forth.variables[name] = val;
        return [];
    });
forth.dict['store'] = forth.dict['!'];

forth.dict['@'] = new forth.StandardWord(
    '@',
    ['string'],
    function (name) {
        if (!(name in forth.variables))
            throw 'undefined variable: '+name;
        return [forth.variables[name]];
    });
forth.dict['fetch'] = forth.dict['@'];

// Loop control

forth.dict['i'] = new forth.StandardWord(
    'i',
    [],
    function() {
        var st = forth.loopStack;
        if (st.length == 0)
            throw 'empty loop stack';
        return [st[st.length-1].i];
    });

forth.dict['j'] = new forth.StandardWord(
    'j',
    [],
    function() {
        var st = forth.loopStack;
        if (st.length < 2)
            throw 'too short loop stack';
        return [st[st.length-2].i];
    });

forth.dict['loop-start'] = new forth.StandardWord(
    'loop-start',
    ['number', 'number'],
    function(n, i) {
        forth.loopStack.push({i: i, n: n});
        return [];
    }
);

// loop-end returns true if we finished the loop, false
// otherwise (to be consumed by goto-on-false)
forth.dict['loop-end'] = new forth.StandardWord(
    'loop-end',
    [],
    function(n, i) {
        var st = forth.loopStack;
        if (st.length == 0)
            throw 'empty loop stack';
        var record = st[st.length-1];
        record.i++;
        if (record.i < record.n) {
            return [false];
        } else {
            st.pop();
            return [true];
        }
    }
);
