=============================
Forth on browser - code guide
=============================

This is a guide describing the development of a Lisp interpreter. It
does not mention all details, but highlights the most important
milestones.

Each sections contains Github links either to a commit, or to relevant
code at the time of writing. However, often looking at the *final*
version of the code can be instructive as well -- some code has been
since refactored and is now simpler.

Simple stack-based execution
============================

Forth code consists of tokens separated by spaces. We recognize number
literals and words. A number literal in the code simply puts that
number on the data stack. A *word* is a procedure that removes some
values from the stack as arguments, and pushes some as results.

For now, the parser (``forth.parse``) simply splits the code and
converts the number tokens (i.e. tokens matching ``/^-?\d+$/``) to
JavaScript numbers, leaving the rest a strings.

The data stack is implemented by the ``forth.stack`` object. While the
stack itself is a simple array, we write some helper functions
(``push``, ``pushList``, ``pop``, etc.) that report errors.

We implement four standard words: ``+``, ``-``, ``*``, ``/``. They all
take two arguments and return one result. A helper function
``standardWord`` takes care of the stack manipulation, so that we
receive the arguments as function arguments, and we can return the
result as an array of values to be pushed: ::

    forth.dict['+'] = forth.standardWord(2, function(a, b) { return [a+b]; });

With that machinery in hand, we can easily implement several other
standard Forth words, such as printing (``.``) and stack manipulation
words (``drop``, ``swap``, ``dup``, etc.)

Code
----

`Parser function
<https://github.com/nishio/FORTH-on-browser/commit/b0e3904e23162dd46ef181755c201bceaf4684b1>`_

`Interpreter with arithmetics
<https://github.com/nishio/FORTH-on-browser/commit/b0e3904e23162dd46ef181755c201bceaf4684b1>`_

`Printing word ('.')
<https://github.com/nishio/FORTH-on-browser/commit/0e1fe64fa27ee6a5303747dc1604c8032f178cd5>`_

`Stack manipulation words
<https://github.com/nishio/FORTH-on-browser/commit/43266f6d55e39e4f8291a0e9756632f8eebb975d>`_

Comparison and booleans
=======================

We make a departure from the original Forth: instead of using integers
and true and false, we use a separate boolean type. Because we're
implementing the interpreter in a high-level language anyway, this is
easy to do and helpful for the user. Because ``if`` will always expect
a boolean, it will be easier to find bugs.

Adding a second type means we need type checking. We add argument type
signatures to all words, but allow for any type in some cases: ::

    forth.dict['+'] = forth.standardWord(
       ['number', 'number'], function(a, b) { return [a+b]; });

    forth.dict['drop'] =
       forth.standardWord(['any'], function(a) { return []; });

Code
----

`Type checking
<https://github.com/nishio/FORTH-on-browser/commit/3cef21d9278cabe88d4a39f8106c933da2dff568>`_

`Booleans and boolean words
<https://github.com/nishio/FORTH-on-browser/commit/3cef21d9278cabe88d4a39f8106c933da2dff568>`_

`Number comparison
<https://github.com/nishio/FORTH-on-browser/commit/fadc300a2ba7f7ad2860f8c2b0afb3a859eef433>`_

Compilation
===========

So far, all Forth code has been interpreted (executed
token-by-token). Now, we will add another layer: a compiler. The words
will be compiled as instructions of a simple virtual machine, so that
``2 2 +`` becomes a list of commands: ::

    0: number 2
    1: number 2
    2: call +

There are several reasons for that. Mostly, we want to show how a
Forth compiler might look like, with compile mode / run mode
distinction. This will also allow us to easily implement control
structures like ``if..else..end``. We will also use the machine code
to write a step-by-step debugger.

We now have two modes of processing each token:

- *run mode*, in which we simply execute it (push a number, run the procedure),
- *compile mode*, in which the token is translated to machine code.

The compile mode is used inside word definitions (``: plus2 2 + ;``),
so ``:`` is a word that has special behaviour in the run mode. It
reads and compiles code until ``;``, compiles it to machine code, and
creates a new word.

Code
----


`Simple virtual machine, and user-defined words (':')
<https://github.com/nishio/FORTH-on-browser/commit/23d89587428d057f36aed21d5796cfb6501d19f5>`_

Conditionals
============

So far our only machine commands are ``number`` and ``call``. Now we
want to allow conditional execution, so we add the commands ``goto``
and ``goto-on-false``. For instance, ``test if a else b then`` (if
``test`` is true, do ``a``, else do ``b``) will get compiled to: ::

    0: call test
    1: goto-on-false 4
    2: call a
    3: goto 5
    4: call b
    5: (end)

Extending the machine code interpreter is trivial. To implement
``if..else..then``, we make ``if`` a word with special compile-time
behavior: it basically compiles code until ``else`` or ``then``, and adds
some ``goto`` instructions where necessary.

Later we implement ``do..until`` (a loop) in the same way.

Code
----

`Conditional ('if..else..then')
<https://github.com/nishio/FORTH-on-browser/commit/5604ccb79d9abcd0d74b716f717200ee4b654c79>`_

`Loop ('repeat..until', later renamed to 'do..until')
<https://github.com/nishio/FORTH-on-browser/commit/3d8bc0ef372369b70cda3df8225b754b99890277>`_

Other Forth features
====================

We add several other language features:

- comments: the word ``(`` reads and discards everything until ``)``
- variables: ``variable x`` defines a variable, ``x @`` fetches the
  value, ``(value) x !`` stores the value
- indexed loops: ``0 0 10 do i + loop`` sums the numbers from 0 to 9,
  ``i`` inside the loop returns the loop index
- recursion: to call the function within itself, we implement a
  special ``recurse`` machine opcode

The implementations should be easy to understand.

Code
----

`Comments ('(')
<https://github.com/nishio/FORTH-on-browser/commit/c6d643e9d42859b70b2b375e0a67e8194b6f3f66>`_

`Variables ('variable', '@', '!')
<https://github.com/nishio/FORTH-on-browser/commit/b4ed7cae5c7c7733d848444179732148b018ca2c>`_

`Indexed loops ('do..loop')
<https://github.com/nishio/FORTH-on-browser/commit/d42de21c2ade63cb3cf496259e008916c576dd91>`_

`Recursion (by 'recurse', and by word name)
<https://github.com/nishio/FORTH-on-browser/commit/c051a5ac1953cc062015d5b29b4ddb4b9ae611cf>`_

Debugger
========

A major feature of our interpreter is the debugger. We want to be able
to step over the instructions in the machine code one by one. To do
that, we have to explicitly store the execution state, including the
call stack.

We add a ``Context`` class that represents a chunk of machine code
being executed. Each context has a ``step`` method that runs one
command in the code. Later, we make the 'step over / step inside'
distinction: for a ``call`` command, we can either run the whole word,
or add it as a ``Context`` and execute it step-by-step.

Of course, we can only step through user-defined words, i.e. the ones
implemented in Forth, not JavaScript.

Code
----

`'Context' objects
<https://github.com/nishio/FORTH-on-browser/commit/409b0888add1ba836ed6b232118ef4e4d549ff28>`_

`Stepping over and inside procedures
<https://github.com/nishio/FORTH-on-browser/commit/55070705d3ea69256e9d7c57f3027e39eb79d0ed>`_
