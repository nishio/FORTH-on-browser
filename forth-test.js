
// Testing

function assertEqual(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

forth.test = function() {
    forth.terminal.echo('Running tests...');
    try {
        assertEqual(forth.printWords(forth.parse(' A b c  d ')),
                          'a b c d');

        forth.execute([2,3]);
        assertEqual(forth.stack.print(), '[2, 3]');

        forth.stack.reset();
        forth.terminal.echo('All tests OK!');
    } catch (err) {
        forth.terminal.error('test: '+err);
    }
};
