import * as MoroboxAIGameSDK from "moroboxai-game-sdk";
import { IGameState } from "./game";

function inputs(state: IGameState): MoroboxAIGameSDK.IInputs {
    return [
        { left: true },
        { right: true },
        { up: true },
        { down: true }
    ][Math.floor(Math.random() * 4)]
}