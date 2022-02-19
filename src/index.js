const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const currentOSArch = require('process').arch;
const platform = require('process').platform;

/**
 * Categories Defination
 * @typedef {string[]} Categories
 */

/**
 * AppImage Arguments
 * @typedef {object} Options
 * @property {string} programName - Program Name.
 * @property {string} genericName - Generic Program Name.
 * @property {string} description - Program Description.
 * @property {string} icon - Path to the icon of the program (512x512).
 * @property {Categories} categories - Program category. (Available Categories - Audio, Video, AudioVideo, Development, Education, Game, Graphics, Network, Office, Science, Settings, System, Utility)
 * @property {string} workingDir - The working directory to run the program in.
 * @property {string} arch - Program Architecture (x64 or x32)
 * @property {boolean} showAppImgToolOutput - if true, it will show the AppImage Tool output
 */

/**
 * @class AppImage
 */
class AppImage {
	/**
	 * @param {string} executable Path To The Main Executable
	 * @param {string} resource Path To The Resource.neu File
	 * @param {string[]} files Additional Files You Want To Include in AppImage
	 * @param {string} outdir Path To Output The AppImage
	 * @param {Options} options AppImage Options
	 */
	constructor(executable, resource, files, outdir, options) {
		this.executable = executable;
		this.resource = resource;
		this.files = files;
		this.outdir = outdir;
		this.options = options;
	}

	_tempDir = null;

	static get code() {
		return {
			SUCCESS: 0,
			PATH_NOT_FOUND: 1,
			UNSUPPORTED_OS_ARCHITECTURE: 2,
			UNSUPPORTED_ARCHITECTURE: 3,
			UNSUPPORTED_OS: 4,
			UNKNOWN: 5
		}
	}

	static get Category() {
		return {
			AUDIO: "Audio",
			VIDEO: "Video",
			AUDIOVIDEO: "AudioVideo",
			DEVELOPMENT: "Development",
			EDUCATION: "Education",
			GAME: "Game",
			GRAPHICS: "Graphics",
			NETWORK: "Network",
			OFFICE: "Office",
			SCIENCE: "Science",
			SETTINGS: "Settings",
			SYSTEM: "System",
			UTILITY: "Utility"
		}
	}

