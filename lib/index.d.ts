declare type AppImageOptions = {
    programName: string;
    genericName: string;
    description: string;
    version: string;
    icon: string;
    categories: "Audio" | "Video" | "AudioVideo" | "Development" | "Education" | "Game" | "Graphics" | "Network" | "Office" | "Science" | "Settings" | "System" | "Utility" | ["Audio" | "Video" | "AudioVideo" | "Development" | "Education" | "Game" | "Graphics" | "Network" | "Office" | "Science" | "Settings" | "System" | "Utility"];
    workingDir: string;
    arch: "x86_64" | "i386";
    showAppImgToolOutput: boolean;
};
export declare const STATUS_CODE: {
    SUCCESS: number;
    PATH_NOT_FOUND: number;
    UNSUPPORTED_OS_ARCHITECTURE: number;
    UNSUPPORTED_ARCHITECTURE: number;
    UNSUPPORTED_OS: number;
    UNKNOWN: number;
};
export declare const APPIMAGE_CATEGORIES: {
    AUDIO: string;
    VIDEO: string;
    AUDIOVIDEO: string;
    DEVELOPMENT: string;
    EDUCATION: string;
    GAME: string;
    GRAPHICS: string;
    NETWORK: string;
    OFFICE: string;
    SCIENCE: string;
    SETTINGS: string;
    SYSTEM: string;
    UTILITY: string;
};
export declare class AppImage {
    executable: string;
    resource: string;
    files: string[];
    outdir: string;
    options: AppImageOptions;
    private _tempDir;
    constructor(executable: string, resource: string, files: string[], outdir: string, options: AppImageOptions);
    build(): {
        code: number;
        text: string;
    };
}
export {};
