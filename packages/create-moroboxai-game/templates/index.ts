import { install } from "../helpers/install";
import { makeDir } from "../helpers/make-dir";
import { copy } from "../helpers/copy";

import { async as glob } from "fast-glob";
import os from "os";
import fs from "fs";
import path from "path";
import { cyan, bold } from "picocolors";
import { Sema } from "async-sema";

import { GetTemplateFileArgs, InstallTemplateArgs } from "./types";

/**
 * Get the file path for a given file in a template, e.g. "next.config.js".
 */
export const getTemplateFile = ({
    template,
    mode,
    file
}: GetTemplateFileArgs): string => {
    return path.join(__dirname, template, mode, file);
};

export const SRC_DIR_NAMES = ["agent.ts", "agent.js", "game.ts", "game.js"];

export const TEMPLATE_MODULE_NAME = {
    piximoroxel8ai: "PixiMoroxel8AI"
};

/**
 * Install a MoroboxAI internal template to a given `root` directory.
 */
export const installTemplate = async ({
    gameName,
    root,
    packageManager,
    isOnline,
    template,
    mode,
    agent,
    eslint,
    prettier
}: InstallTemplateArgs) => {
    console.log(bold(`Using ${packageManager}.`));

    /**
     * Copy the template files to the target directory.
     */
    console.log("\nInitializing project with template:", template, "\n");
    const commonTemplatePath = path.join(
        __dirname,
        "templates",
        template,
        "common"
    );
    const templatePath = path.join(__dirname, template, mode);
    const copySource = ["**"];
    const gameFile = mode == "js" ? "game.js" : "game.ts";
    const agentFile = mode == "js" ? "agent.js" : "agent.ts";
    if (!eslint) copySource.push("!eslintrc.json");
    if (!prettier) copySource.push("!prettierrc.json");
    if (!agent) copySource.push(`!${agentFile}`);

    await Promise.all(
        [commonTemplatePath, templatePath].map(async (cwd) => {
            await copy(copySource, root, {
                parents: true,
                cwd,
                rename(name) {
                    switch (name) {
                        case "gitignore":
                        case "eslintrc.json": {
                            return `.${name}`;
                        }
                        case "prettierrc.json": {
                            return `.prettierrc`;
                        }
                        case "README-template.md": {
                            return "README.md";
                        }
                        case "index-template.html": {
                            return "index.html";
                        }
                        default: {
                            return name;
                        }
                    }
                }
            });
        })
    );

    const tsconfigFile = path.join(
        root,
        mode === "js" ? "jsconfig.json" : "tsconfig.json"
    );
    await fs.promises.writeFile(
        tsconfigFile,
        (await fs.promises.readFile(tsconfigFile, "utf8")).replace(
            `"@/*": ["./*"]`,
            `"@/*": ["./src/*"]`
        )
    );

    const indexFile = path.join(root, "index.html");
    if (!agent) {
        await fs.promises.writeFile(
            indexFile,
            (await fs.promises.readFile(indexFile, "utf8")).replace(
                `url: "./agent.js"`,
                `value: "function inputs(state) {\\n    return {\\n        left: false,\\n        right: false,\\n        up: false,\\n        down: false\\n    }\\n}"`
            )
        );
    }

    await Promise.all(
        [
            "README.md",
            "index.html",
            "header.yml",
            path.join("src", gameFile),
            path.join("src", agentFile)
        ].map(async (name) => {
            const file = path.join(root, name);
            let content = await fs.promises.readFile(file, "utf8");
            for (const [key, value] of Object.entries({
                gameName: gameName,
                templateName: template,
                templateModuleName: TEMPLATE_MODULE_NAME[template],
                "game.js": gameFile,
                "agent.js": agentFile
            })) {
                content = content.replaceAll(key, value);
            }

            await fs.promises.writeFile(file, content);
        })
    );

    /**
     * Create a package.json for the new project and write it to disk.
     */
    const packageJson = {
        name: gameName,
        version: "0.1.0",
        private: true,
        scripts: {
            dev: "vite",
            build: "tsc && vite build",
            start: "next start",
            lint: "next lint"
        }
    };
    await fs.promises.writeFile(
        path.join(root, "package.json"),
        JSON.stringify(packageJson, null, 2) + os.EOL
    );

    /**
     * These flags will be passed to `install()`, which calls the package manager
     * install process.
     */
    const installFlags = { packageManager, isOnline };

    /**
     * Default dependencies.
     */
    const dependencies = [
        "vite",
        "moroboxai-game-sdk",
        "moroboxai-player-web",
        "moroboxai-editor-web",
        template
    ];

    /**
     * TypeScript projects will have type definitions and other devDependencies.
     */
    if (mode === "ts") {
        dependencies.push("typescript");
    }

    /**
     * Default eslint dependencies.
     */
    if (eslint) {
        dependencies.push("eslint", "eslint-config-next");
    }

    /**
     * Default prettier dependencies.
     */
    if (prettier) {
        dependencies.push("prettier");
    }

    /**
     * Install package.json dependencies if they exist.
     */
    if (dependencies.length) {
        console.log();
        console.log("Installing dependencies:");
        for (const dependency of dependencies) {
            console.log(`- ${cyan(dependency)}`);
        }
        console.log();

        await install(root, dependencies, installFlags);
    }
};

export * from "./types";