	/**
	 * Build The AppImage
	 * @returns {object} Object Containing Exit Code, Description
	 */
	build() {
		if (platform != "linux") {
			return {
				code: AppImage.code.UNSUPPORTED_OS,
				text: `AppImage Can Be Only Built on Linux, if you're on Windows Use WSL`
			}
		}
		/**
		 * Function To Clear Temporary Directory
		 */
		 function removeTemp(dir) {
			fs.rmSync(dir, {
				recursive: true,
				force: true
			})
		}

		/**
		 * make a file executable.
		 * @param {String} file File Path To Make Executable.
		 */
		function makeFileExecutable(file) {
			try {
				let fd = fs.openSync(file, "r");
				fs.fchmodSync(fd, 0o777);
			} catch (error) {
				throw new Error(error);
			}
		}

		try {
			if (!fs.existsSync(this.executable)) {
				return {
					code: AppImage.code.PATH_NOT_FOUND,
					text: `File '${this.executable}' Doesn't Exist`
				}
			} else if (!fs.existsSync(this.resource)) {
				return {
					code: AppImage.code.PATH_NOT_FOUND,
					text: `File '${this.executable}' Doesn't Exist`
				}
			} else if (!fs.existsSync(this.outdir)) {
				return {
					code: AppImage.code.PATH_NOT_FOUND,
					text: `Folder '${this.outdir}' Doesn't Exist`,
				}
			}

			if (this.files) {
				for (let i = 0; i < this.files.length; i++) {
					this.files[i] = path.resolve(this.files[i])
					if (!fs.existsSync(this.files[i])) {
						return {
							code: AppImage.code.PATH_NOT_FOUND,
							text: `File '${this.files[i]}' Doesn't Exist`
						}
					}
				}
			}

			this._tempDir = fs.mkdtempSync(".temp");
			let appDir = path.join(this._tempDir, `${this.options.programName}.AppDir`);
			let binDir = path.join(appDir, "usr/bin");
			let apprunFile = path.join(appDir, "AppRun");
			let desktopFile = path.join(appDir, `${this.options.programName}.desktop`);
			let appimageToolPath;
		
			if (currentOSArch == 'x64') {
				appimageToolPath = path.resolve('./', 'appimagetool/appimagetool-x86_64.AppImage');
			} else if (currentOSArch == 'x32' || currentOSArch == 'ia32') {
				appimageToolPath = path.resolve('./', 'appimagetool/appimagetool-i686.AppImage');
			} else {
				removeTemp(this._tempDir);
				return {
					code: AppImage.code.UNSUPPORTED_OS_ARCHITECTURE,
					text: `Current OS Architecture is Unsupported - ${currentOSArch}`
				}
			}
		
			fs.mkdirSync(appDir);
			fs.mkdirSync(binDir, {
				recursive: true
			});
		
			let AppRunData = `#!/bin/sh\nHERE="$(dirname "$(readlink -f "\${0}")")"\nEXEC="\${HERE}/usr/bin/${path.basename(this.executable)}"\nexec "\${EXEC}"`
			let DesktopEntry = "[Desktop Entry]\nType=Application\n";
			DesktopEntry += `Name=${this.options.programName}\n`;
			DesktopEntry += `Exec=AppRun\n`;
			if (this.options.genericName) DesktopEntry += `GenericName=${this.options.genericName}\n`;
			if (this.options.description) DesktopEntry += `Comment=${this.options.description}\n`;

			DesktopEntry += `Categories=`
			for (let i = 0; i < this.options.categories.length; i++) {
				DesktopEntry += `${this.options.categories[i]};`
			}
			DesktopEntry += `\n`
		
			if (this.options.icon) {
				let iconFile = path.join(appDir, `applicationIcon.png`);
				fs.copyFileSync(this.options.icon, iconFile);
				DesktopEntry += `Icon=${path.basename(iconFile, '.png')}\n`
			}
			if (this.options.workingDir) DesktopEntry += `Path=${this.options.workingDir}`
		
			fs.writeFileSync(apprunFile, AppRunData, {
				encoding: 'utf-8'
			});
		
			fs.writeFileSync(desktopFile, DesktopEntry, {
				encoding: 'utf-8'
			});
		
			makeFileExecutable(apprunFile);
			makeFileExecutable(desktopFile);

			fs.copyFileSync(this.executable, path.join(binDir, path.basename(this.executable)));
			fs.copyFileSync(this.resource, path.join(binDir, path.basename(this.resource)));

			if (this.files) {
				for (let i = 0; i < this.files.length; i++) {
					fs.copyFileSync(this.files[i], path.join(binDir, path.basename(this.files[i])));
				}
			}

			makeFileExecutable(this.executable);
		
			let command = ``;
			let outputFile = ``;
			if (this.options.arch == 'x64') {
				command = `ARCH=x86_64 ${appimageToolPath} "${appDir}"`
				outputFile = path.resolve("./", `${this.options.programName.replace(/ /g, '_')}-x86_64.AppImage`)
			} else if (this.options.arch == `x32`) {
				command = `ARCH=i386 ${appimageToolPath} "${appDir}"`
				outputFile = path.resolve("./", `${this.options.programName.replace(/ /g, '_')}-i386.AppImage`)
			} else {
				removeTemp(this._tempDir);
				return {
					code: AppImage.code.UNSUPPORTED_ARCHITECTURE,
					text: `Unsupported AppImage Architecture Specified - ${this.options.arch}`
				}
			}

			execSync(command, {
				stdio: (this.options.showAppImgToolOutput ? 'inherit' : 'ignore')
			});

			removeTemp(this._tempDir);

			let newFilePath = path.resolve(outputFile, path.join(path.resolve(this.outdir), path.basename(outputFile)));
			fs.renameSync(outputFile, newFilePath);
			return {
				code: AppImage.code.SUCCESS,
				text: newFilePath
			};
		} catch (error) {
			try {
				if (this._tempDir) {
					removeTemp(this._tempDir);
					this._tempDir = null;
				}
			} catch (error) {}
			return {
				code: AppImage.code.UNKNOWN,
				text: error
			}
		}
	}
}

module.exports = AppImage;