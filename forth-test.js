
// Testing

forth.assertEqual = function(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

forth.assertExec = function(code, result) {
    forth.execute(forth.parse(code));
    forth.assertEqual(forth.stack.print(), result);
    forth.stack.reset();
}

forth.test = function() {
    forth.terminal.echo('Running tests...');
    try {
        forth.assertEqual(forth.printWords(forth.parse(' A b c  d ')),
                          'a b c d');

        forth.assertExec('2 3', '[2, 3]');

        forth.assertExec('2 3 +', '[5]');

        forth.assertExec('5 3 0 1 + / -', '[2]');

        forth.assertExec('2 3 swap dup', '[3, 2, 2]');
        forth.assertExec('2 3 drop drop', '[]');
        forth.assertExec('1 2 3 rot', '[2, 3, 1]');
        forth.assertExec('1 2 3 -rot', '[3, 1, 2]');
        forth.assertExec('1 2 over', '[1, 2, 1]');

        forth.stack.reset();
        forth.terminal.echo('All tests OK!');
    } catch (err) {
        forth.terminal.error('test: '+err);
    }
};
