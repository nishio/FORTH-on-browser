==================
 FORTH on browser
==================


TODO
====

- the user will be able to input the words in the interpreter to execute them
- the webpage will show the current state of the stack (as a list on the right side of the terminal)
- simple words: numbers, arithmetic (+,-,*,/), stack manipulation (dup, drop, swap etc.), printing the result (.)
- (no procedures yet)


A rough plan for later:

- comparison (=, < etc.), if-then-else, loops
- storing and retrieving variables (!, @)
- procedures (e.g. to define 'double': ': double dup + ;')
- debugger: show execution state with call stack and all the words, [step into] and [step over] buttons
- maybe I/O: asking for input from the user
