/* eslint-disable no-console,@typescript-eslint/no-var-requires */
const https = require('https');
const fs = require('fs');
const { superStates } = require('../app/group-monitor/test-view/super-states');

const mdSourceFilename = '../app/config/super-states.md';
const mdTargetFilename = '../../docs/super-states.md';

const getIcon = icon => new Promise((resolve, reject) => {
  https.get(`https://fonts.gstatic.com/s/i/materialicons/${icon}/v10/24px.svg`, response => {
    const dataChunks = [];
    if (response.statusCode < 200 || response.statusCode > 299) {
      response.on('data', () => {});
      reject(response.statusCode);
    } else {
      response.on('data', fragments => {
        dataChunks.push(fragments);
      });
      response.on('end', () => {
        console.log(`got ${icon}`);
        const responseBody = Buffer.concat(dataChunks);
        resolve(responseBody.toString());
      });
    }
    response.on('error', error => {
      console.log(`error ${icon}`);
      reject(error);
    });
  });
});

const classToColor = {
  warning: '#821123',
  danger: '#821123',
  success: '#b2ff59'
};

const colorizeIcon = (color, iconSVGCode) => iconSVGCode.replace('<svg', `<svg style="fill:${color}"`);

const writeDocs = async () => {
  console.log('writing markdown documentation');
  const keys = Object.keys(superStates);
  let mdContent = fs.readFileSync(mdSourceFilename, 'utf8').toString();
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    console.log(`writing doc for ${key}`);
    mdContent += ` | ${key} | `;
    try {
      // eslint-disable-next-line no-await-in-loop
      let icon = await getIcon(superStates[key].icon);
      if (typeof superStates[key].class !== 'undefined') {
        icon = colorizeIcon(classToColor[superStates[key].class], icon);
      }
      mdContent += icon;
    } catch (e) {
      console.log(e);
      mdContent += '[?]';
    }

    // if ((typeof superStates[key].class !== 'undefined') && (superStates[key].class === 'success')) {
    //   mdContent += '<div style="filter: invert(83%) sepia(55%) saturate(487%) hue-rotate(33deg) brightness(104%) contrast(102%);">';
    // }
    // if ((typeof superStates[key].class !== 'undefined') && (superStates[key].class === 'danger')) {
    //   mdContent += '<div style="filter: invert(10%) sepia(46%) saturate(5531%) hue-rotate(338deg) brightness(100%) contrast(98%);">';
    // }
    // mdContent += `<img src="https://fonts.gstatic.com/s/i/materialicons/${superStates[key].icon}/v10/24px.svg">`;
    // if (typeof superStates[key].class !== 'undefined') {
    //   mdContent += '</div>';
    // }
    mdContent += ` | ${superStates[key].tooltip} |\n`;
  }
  fs.writeFileSync(mdTargetFilename, mdContent, 'utf8');
  console.log('');
  console.log('done.');
};

writeDocs();
