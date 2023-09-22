/**
 * This is the most basic game you can write for MoroboxAI.
 *
 * Using pure javascript and canvas only, you have control
 * on everything.
 */
import * as MoroboxAIGameSDK from "moroboxai-game-sdk";

declare const exports: any;

/**
 * State of the game sent to agent to determine the inputs.
 */
interface IGameState {
  dX: number;
  dY: number;
}

class Game implements MoroboxAIGameSDK.IGame {
  player: MoroboxAIGameSDK.IPlayer;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
  data: Uint8ClampedArray;
  width: number = 128;
  height: number = 128;
  scale: number = 0.5;

  // Offset driven by the agent
  dX: number = 0;
  dY: number = 0;

  constructor(player: MoroboxAIGameSDK.IPlayer) {
    this.player = player;

    // Attach a canvas to the player
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d")!;
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);
    this.data = this.imageData.data;
    player.root.appendChild(this.canvas);

    // Internally use the native resolution
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.resize();
  }

  help(): string {
    return "";
  }

  play(): void {}

  pause(): void {}

  stop(): void {}

  resize(): void {
    // Scale to the size of player
    this.canvas.style.width = this.player.width + "px";
    this.canvas.style.height = this.player.height + "px";
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

  ticker?: ((delta: number) => void) | undefined;

  tick(
    inputs: MoroboxAIGameSDK.IInputs[],
    delta: number,
    render: boolean
  ): void {
    // Take agent inputs into account
    if (inputs[0].left) {
      this.dX -= delta;
    } else if (inputs[0].right) {
      this.dX += delta;
    }

    if (inputs[0].up) {
      this.dY -= delta;
    } else if (inputs[0].down) {
      this.dY += delta;
    }

    // Render if requested
    if (render) {
      let i = 0;
      for (let y = 0; y < this.height; ++y) {
        for (let x = 0; x < this.width; ++x) {
          this.data[i] = ((x + this.dX) * 2) % 256;
          this.data[i + 1] = ((y + this.dY) * 2) % 256;
          this.data[i + 2] = 0;
          this.data[i + 3] = 255;
          i += 4;
        }
      }
      this.context.putImageData(this.imageData, 0, 0);
    }
  }
}

exports.boot = (player: MoroboxAIGameSDK.IPlayer) => {
  return new Promise<MoroboxAIGameSDK.IGame>((resolve) => {
    return resolve(new Game(player));
  });
};
