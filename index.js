#!/usr/bin/env node

const program = require('commander');
const packageJson = require('./package.json');
const draw = require('./lib/draw');

program
    .command('draw')
    .description('Generate login verification picture')
    .option('-n, --number [number]', 'Specify the number of characters.', '4')
    .option('-p, --pattern [pattern]', '1: all number, 2: all uppercase letter, 3: number & uppercase letter.', '1')
    .option('-w, --width [width]', 'Specify the width of image.', '100')
    .option('-h, --height [height]', 'Specify the height of image.', '40')
    .action(draw.drawPic);

program
    .version(packageJson.version)
    .parse(process.argv);
