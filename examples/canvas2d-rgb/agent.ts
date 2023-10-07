import { Inputs } from "moroboxai-game-sdk";
import type { IGameState } from "./game";

function inputs(state: IGameState): Inputs {
    return { right: true };
}
