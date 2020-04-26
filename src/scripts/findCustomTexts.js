// analysis of source code (html, ts):
// listing of all used keys for customText

const fs = require("fs");
let foundKeys = {};
let foundSourceFiles = [];

function analyse ( fileName, isHtml ) {
  const fileContent = fs.readFileSync(fileName, 'utf8').toString();

  const searchPattern = isHtml ? /\|\s*customtext:\s*'\w+'/g : /\.getCustomText\s*\(\s*'\w+'\s*\)/g;
  const matches = fileContent.match(searchPattern);
  if (matches) {
    foundSourceFiles.push(fileName);
    for (let i = 0; i < matches.length; i++) {
      const posStart = matches[i].indexOf("'");
      const posEnd = matches[i].lastIndexOf("'");
      const foundKey = matches[i].substr(posStart + 1, posEnd - posStart - 1);
      if (foundKeys[foundKey]) {
        foundKeys[foundKey] += 1;
      } else {
        foundKeys[foundKey] = 1;
      }
    }
  }
}

function takeFolder(sourceFolder ) {
  const dirEntries = fs.readdirSync(sourceFolder);
  for (let i = 0; i < dirEntries.length; i++) {
    const fullObjectName = sourceFolder + '/' + dirEntries[i];
    const stats = fs.statSync(fullObjectName);
    if (stats.isDirectory()) {
      takeFolder(fullObjectName);
    } else if (stats.isFile()) {
      const dotPos = fullObjectName.lastIndexOf('.');
      if (dotPos > 0) {
        const fileExtension = fullObjectName.substr(dotPos + 1);
        if (fileExtension.toUpperCase() === 'TS') {
          analyse(fullObjectName, false);
        } else if (fileExtension.toUpperCase() === 'HTML') {
          analyse(fullObjectName, true);
        }
      }
    }
  }
}

takeFolder('../app');

const defaults = JSON.parse(fs.readFileSync('../app/config/custom-texts.json'));

console.log();
console.log('\x1b[33m%s\x1b[0m', 'used keys:');
for (const k of Object.keys(foundKeys)) {
  if (defaults[k]) {
    console.log(`  ${k}: ${foundKeys[k]}`);
  } else {
    console.log('\x1b[31m%s\x1b[0m', `  ${k}: ${foundKeys[k]}`)
  }
}

console.log();
console.log('\x1b[33m%s\x1b[0m', 'found in:');
for (const f of foundSourceFiles) {
  console.log(`  ${f}`);
}

console.log();
console.log('\x1b[33m%s\x1b[0m', 'not used:');
for (const k of Object.keys(defaults)) {
  if (!foundKeys[k]) {
    console.log(`  ${k}`);
  }
}

console.log();
console.log('done.');
