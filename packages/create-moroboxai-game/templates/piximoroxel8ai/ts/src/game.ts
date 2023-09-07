import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
import { IPixiMoroxel8AI } from "piximoroxel8ai";

// Instance of the VM
var _vm: IPixiMoroxel8AI;

// Instance of pixi.js
var _PIXI: typeof PIXI;

var bunnyTexture: PIXI.Texture;
var bunny: PIXI.Sprite;

/**
 * Initializes the game.
 * @param {IPixiMoroxel8AI} vm - instance of the VM
 */
function init(vm: IPixiMoroxel8AI) {
    console.log("init called", vm);
    _vm = vm;
    _PIXI = vm.PIXI;
}

/**
 * Loads the game and its assets.
 */
function load(): Promise<void> {
    console.log("load called");
    return new Promise<void>((resolve, reject) => {
        console.log("load assets");
        // use PIXI.Loader to load assets
        const loader = new _PIXI.Loader();

        // load bunny.png
        loader.add("bunny", _vm.player.gameServer.href(`assets/bunny.png`));

        // notify when done
        loader.onComplete.add(() => {
            console.log('assets loaded');

            // get bunny.png
            bunnyTexture = loader.resources.bunny.texture;

            // Create the bunny
            bunny = new _PIXI.Sprite(bunnyTexture);
            bunny.anchor.set(0.5);
            _vm.stage.addChild(bunny);

            resolve()
        });

        // start loading
        loader.load();
    });
}

/**
 * Resets the state of the game.
 */
function reset() {
    bunny.x = _vm.SWIDTH / 2;
    bunny.y = _vm.SHEIGHT / 2;
}

/**
 * Ticks the game.
 * @param {number} delta - elapsed time
 */
function tick(inputs: Array<MoroboxAIGameSDK.IInputs>, delta: number) {
    let dX, dY = 0;

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