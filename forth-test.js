
// Testing

forth.assertEqual = function(e1, e2) {
    if (e1 != e2) {
        var err = 'Assertion failed: ' + e1 + ' != ' + e2;
        throw err;
    }
};

forth.assertExec = function(code, result) {
    forth.runString(code);
    forth.assertEqual(forth.stack.print(), result);
    forth.stack.reset();
};

// Compile and test code (not only execute)
forth.assertExecC = function(code, result) {
    forth.assertExec(': a '+code+' ; a', result);
};

forth.test = function() {
    forth.terminal.echo('Running tests...');
    try {
        forth.assertEqual(forth.printTokens(forth.parse(' A b c  d ')),
                          'a b c d');

        forth.assertExec('2 3', '[2, 3]');

        forth.assertExec('2 3 +', '[5]');

        forth.assertExec('5 3 0 1 + / -', '[2]');

        forth.assertExec('2 3 swap dup', '[3, 2, 2]');
        forth.assertExec('2 3 drop drop', '[]');
        forth.assertExec('1 2 3 rot', '[2, 3, 1]');
        forth.assertExec('1 2 3 -rot', '[3, 1, 2]');
        forth.assertExec('1 2 over', '[1, 2, 1]');

        forth.assertExec('true false and', '[false]');
        forth.assertExec('true false true and or not', '[false]');

        forth.assertExec('2 2 = 2 2 <= 2 2 >= 2 2 <>', '[true, true, true, false]');
        forth.assertExec('2 3 = 2 3 <= 2 3 >= 2 3 <>', '[false, true, false, true]');
        forth.assertExec('2 2 < 2 2 >', '[false, false]');
        forth.assertExec('2 3 < 2 3 >', '[true, false]');

        forth.assertExec(': a 2 2 + ;', '[]');
        forth.assertExec('a', '[4]');

        forth.assertExecC('true if 1 else 0 then', '[1]');
        forth.assertExecC('false if 1 else 0 then', '[0]');

        forth.assertExecC('true if 1 then', '[1]');
        forth.assertExecC('false if 1 then', '[]');

        forth.assertExecC('2 begin 2 * dup 100 > until', '[128]');

        forth.assertExec(
            '1 2 ( + ) -', '[-1]');
        forth.assertExecC(
            '1 2 ( + ) -', '[-1]');

        // recursion
        forth.assertExec(': a 1 - dup 0 > if a then ; 10 a', '[0]');
        forth.assertExec(': a 1 - dup 0 > if recurse then ; 10 a', '[0]');

        forth.assertExec('variable x 2 x ! x @', '[2]');

        // Cleanup
        forth.stack.reset();
        delete forth.dict['a'];
        delete forth.dict['x'];
        delete forth.variables['x'];

        forth.terminal.echo('All tests OK!');
    } catch (err) {
        forth.terminal.error('test: '+err);
    }
};
