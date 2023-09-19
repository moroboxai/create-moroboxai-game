import * as MoroboxAIGameSDK from "moroboxai-game-sdk";

declare const exports: any;

class Game implements MoroboxAIGameSDK.IGame {
    player: MoroboxAIGameSDK.IPlayer;
    canvas: HTMLCanvasElement;
    width: number = 128;
    height: number = 128;
    scale: number = 0.5;

    constructor(player: MoroboxAIGameSDK.IPlayer) {
        this.player = player;

        // Attach a canvas to the player
        this.canvas = document.createElement("canvas");
        player.root.appendChild(this.canvas);

        // Internally use the native resolution
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Render an RGB gradient
        const context = this.canvas.getContext("2d");
        if (context !== null) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            let i = 0;
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    data[i] = x;
                    data[i+1] = y;
                    data[i+2] = 0;
                    data[i+3] = 255;
                    i += 4;
                }
            }
            context.putImageData(imageData, 0, 0);
        } else {
            console.error("failed to create context");
        }

        this.resize();
    }

    help(): string {
        return "";
    }

    play(): void {
    }
    
    pause(): void {
    }
    
    stop(): void {
    }
    
    resize(): void {
        // Scale to the size of player
        this.canvas.style.width = this.player.width + "px";
        this.canvas.style.height = this.player.height + "px";
    }
    
    saveState(): object {
        return {};
    }
    
    loadState(state: object): void {
    }
    
    getStateForAgent(): object {
        return {};
    }
    
    ticker?: ((delta: number) => void) | undefined;
    
    tick(inputs: MoroboxAIGameSDK.IInputs[], delta: number, render: boolean): void {
    }
}

exports.boot = (player: MoroboxAIGameSDK.IPlayer) => {
    return new Promise<MoroboxAIGameSDK.IGame>(resolve => {
        return resolve(new Game(player));
    });
};