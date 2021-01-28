/* eslint-disable no-console,@typescript-eslint/no-var-requires */
const fs = require('fs');
const { superStates } = require('../app/group-monitor/test-view/super-states');

const mdTargetFilename = '../../docs/super-states.html';

console.log('writing html documentation');

let content = '';

Object.keys(superStates).forEach(key => {
  const className = (typeof superStates[key].class !== 'undefined') ? superStates[key].class : '';
  content += `
<table>
  <tr>
    <td rowspan="3"><i class="${className} material-icons">${superStates[key].icon}</i></td>
    <td><strong>${key}</strong></td>
  </tr>
  <tr>
    <td>Tooltip: <code>${superStates[key].tooltip}</code></td>
  </tr>
   <tr>
    <td>${superStates[key].description}</td>
  </tr>
</table>
<br>
  `;
});

const docFile = `
<!DOCTYPE html>
<html lang="de">
  <meta charset="utf-8">
  <title>States of Running Tests</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    body {
      font-family: sans-serif;
    }
    i {
      font-family: "Material Icons";
      font-style: normal;
      font-size: xx-large;
    }
    i.warning {
      color: #821123;
    }
    i.danger {
      color: #821123;
    }
    i.success {
      color: #b2ff59 !important
    }
  </style>
</html>
<body>
  <h1>States of Running Tests</h1>
  <p>(explanatory text)</p>
  ${content}
</body>
`;

fs.writeFileSync(mdTargetFilename, docFile, 'utf8');
console.log('done.');
