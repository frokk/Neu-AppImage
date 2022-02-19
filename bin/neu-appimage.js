#!/usr/bin/env node
const { program } = require('commander');
const pkgJSON = require('../package.json');
const process = require('process');
const path = require('path');
const fs = require('fs');
const { error } = require('../src/utils');
const { exit } = require('process');

const AppImage = require('../src/index');

function argumentNotPassed(arg) {
	program.outputHelp();
	error(`Argument "${arg}" Not Specified.`)
}

program
	.name("Neu AppImage")
	.description(pkgJSON.description)
	.version(pkgJSON.version)
	.option('--exe <string>', 'Path To The Main Executable')
	.option('--res <string>', 'Path To The "resource.neu" File')
	.option('--files <string[]>', 'Path To Other Files To Include (seprated by comma, example: file1,file2,file3)')
	.option('--program-name <string>', 'Name Of The Program')
	.option('--generic-name <string>', 'Generic Name Of The Program')
	.option('--description <string>', 'Description Of The Program')
	.option('--icon <string>', 'Path To The Program Icon')
	.option('--categories <string>', 'Category Of The Program (Seprated By Comma if multiple, example: cat1,cat2)')
	.option('--working-dir <string>', 'The working directory to run the program in')
	.option('--arch <string>', 'Program Architecture (x64 or x32)')
	.option('--out-dir <string>', 'Path to directory to save AppImage in')
	.option('--list-categories', 'List Available Categories.', false);

program.parse();

const options = program.opts();

if (options.listCategories) {
	console.log(`Available Program Categories:
  1.  Audio
  2.  Video
  3.  AudioVideo
  4.  Development
  5.  Education
  6.  Game
  7.  Graphics
  8.  Network
  9.  Office
  10. Science
  11. Settings
  12. System
  13. Utility`);
	exit(0);
} else {
	if (!options.exe) argumentNotPassed("--exe")
	if (!options.res) argumentNotPassed("--res")
	if (!options.programName) argumentNotPassed("--program-name")
	if (!options.description) argumentNotPassed("--description")
	if (!options.icon) argumentNotPassed("--icon")
	if (!options.categories) argumentNotPassed("--categories")
	if (!options.arch) argumentNotPassed("--arch")
	if (!options.outDir) argumentNotPassed("--out-dir")
}

if (!fs.existsSync(options.exe)) error(`Executable ${options.exe} Doesn't Exist`);
if (!fs.existsSync(options.res)) error(`Resource File ${options.exe} Doesn't Exist`);
if (!fs.existsSync(options.icon)) error(`Icon ${options.exe} Doesn't Exist`);

if (!(options.arch == 'x64' || !options.arch == 'x32')) {
	error(`Invalid AppImage Architecture "${options.arch}"`)
}

let files;

if (options.files) {
	files = options.files.split(',');

	files.forEach((element, index) => {
		files[index] = path.resolve(element)
		if (!fs.existsSync(files[index])) {
			error(`File "${path.basename(files[index])}" doesn't Exist`);
		}
	});
}

let categories = options.categories.split(",");

for (let i = 0; i < categories.length; i++) {
	if (![
			"Audio", "Video", "AudioVideo",
			"Development", "Education", "Game",
			"Graphics", "Network", "Office",
			"Science", "Settings", "System", "Utility",
		].includes(categories[i])) {
		error(`Invalid Category Specified "${categories[i]}"`)
	}
}

const myAppImage = new AppImage();
myAppImage.executable = options.exe;
myAppImage.resource = options.res;
if (options.files) myAppImage.files = files;
myAppImage.outdir = options.outDir;
myAppImage.options = {
	programName: options.programName,
	description: options.description,
	categories: categories,
	icon: path.resolve(options.icon),
	arch: options.arch,
	showAppImgToolOutput: false
}

const result = myAppImage.build();

if (result.code != AppImage.code.SUCCESS) {
	let msg = ``;
	let errCodes = Object.values(AppImage.code);

	for (let i = 0; i < errCodes.length; i++) {
		if (errCodes[i] == result.code) {
			msg = `${result.text}\n\nERROR IDENTIFIER: ${Object.keys(AppImage.code)[i]}`;
			break;
		}
	}
	console.error(msg);
	exit(1);
} else {
	console.log(`Success! AppImage Created At ${result.text}`);
}
