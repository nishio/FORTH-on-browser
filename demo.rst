DEMO
====

.. raw:: html

  <script src="repos/FORTH-on-browser/jquery-1.7.2.min.js"></script>
  <script src="repos/FORTH-on-browser/jquery.terminal-0.4.15.js"></script>
  <script src="repos/FORTH-on-browser/forth.js"></script>
  <script src="repos/FORTH-on-browser/forth-words.js"></script>
  <script src="repos/FORTH-on-browser/forth-interface.js"></script>
  <script src="repos/FORTH-on-browser/forth-test.js"></script>
  <!--<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/jquery-ui.min.js"></script>-->
  <script src="repos/FORTH-on-browser/jquery-ui.min.js"></script>
  <script src="repos/FORTH-on-browser/load_sample.js"></script>
  <link rel="stylesheet" type="text/css" href="repos/FORTH-on-browser/terminal.css" />
  <link rel="stylesheet" type="text/css" href="repos/FORTH-on-browser/style.css" />
  <link rel="stylesheet" type="text/css"
        href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/themes/base/jquery-ui.css">
  <script>
    $(function() {
          $('#tabs').tabs();
          forth.interface($('#term'), $('#stack'));
          forth.sourceLoader($('#source'), $('#load'));
          forth.test();
          $('body').click(function() { forth.terminal.disable(); });
          $('#clear').click(function () { forth.terminal.clear(); });
          forth.dbg.init('#debug-');
    });
  </script>

  <div id="term"></div>
  <div id="stack-container">
    <b>Stack</b><br/>
    <div id="stack"></div>
  </div>
  <div id="tabs">
    <ul>
      <li><a href="#source-tab">Source</a></li>
      <li><a href="#debugger-tab">Debugger</a></li>
    </ul>
    <div id="source-tab">
      <textarea id="source">
      </textarea>
      <div id="source-buttons">
        <input type="button" id="clear" value="Clear terminal" />
        <input type="button" id="load" value="Load source" />
      </div>
    </div> <!-- source-tab -->
    <div id="debugger-tab">
      <input type="checkbox" id="debug-mode" value="debug-mode" />
      <label for="debug-mode">Debug mode</label><br>
      Source:
      <div id="debug-source"></div>
      <input type="button" id="debug-run" value="Run" disabled="disabled" />
      <input type="button" id="debug-step-inside" value="Step Inside" disabled="disabled" />
      <input type="button" id="debug-step-over" value="Step Over" disabled="disabled" />
      <br>
      Call stack:
      <div id="debug-call-stack"></div>
    </div> <!-- debugger-tab -->
  </div> <!-- tabs -->

  <p style="clear: both"></p>

