import { PackageManager } from "../helpers/get-pkg-manager";

export type TemplateType = "piximoroxel8ai";
export type TemplateMode = "js" | "ts";

export interface GetTemplateFileArgs {
    template: TemplateType;
    mode: TemplateMode;
    file: string;
}

export interface InstallTemplateArgs {
    gameName: string;
    root: string;
    packageManager: PackageManager;
    isOnline: boolean;

    template: TemplateType;
    mode: TemplateMode;
    eslint: boolean;
    prettier: boolean;
    agent: boolean;
}
