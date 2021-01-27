/* eslint-disable no-console,@typescript-eslint/no-var-requires */
const fs = require('fs');
const { superStates } = require('../app/group-monitor/test-view/super-states');

const mdSourceFilename = '../app/config/super-states.md';
const mdTargetFilename = '../../docs/super-states.md';

console.log('');
console.log('writing markdown');
let mdContent = fs.readFileSync(mdSourceFilename, 'utf8').toString();



Object.keys(superStates).forEach(key => {
  mdContent += ` | ${key} | `;
  if ((typeof superStates[key].class !== 'undefined') && (superStates[key].class === 'success')) {
    mdContent += '<div style="filter: invert(83%) sepia(55%) saturate(487%) hue-rotate(33deg) brightness(104%) contrast(102%);">';
  }
  if ((typeof superStates[key].class !== 'undefined') && (superStates[key].class === 'danger')) {
    mdContent += '<div style="filter: invert(10%) sepia(46%) saturate(5531%) hue-rotate(338deg) brightness(100%) contrast(98%);">';
  }
  mdContent += `<img src="https://fonts.gstatic.com/s/i/materialicons/${superStates[key].icon}/v10/24px.svg">`;
  if (typeof superStates[key].class !== 'undefined') {
    mdContent += '</div>';
  }
  mdContent += ` | ${superStates[key].tooltip} |\n`;
});

fs.writeFileSync(mdTargetFilename, mdContent, 'utf8');

console.log('');
console.log('done.');
