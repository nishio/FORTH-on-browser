
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

    // Read a word (delimited by spaces)
    readWord: function() {
        // drop all spaces
        this.readWhile(/\s/);

        var result = this.readWhile(/\S/);

        if (result == '')
            return null;
        return result;
    },

    readCode: function() {
        var word = this.readWord();
        if (word == null)
            return null;
        if (/^-?\d+$/.test(word))
            return parseFloat(word);
        // unlike original Forth, we'll be case-insensitive
        return word.toLowerCase();
    },

    readAll: function() {
        var codes = [];
        var c;
        while((c = this.readCode()) != null)
            codes.push(c);
        if (!this.empty())
            throw 'parse error';
        return codes;
    }
};

// Parse input, returning Forth words (for now).
forth.parse = function(s) {
    return new forth.Parser(s).readAll();
};

// Format a list of words
forth.printWords = function(words) {
    return words.join(' ');
};

// Execute a list of words
forth.execute = function(words) {
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        if (typeof word == 'number') // a number literal
            forth.stack.push(word);
        else if (word in forth.dict)
            forth.dict[word]();
        else
            throw 'unknown word: '+word;
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
