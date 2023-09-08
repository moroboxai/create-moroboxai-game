import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
import { IPixiMoroxel8AI } from "piximoroxel8ai";

// Instance of the VM
declare const vm: IPixiMoroxel8AI;

// Instance of pixi.js stage
declare const stage: PIXI.Container;

var bunnyTexture: PIXI.Texture;
var bunny: PIXI.Sprite;

/**
 * Loads the game and its assets.
 */
function load(): Promise<void> {
    console.log("load called");
    return new Promise<void>((resolve, reject) => {
        console.log("load assets");
        // use PIXI.Loader to load assets
        const loader = new PIXI.Loader();

        // load bunny.png
        loader.add("bunny", vm.player.gameServer.href(`assets/bunny.png`));

        // notify when done
        loader.onComplete.add(() => {
            console.log('assets loaded');

            // get bunny.png
            bunnyTexture = loader.resources.bunny.texture;

            // Create the bunny
            bunny = new PIXI.Sprite(bunnyTexture);
            bunny.anchor.set(0.5);
            stage.addChild(bunny);

            resolve()
        });

        // start loading assets
        loader.load();
    });
}

/**
 * Resets the state of the game.
 */
function reset() {
    bunny.x = vm.SWIDTH / 2;
    bunny.y = vm.SHEIGHT / 2;
}

/**
 * Ticks the game.
 * @param {number} delta - elapsed time
 */
function tick(inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number) {
    let dX = 0, dY = 0;

    if (inputs[0].left) {
        dX = -1;
    }
    else if (inputs[0].right) {
        dX = 1;
    }

    if (inputs[0].up) {
        dY = -1;
    }
    else if (inputs[0].down) {
        dY = 1;
    }

    bunny.x += dX * delta;
    bunny.y += dY * delta;
}

export interface IGameState {
    x: number;
    y: number;
}

function getStateForAgent(): IGameState {
    // Send the position to agent
    return {
        x: bunny.x,
        y: bunny.y
    };
}