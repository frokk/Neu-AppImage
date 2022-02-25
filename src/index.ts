import fs from "fs"
import path from "path";
import { execSync } from "child_process";
import { platform } from "process"

const currentOSArch = require("os").arch;

type AppImageOptions = {
	programName: string,
	genericName: string,
	description: string,
	version: string,
	icon: string,
	categories: "Audio" | "Video" | "AudioVideo" | "Development" | "Education" | "Game" | "Graphics" | "Network" | "Office" | "Science" | "Settings" | "System" | "Utility" | [ "Audio" | "Video" | "AudioVideo" | "Development" | "Education" | "Game" | "Graphics" | "Network" | "Office" | "Science" | "Settings" | "System" | "Utility" ],
	workingDir: string,
	arch: "x86_64" | "i386",
	showAppImgToolOutput: boolean
}

export const STATUS_CODE = {
	SUCCESS: 0,
	PATH_NOT_FOUND: 1,
	UNSUPPORTED_OS_ARCHITECTURE: 2,
	UNSUPPORTED_ARCHITECTURE: 3,
	UNSUPPORTED_OS: 4,
	UNKNOWN: 5
}

export const APPIMAGE_CATEGORIES = {
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

export class AppImage {
	public executable: string;
	public resource: string;
	public files: string[];
	public outdir: string;
	public options: AppImageOptions;

	private _tempDir: string | null = null;

	constructor(
		executable: string,
		resource: string,
		files: string[],
		outdir: string,
		options: AppImageOptions
	) {
		this.executable = executable;
		this.resource = resource;
		this.files = files;
		this.outdir = outdir;
		this.options = options;
	}

	build(): { code: number, text: string } {
		if (platform != "linux") {
			return {
				code: STATUS_CODE.UNSUPPORTED_OS,
				text: `AppImage Can Be Only Built on Linux, if you're on Windows Use WSL`
			}
		}
		/**
		 * Function To Clear Temporary Directory
		 */
		 function removeTemp(dir: string) {
			fs.rmSync(dir, {
				recursive: true,
				force: true
			})
		}

		/**
		 * make a file executable.
		 * @param {String} file File Path To Make Executable.
		 */
		function makeFileExecutable(file: string) {
			try {
				let fd = fs.openSync(file, "r");
				fs.fchmodSync(fd, 0o777);
			} catch (err: any) {
				throw new Error(err);
			}
		}

		try {
			if (!fs.existsSync(this.executable)) {
				return {
					code: STATUS_CODE.PATH_NOT_FOUND,
					text: `File '${this.executable}' Doesn't Exist`
				}
			} else if (!fs.existsSync(this.resource)) {
				return {
					code: STATUS_CODE.PATH_NOT_FOUND,
					text: `File '${this.executable}' Doesn't Exist`
				}
			} else if (!fs.existsSync(this.outdir)) {
				return {
					code: STATUS_CODE.PATH_NOT_FOUND,
					text: `Folder '${this.outdir}' Doesn't Exist`,
				}
			}

			if (this.files) {
				for (let i = 0; i < this.files.length; i++) {
					this.files[i] = path.resolve(this.files[i])
					if (!fs.existsSync(this.files[i])) {
						return {
							code: STATUS_CODE.PATH_NOT_FOUND,
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

			if (currentOSArch() == 'x64') {
				appimageToolPath = path.resolve(__dirname, '../appimagetool/appimagetool-x86_64.AppImage');
			} else if (currentOSArch() == 'x32' || currentOSArch() == 'ia32') {
				appimageToolPath = path.resolve(__dirname, '../appimagetool/appimagetool-i686.AppImage');
			} else {
				if (this._tempDir) removeTemp(this._tempDir);
				return {
					code: STATUS_CODE.UNSUPPORTED_OS_ARCHITECTURE,
					text: `Current OS Architecture is Unsupported - ${currentOSArch()}`
				}
			}

			fs.mkdirSync(appDir);
			fs.mkdirSync(binDir, {
				recursive: true
			});

			let AppRunData = `#!/bin/sh\nHERE="$(dirname "$(readlink -f "\${0}")")"\nEXEC="\${HERE}/usr/bin/${path.basename(this.executable)}"\nexec "\${EXEC}"`
			let DesktopEntry = "[Desktop Entry]\nType=Application\n";
			DesktopEntry += `Name=${this.options.programName}\n`;
			DesktopEntry += `X-AppImage-Name=${this.options.programName}\n`;
			if (this.options.version) DesktopEntry += `X-AppImage-Version=${this.options.version}\n`;
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
			if (this.options.arch == 'x86_64') {
				command = `ARCH=x86_64 ${appimageToolPath} "${appDir}"`
				outputFile = path.resolve("./", `${this.options.programName.replace(/ /g, '_')}-x86_64.AppImage`)
			} else if (this.options.arch == `i386`) {
				command = `ARCH=i386 ${appimageToolPath} "${appDir}"`
				outputFile = path.resolve("./", `${this.options.programName.replace(/ /g, '_')}-i386.AppImage`)
			} else {
				removeTemp(this._tempDir);
				return {
					code: STATUS_CODE.UNSUPPORTED_ARCHITECTURE,
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
				code: STATUS_CODE.SUCCESS,
				text: newFilePath
			};
		} catch (err: any) {
			try {
				if (this._tempDir) {
					removeTemp(this._tempDir);
					this._tempDir = null;
				}
			} catch (err: any) {}
			return {
				code: STATUS_CODE.UNKNOWN,
				text: err
			}
		}
	}
}

// let app = new AppImage()