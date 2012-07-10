DEMO
====

.. raw:: html

  <script src="repos/FORTH-on-browser/jquery-1.7.2.min.js"></script>
  <script src="repos/FORTH-on-browser/jquery.terminal-0.4.15.js"></script>
  <script src="repos/FORTH-on-browser/forth.js"></script>
  <script src="repos/FORTH-on-browser/forth-interface.js"></script>
  <script src="repos/FORTH-on-browser/forth-test.js"></script>
  <link rel="stylesheet" type="text/css" href="repos/FORTH-on-browser/terminal.css" />
  <script>
    $(function() {
          forth.interface($('#term'), $('#stack'));
          forth.test();
          $('body').click(function() { forth.terminal.disable(); });
          $('#clear').click(function () { forth.terminal.clear(); });
    });
  </script>
  <style>
    .stackElt {
        width: 100%;
        height: 1.3em;
        border: 1px solid black;
        margin: 0.2em;
        text-align: center;
        vertical-align: middle;
    }
  </style>

  <div id="term" style="width: 48%; height: 300px; float: left;"></div>
  <div style="width: 100px; height: 300px; float:left; margin-left:1em;">
    <b>Stack</b><br/>
    <div id="stack"></div>
  </div>

  <p style="clear: both"></p>
