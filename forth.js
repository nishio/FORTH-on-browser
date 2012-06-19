
forth = {};

// Parse input, returning Forth words.
forth.parse = function(s) {
    var tokens = s.split(/\s+/);
    var words = [];

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token == '')
            continue;
        if (/^-?\d+$/.test(token))
            words.push(parseInt(token));
        else
            // Unlike original Forth, we'll be case-insensitive
            words.push(token.toLowerCase());
    }

    return words;
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
        this.data.splice(this.data.length-n);
        return result;
    },

    print: function() {
        return '['+this.data.join(', ')+']';
    },

    reset: function() {
        this.data.splice(0);
    }
};

forth.standardWord = function(numArgs, func) {
    return function() {
        var args = forth.stack.popList(numArgs);
        var result = func.apply(null, args);
        forth.stack.pushList(result);
    };
};

// Dictionary of words (as functions to execute)
forth.dict = {};

forth.dict['+'] = forth.standardWord(2, function(a, b) { return [a+b]; });
