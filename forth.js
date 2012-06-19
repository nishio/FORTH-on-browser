
forth = {};

// Parse input, returning Forth words.
forth.parse = function(s) {
    var tokens = s.split(/\s+/);
    var words = [];

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if (token == '')
            continue;
        if (/^-?\d+/.test(token))
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
        else
            throw 'unknown word: '+word;
    }
};

forth.stack = {
    data: [],
    push: function (elt) { this.data.push(elt); },
    pop: function() {
        if (this.data.length == 0)
            throw 'empty stack';
        return this.data.pop();
    },
    print: function() {
        return '['+this.data.join(', ')+']';
    },
    reset: function() {
        this.data = [];
    }
};
