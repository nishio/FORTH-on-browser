
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
