"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppImage = exports.APPIMAGE_CATEGORIES = exports.STATUS_CODE = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const process_1 = require("process");
const currentOSArch = require("os").arch;
exports.STATUS_CODE = {
    SUCCESS: 0,
    PATH_NOT_FOUND: 1,
    UNSUPPORTED_OS_ARCHITECTURE: 2,
    UNSUPPORTED_ARCHITECTURE: 3,
    UNSUPPORTED_OS: 4,
    UNKNOWN: 5
};
exports.APPIMAGE_CATEGORIES = {
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
};
class AppImage {
    constructor(executable, resource, files, outdir, options) {
        this._tempDir = null;
        this.executable = executable;
        this.resource = resource;
        this.files = files;
        this.outdir = outdir;
        this.options = options;
    }
    build() {
        if (process_1.platform != "linux") {
            return {
                code: exports.STATUS_CODE.UNSUPPORTED_OS,
                text: `AppImage Can Be Only Built on Linux, if you're on Windows Use WSL`
            };
        }
        function removeTemp(dir) {
            fs_1.default.rmSync(dir, {
                recursive: true,
                force: true
            });
        }
        function makeFileExecutable(file) {
            try {
                let fd = fs_1.default.openSync(file, "r");
                fs_1.default.fchmodSync(fd, 0o777);
            }
            catch (err) {
                throw new Error(err);
            }
        }
        try {
            if (!fs_1.default.existsSync(this.executable)) {
                return {
                    code: exports.STATUS_CODE.PATH_NOT_FOUND,
                    text: `File '${this.executable}' Doesn't Exist`
                };
            }
            else if (!fs_1.default.existsSync(this.resource)) {
                return {
                    code: exports.STATUS_CODE.PATH_NOT_FOUND,
                    text: `File '${this.executable}' Doesn't Exist`
                };
            }
            else if (!fs_1.default.existsSync(this.outdir)) {
                return {
                    code: exports.STATUS_CODE.PATH_NOT_FOUND,
                    text: `Folder '${this.outdir}' Doesn't Exist`,
                };
            }
            if (this.files) {
                for (let i = 0; i < this.files.length; i++) {
                    this.files[i] = path_1.default.resolve(this.files[i]);
                    if (!fs_1.default.existsSync(this.files[i])) {
                        return {
                            code: exports.STATUS_CODE.PATH_NOT_FOUND,
                            text: `File '${this.files[i]}' Doesn't Exist`
                        };
                    }
                }
            }
            this._tempDir = fs_1.default.mkdtempSync(".temp");
            let appDir = path_1.default.join(this._tempDir, `${this.options.programName}.AppDir`);
            let binDir = path_1.default.join(appDir, "usr/bin");
            let apprunFile = path_1.default.join(appDir, "AppRun");
            let desktopFile = path_1.default.join(appDir, `${this.options.programName}.desktop`);
            let appimageToolPath;
            if (currentOSArch() == 'x64') {
                appimageToolPath = path_1.default.resolve(__dirname, '../appimagetool/appimagetool-x86_64.AppImage');
            }
            else if (currentOSArch() == 'x32' || currentOSArch() == 'ia32') {
                appimageToolPath = path_1.default.resolve(__dirname, '../appimagetool/appimagetool-i686.AppImage');
            }
            else {
                if (this._tempDir)
                    removeTemp(this._tempDir);
                return {
                    code: exports.STATUS_CODE.UNSUPPORTED_OS_ARCHITECTURE,
                    text: `Current OS Architecture is Unsupported - ${currentOSArch()}`
                };
            }
            fs_1.default.mkdirSync(appDir);
            fs_1.default.mkdirSync(binDir, {
                recursive: true
            });
            let AppRunData = `#!/bin/sh\nHERE="$(dirname "$(readlink -f "\${0}")")"\nEXEC="\${HERE}/usr/bin/${path_1.default.basename(this.executable)}"\nexec "\${EXEC}"`;
            let DesktopEntry = "[Desktop Entry]\nType=Application\n";
            DesktopEntry += `Name=${this.options.programName}\n`;
            DesktopEntry += `X-AppImage-Name=${this.options.programName}\n`;
            if (this.options.version)
                DesktopEntry += `X-AppImage-Version=${this.options.version}\n`;
            DesktopEntry += `Exec=AppRun\n`;
            if (this.options.genericName)
                DesktopEntry += `GenericName=${this.options.genericName}\n`;
            if (this.options.description)
                DesktopEntry += `Comment=${this.options.description}\n`;
            DesktopEntry += `Categories=`;
            for (let i = 0; i < this.options.categories.length; i++) {
                DesktopEntry += `${this.options.categories[i]};`;
            }
            DesktopEntry += `\n`;
            if (this.options.icon) {
                let iconFile = path_1.default.join(appDir, `applicationIcon.png`);
                fs_1.default.copyFileSync(this.options.icon, iconFile);
                DesktopEntry += `Icon=${path_1.default.basename(iconFile, '.png')}\n`;
            }
            if (this.options.workingDir)
                DesktopEntry += `Path=${this.options.workingDir}`;
            fs_1.default.writeFileSync(apprunFile, AppRunData, {
                encoding: 'utf-8'
            });
            fs_1.default.writeFileSync(desktopFile, DesktopEntry, {
                encoding: 'utf-8'
            });
            makeFileExecutable(apprunFile);
            makeFileExecutable(desktopFile);
            fs_1.default.copyFileSync(this.executable, path_1.default.join(binDir, path_1.default.basename(this.executable)));
            fs_1.default.copyFileSync(this.resource, path_1.default.join(binDir, path_1.default.basename(this.resource)));
            if (this.files) {
                for (let i = 0; i < this.files.length; i++) {
                    fs_1.default.copyFileSync(this.files[i], path_1.default.join(binDir, path_1.default.basename(this.files[i])));
                }
            }
            makeFileExecutable(this.executable);
            let command = ``;
            let outputFile = ``;
            if (this.options.arch == 'x86_64') {
                command = `ARCH=x86_64 ${appimageToolPath} "${appDir}"`;
                outputFile = path_1.default.resolve("./", `${this.options.programName.replace(/ /g, '_')}-x86_64.AppImage`);
            }
            else if (this.options.arch == `i386`) {
                command = `ARCH=i386 ${appimageToolPath} "${appDir}"`;
                outputFile = path_1.default.resolve("./", `${this.options.programName.replace(/ /g, '_')}-i386.AppImage`);
            }
            else {
                removeTemp(this._tempDir);
                return {
                    code: exports.STATUS_CODE.UNSUPPORTED_ARCHITECTURE,
                    text: `Unsupported AppImage Architecture Specified - ${this.options.arch}`
                };
            }
            (0, child_process_1.execSync)(command, {
                stdio: (this.options.showAppImgToolOutput ? 'inherit' : 'ignore')
            });
            removeTemp(this._tempDir);
            let newFilePath = path_1.default.resolve(outputFile, path_1.default.join(path_1.default.resolve(this.outdir), path_1.default.basename(outputFile)));
            fs_1.default.renameSync(outputFile, newFilePath);
            return {
                code: exports.STATUS_CODE.SUCCESS,
                text: newFilePath
            };
        }
        catch (err) {
            try {
                if (this._tempDir) {
                    removeTemp(this._tempDir);
                    this._tempDir = null;
                }
            }
            catch (err) { }
            return {
                code: exports.STATUS_CODE.UNKNOWN,
                text: err
            };
        }
    }
}
exports.AppImage = AppImage;
//# sourceMappingURL=index.js.map