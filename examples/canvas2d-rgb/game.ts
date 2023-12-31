/**
 * This is the most basic game you can write for MoroboxAI.
 *
 * Using pure javascript and canvas only, you have control
 * on everything.
 */
import type {
    IVM,
    IGame,
    Controller,
    IBootable,
    BootOptions,
} from "moroboxai-game-sdk";

declare const exports: IBootable;

// Native size of the game
const GAME_WIDTH: number = 256;
const GAME_HEIGHT: number = 256;

/**
 * State of the game sent to agent to determine the inputs.
 */
export interface IGameState {
    dX: number;
    dY: number;
}

class Game implements IGame {
    vm: IVM;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    imageData: ImageData;
    data: Uint8ClampedArray;
    oldTime?: DOMHighResTimeStamp;

    // Offset driven by the agent
    dX: number = 0;
    dY: number = 0;

    constructor(vm: IVM) {
        this.vm = vm;

        // Create a new canvas
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d")!;

        // Internally use the native resolution of 256x256 pixels
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
        this.imageData = this.context.getImageData(
            0,
            0,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        // Attach to the VM
        this.data = this.imageData.data;
        vm.root.appendChild(this.canvas);

        // Game loop
        this.callTicker = this.callTicker.bind(this);
        window.requestAnimationFrame(this.callTicker);

        this.resize();
    }

    help(): string {
        return "";
    }

    play(): void {}

    pause(): void {}

    stop(): void {}

    resize(): void {
        // Scale to the size of VM
        this.canvas.style.width = this.vm.width + "px";
        this.canvas.style.height = this.vm.height + "px";
    }

    saveState(): IGameState {
        return { dX: this.dX, dY: this.dY };
    }

    loadState(state: IGameState): void {
        this.dX = state.dX;
        this.dY = state.dY;
    }

    getStateForAgent(): object {
        return this.saveState();
    }

    callTicker(time: DOMHighResTimeStamp) {
        if (this.oldTime === undefined) {
            this.oldTime = time;
        }

        if (this.oldTime !== time) {
            const deltaTime = time - this.oldTime;
            this.oldTime = time;

            if (this.ticker !== undefined) {
                this.ticker(deltaTime);
            }
        }

        window.requestAnimationFrame(this.callTicker);
    }

    ticker?: ((delta: number) => void) | undefined;

    tick(controllers: Controller[], delta: number, render: boolean): void {
        const speed = 0.1;
        const inputs = controllers[0].inputs;

        // Take agent inputs into account
        if (inputs.left) {
            this.dX -= speed * delta;
        } else if (inputs.right) {
            this.dX += speed * delta;
        }

        if (inputs.up) {
            this.dY -= speed * delta;
        } else if (inputs.down) {
            this.dY += speed * delta;
        }

        // Render if requested
        if (render) {
            let i = 0;
            for (let y = 0; y < GAME_HEIGHT; ++y) {
                for (let x = 0; x < GAME_WIDTH; ++x) {
                    this.data[i] = (x + this.dX) % 256;
                    this.data[i + 1] = (y + this.dY) % 256;
                    this.data[i + 2] = 0;
                    this.data[i + 3] = 255;
                    i += 4;
                }
            }
            this.context.putImageData(this.imageData, 0, 0);
        }
    }
}

exports.boot = (options: BootOptions) => {
    return new Promise<IGame>((resolve) => {
        return resolve(new Game(options.vm));
    });
};
