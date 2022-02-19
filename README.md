# Neu-AppImage
Package Neutralino Application Into AppImage Format

---

## From the Command Line

Running Neu AppImage from the command line has this basic form:

```bash
npx neu-appimage --exe <main-executable> --res <resource.neu-file> --program-name <program-name> --description <description> --icon <png-512x512-icon> --categories <categories> --arch <architecture> --out-dir <output-directory> [Optional Arguments]
```

You can directly build your AppImage from command line, available options are:

```html
     NAME            TYPE      OPTIONAL         DESCRIPTION
--exe              <string>      NO        Path To The Main Executable
--res              <string>      NO        Path To The "resource.neu" File
--files            <string>      NO        Path To Other Files To Include (seprated by comma, example: file1,file2,file3)
--program-name     <string>      NO        Name Of The Program
--generic-name     <string>      YES       Generic Name Of The Program
--description      <string>      NO        Description Of The Program
--icon             <string>      NO        Path To The Program Icon
--categories       <string>      NO        Category Of The Program (Seprated By Comma if multiple, example: cat1,cat2)
--working-dir      <string>      YES       The working directory to run the program in
--arch             <string>      NO        Program Architecture (x64 or x32)
--out-dir          <string>      NO        Path to directory to save AppImage in
--list-categories                YES       List Available Categories. (default: false)
-V, --version                    YES       Output the version number
-h, --help                       YES       Display help for command
```

---

## API

```javascript
const AppImage = require('neu-appimage');
```

### `new AppImage(executable, resource, files, outdir, options)`

`executable` is the path to the Main Neutralino Generated Binary.

`resource` is an object that can contain following fields:

`files` is an Array of Strings containing Path To Files To Be Included in AppImage.

`outdir` is a String Path to the directory in which to save the AppImage To.

`options` is an object that can contain following fields:

* `programName` - Name of the program (ex - FireFox).
* `genericNamen` - Generic Name of the program (ex - Web Browser).
* `description` - Description of the program.
* `icon` - Path to the icon file (`.png`) in 512x512 or 256x256 resolution.
* `categories` - Array of Strings Containing Category of the program.
* These are the available `categories`
    - Audio
    - Video
    - AudioVideo
    - Development
    - Education
    - Game
    - Graphics
    - Network
    - Office
    - Science
    - Settings
    - System
    - Utility
* `workingDir` - The working directory to run the program in.
* `arch` - Architecture of your program which the AppImage will inherit (only `x64` & `x32` are supported currently)
* `showAppImgToolOutput` - if true, output of the [AppImage Tool](https://github.com/AppImage/AppImageKit) will be showed on console (can be useful for debugging if command fails)

### `myAppImageInstance.build()`
Builds the AppImage & returns Object containing information related to Build

`code` - Return Code is `AppImage.code.SUCCESS` if AppImage Was Created Successfully else it can return:
* `AppImage.code.PATH_NOT_FOUND` - If a File/Folder doesn't Exist
* `AppImage.code.UNSUPPORTED_OS_ARCHITECTURE` - If the machine running the code is not `x64` or `x32` Bit.
* `AppImage.code.UNSUPPORTED_ARCHITECTURE` - If the `arch` property in `options` is not `x64` or `x32`
* `AppImage.code.UNSUPPORTED_OS` - If the machine running the code is not Linux
* `AppImage.code.UNKNOWN` - If the error is Unknown.

`text` - Path to the generated AppImage if successfully created one, else Description of the Error Occured.

---

## Found Bugs?

You can report bugs/issues [Here](https://github.com/DEVLOPRR/Neu-AppImage/issues/new/choose)

---

# Thanks
