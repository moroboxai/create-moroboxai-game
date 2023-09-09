#!/usr/bin/env node
/* taken from https://github.com/vercel/next.js/blob/canary/packages/create-next-app/index.ts */
/* eslint-disable import/no-extraneous-dependencies */
import { cyan, green, red, yellow, bold, blue } from "picocolors";
import Commander from "commander";
import Conf from "conf";
import path from "path";
import prompts from "prompts";
import checkForUpdate from "update-check";
import { createGame, DownloadError } from "./create-game";
import { getPkgManager } from "./helpers/get-pkg-manager";
import { validateNpmName } from "./helpers/validate-pkg";
import packageJson from "./package.json";
import ciInfo from "ci-info";
import { isFolderEmpty } from "./helpers/is-folder-empty";
import fs from "fs";

let projectPath: string = "";

const handleSigTerm = () => process.exit(0);

process.on("SIGINT", handleSigTerm);
process.on("SIGTERM", handleSigTerm);

const onPromptState = (state: any) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    process.stdout.write("\x1B[?25h");
    process.stdout.write("\n");
    process.exit(1);
  }
};

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments("<project-directory>")
  .usage(`${green("<project-directory>")} [options]`)
  .action((name) => {
    projectPath = name;
  })
  .option(
    "--piximoroxel8ai",
    `

  Initialize as a PixiMoroxel8AI game.
`
  )
  .option(
    "--ts, --typescript",
    `

  Initialize as a TypeScript project. (default)
`
  )
  .option(
    "--js, --javascript",
    `

  Initialize as a JavaScript project.
`
  )
  .option(
    "--eslint",
    `

  Initialize with eslint config.
`
  )
  .option(
    "--prettier",
    `

  Initialize with prettier config.
`
  )
  .option(
    "--agent",
    `

  Initialize with a default agent.
`
  )
  .option(
    "--src-dir",
    `

  Initialize inside a \`src/\` directory.
`
  )
  .option(
    "--use-npm",
    `

  Explicitly tell the CLI to bootstrap the application using npm
`
  )
  .option(
    "--use-pnpm",
    `

  Explicitly tell the CLI to bootstrap the application using pnpm
`
  )
  .option(
    "--use-yarn",
    `

  Explicitly tell the CLI to bootstrap the application using Yarn
`
  )
  .option(
    "--use-bun",
    `

  Explicitly tell the CLI to bootstrap the application using Bun
`
  )
  .option(
    "-e, --example [name]|[github-url]",
    `
  
    An example to bootstrap the game with. You can use an example name
    from the official create-moroboxai-game repo or a GitHub URL. The URL
    can use any branch and/or subdirectory
  `
  )
  .option(
    "--reset-preferences",
    `

  Explicitly tell the CLI to reset any stored preferences
`
  )
  .allowUnknownOption()
  .parse(process.argv);

const packageManager = !!program.useNpm
  ? "npm"
  : !!program.usePnpm
  ? "pnpm"
  : !!program.useYarn
  ? "yarn"
  : !!program.useBun
  ? "bun"
  : getPkgManager();

