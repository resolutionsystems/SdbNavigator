/*
* A node.js script to build the final SdbNavigator Chrome Plugin. The most important thing is to strip unused files: we
* don't want a bloated plugin!
*
* usage:
* - install node / npm
* - run:
*			npm install wrench -g
*			npm install node-native-zip -g
* - run this script
*
*/
var stdin = process.stdin, util = require('util'), wrench = require('wrench'), fs = require('fs'), _path = require("path"),
	zip = require("node-native-zip"), archive = new zip(), isFile, archiveFiles = [];

isFile = function(fname){
	return !fs.statSync( fname ).isDirectory();
};

stdin.resume();
console.log('What is the new build version: ');
stdin.once('data', function(input) {
	var manifest, version = input.toString().trim();
	console.log('Will now build: ' + version + '...');

	wrench.rmdirSyncRecursive('./build', true);
	wrench.mkdirSyncRecursive('./build/extjs/resources/themes/images');
	wrench.mkdirSyncRecursive('./build/extjs/resources/css');
	wrench.copyDirSyncRecursive('./app', './build/app');
	wrench.copyDirSyncRecursive('./extjs/resources/themes/images/default', './build/extjs/resources/themes/images/default');
	wrench.copyDirSyncRecursive('./resources', './build/resources');

	//copy the final files
	fs.writeFileSync('./build/extjs/ext-all.js', fs.readFileSync('./extjs/ext-all.js'));
	fs.writeFileSync('./build/extjs/license.txt', fs.readFileSync('./extjs/license.txt'));
	fs.writeFileSync('./build/extjs/resources/css/ext-all.css', fs.readFileSync('./extjs/resources/css/ext-all.css'));
	fs.writeFileSync('./build/app.js', fs.readFileSync('./app.js'));
	fs.writeFileSync('./build/extension.html', fs.readFileSync('./extension.html'));

	//install production ext.js!
	fs.writeFileSync('./build/index.html', fs.readFileSync('./index.html').toString().replace('ext-all-dev.js', 'ext-all.js'));

	//make and write the final
	manifest = JSON.parse(fs.readFileSync('./manifest.json'));
	manifest.version = version;
	fs.writeFileSync('./build/manifest.json', JSON.stringify(manifest));

	//zip it up!
	wrench.readdirSyncRecursive('./build/').filter(isFile).forEach(function (file) {
		archiveFiles.push({ name: file.substr(6), path: file});
	});

	console.log('All files copied and prepared! Start zipping....');
	archive.addFiles(archiveFiles, function (err) {
		var buff;
		if (err) {
			return console.log("err while adding files", err);
		}

		buff = archive.toBuffer();
		fs.writeFile("./build/build.zip", buff, function () {
			console.log('Done! Build available in folder "build". Plugin is packed in ./build/build.zip');
			setTimeout(function() {
				//make sure we actually see the output message!
				process.exit();
			}, 1000);
		});
	});
});