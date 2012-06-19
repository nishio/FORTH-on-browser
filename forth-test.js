
// Testing

function assertEqual(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

function assertExec(code, result) {
    forth.execute(forth.parse(code));
    assertEqual(forth.stack.print(), result);
    forth.stack.reset();
}

forth.test = function() {
    forth.terminal.echo('Running tests...');
    try {
        assertEqual(forth.printWords(forth.parse(' A b c  d ')),
                          'a b c d');

        assertExec('2 3', '[2, 3]');

        assertExec('2 3 +', '[5]');

        assertExec('5 3 0 1 + / -', '[2]');

        forth.stack.reset();
        forth.terminal.echo('All tests OK!');
    } catch (err) {
        forth.terminal.error('test: '+err);
    }
};
