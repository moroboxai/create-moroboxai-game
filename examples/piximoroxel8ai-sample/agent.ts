import type { Inputs } from "moroboxai-game-sdk";
import type { IGameState } from "./game";

function inputs(state: IGameState): Inputs {
    return [
        { left: true },
        { right: true },
        { up: true },
        { down: true },
    ][Math.floor(Math.random() * 4)]
}