async function run(): Promise<void> {
  const conf = new Conf({ projectName: "create-moroboxai-game" });

  if (program.resetPreferences) {
    conf.clear();
    console.log(`Preferences reset successfully`);
    return;
  }

  if (typeof projectPath === "string") {
    projectPath = projectPath.trim();
  }

  if (!projectPath) {
    const res = await prompts({
      onState: onPromptState,
      type: "text",
      name: "path",
      message: "What is your project named?",
      initial: "my-game",
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)));
        if (validation.valid) {
          return true;
        }
        return "Invalid project name: " + validation.problems![0];
      },
    });

    if (typeof res.path === "string") {
      projectPath = res.path.trim();
    }
  }

  if (!projectPath) {
    console.log(
      "\nPlease specify the project directory:\n" +
        `  ${cyan(program.name())} ${green("<project-directory>")}\n` +
        "For example:\n" +
        `  ${cyan(program.name())} ${green("my-moroboxai-game")}\n\n` +
        `Run ${cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const { valid, problems } = validateNpmName(projectName);
  if (!valid) {
    console.error(
      `Could not create a project called ${red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    );

    problems!.forEach((p) => console.error(`    ${red(bold("*"))} ${p}`));
    process.exit(1);
  }

  if (program.example === true) {
    console.error(
      "Please provide an example name or url, otherwise remove the example option."
    );
    process.exit(1);
  }

  /**
   * Verify the project dir is empty or doesn't exist
   */
  const root = path.resolve(resolvedProjectPath);
  const gameName = path.basename(root);
  const folderExists = fs.existsSync(root);

  if (folderExists && !isFolderEmpty(root, gameName)) {
    process.exit(1);
  }

  const example = typeof program.example === "string" && program.example.trim();
  const preferences = (conf.get("preferences") || {}) as Record<
    string,
    boolean | string
  >;
  /**
   * If the user does not provide the necessary flags, prompt them for whether
   * to use TS or JS.
   */
  if (!example) {
    const defaults: typeof preferences = {
      piximoroxel8ai: true,
      typescript: true,
      eslint: true,
      agent: false,
      srcDir: false,
    };
    const getPrefOrDefault = (field: string) =>
      preferences[field] ?? defaults[field];

    if (!program.piximoroxel8ai) {
      if (ciInfo.isCI) {
        // default to PixiMoroxel8AI in CI as we can't prompt to
        // prevent breaking setup flows
        program.piximoroxel8ai = getPrefOrDefault("piximoroxel8ai");
      } else {
        const styledPixiMoroxel8AI = blue("PixiMoroxel8AI");
        const { piximoroxel8ai } = await prompts(
          {
            type: "toggle",
            name: "piximoroxel8ai",
            message: `Would you like to use ${styledPixiMoroxel8AI}?`,
            initial: getPrefOrDefault("piximoroxel8ai"),
            active: "Yes",
            inactive: "No",
          },
          {
            /**
             * User inputs Ctrl+C or Ctrl+D to exit the prompt. We should close the
             * process and not write to the file system.
             */
            onCancel: () => {
              console.error("Exiting.");
              process.exit(1);
            },
          }
        );
        /**
         * Depending on the prompt response, set the appropriate program flags.
         */
        program.piximoroxel8ai = Boolean(piximoroxel8ai);
        preferences.piximoroxel8ai = Boolean(piximoroxel8ai);
      }
    }

    if (!program.typescript && !program.javascript) {
      if (ciInfo.isCI) {
        // default to TypeScript in CI as we can't prompt to
        // prevent breaking setup flows
        program.typescript = getPrefOrDefault("typescript");
      } else {
        const styledTypeScript = blue("TypeScript");
        const { typescript } = await prompts(
          {
            type: "toggle",
            name: "typescript",
            message: `Would you like to use ${styledTypeScript}?`,
            initial: getPrefOrDefault("typescript"),
            active: "Yes",
            inactive: "No",
          },
          {
            /**
             * User inputs Ctrl+C or Ctrl+D to exit the prompt. We should close the
             * process and not write to the file system.
             */
            onCancel: () => {
              console.error("Exiting.");
              process.exit(1);
            },
          }
        );
        /**
         * Depending on the prompt response, set the appropriate program flags.
         */
        program.typescript = Boolean(typescript);
        program.javascript = !Boolean(typescript);
        preferences.typescript = Boolean(typescript);
      }
    }

    if (
      !process.argv.includes("--eslint") &&
      !process.argv.includes("--no-eslint")
    ) {
      if (ciInfo.isCI) {
        program.eslint = getPrefOrDefault("eslint");
      } else {
        const styledEslint = blue("ESLint");
        const { eslint } = await prompts({
          onState: onPromptState,
          type: "toggle",
          name: "eslint",
          message: `Would you like to use ${styledEslint}?`,
          initial: getPrefOrDefault("eslint"),
          active: "Yes",
          inactive: "No",
        });
        program.eslint = Boolean(eslint);
        preferences.eslint = Boolean(eslint);
      }
    }

    if (
      !process.argv.includes("--src-dir") &&
      !process.argv.includes("--no-src-dir")
    ) {
      if (ciInfo.isCI) {
        program.srcDir = getPrefOrDefault("srcDir");
      } else {
        const styledSrcDir = blue("`src/` directory");
        const { srcDir } = await prompts({
          onState: onPromptState,
          type: "toggle",
          name: "srcDir",
          message: `Would you like to use ${styledSrcDir}?`,
          initial: getPrefOrDefault("srcDir"),
          active: "Yes",
          inactive: "No",
        });
        program.srcDir = Boolean(srcDir);
        preferences.srcDir = Boolean(srcDir);
      }
    }

    if (
      !process.argv.includes("--agent") &&
      !process.argv.includes("--no-agent")
    ) {
      if (ciInfo.isCI) {
        program.agent = false;
      } else {
        const styledAppDir = blue("agent");
        const { agent } = await prompts({
          onState: onPromptState,
          type: "toggle",
          name: "agent",
          message: `Would you like to include a default ${styledAppDir}?`,
          initial: true,
          active: "Yes",
          inactive: "No",
        });
        program.agent = Boolean(agent);
      }
    }
  }

  try {
    await createGame({
      appPath: resolvedProjectPath,
      packageManager,
      example: example && example !== "default" ? example : undefined,
      examplePath: program.examplePath,
      piximoroxel8ai: program.piximoroxel8ai,
      typescript: program.typescript,
      eslint: program.eslint,
      agent: program.agent,
      srcDir: program.srcDir,
    });
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason;
    }

    const res = await prompts({
      onState: onPromptState,
      type: "confirm",
      name: "builtin",
      message:
        `Could not download "${example}" because of a connectivity issue between your machine and GitHub.\n` +
        `Do you want to use the default template instead?`,
      initial: true,
    });
    if (!res.builtin) {
      throw reason;
    }

    await createGame({
      appPath: resolvedProjectPath,
      packageManager,
      piximoroxel8ai: program.piximoroxel8ai,
      typescript: program.typescript,
      eslint: program.eslint,
      agent: program.agent,
      srcDir: program.srcDir,
    });
  }
  conf.set("preferences", preferences);
}

const update = checkForUpdate(packageJson).catch(() => null);

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update;
    if (res?.latest) {
      const updateMessage =
        packageManager === "yarn"
          ? "yarn global add create-moroboxai-game"
          : packageManager === "pnpm"
          ? "pnpm add -g create-moroboxai-game"
          : packageManager === "bun"
          ? "bun add -g create-moroboxai-game"
          : "npm i -g create-moroboxai-game";

      console.log(
        yellow(bold("A new version of `create-moroboxai-game` is available!")) +
          "\n" +
          "You can update by running: " +
          cyan(updateMessage) +
          "\n"
      );
    }
    process.exit();
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log();
    console.log("Aborting installation.");
    if (reason.command) {
      console.log(`  ${cyan(reason.command)} has failed.`);
    } else {
      console.log(
        red("Unexpected error. Please report it as a bug:") + "\n",
        reason
      );
    }
    console.log();

    await notifyUpdate();

    process.exit(1);
  });
