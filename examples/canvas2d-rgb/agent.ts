import { IInputs } from "moroboxai-game-sdk";
import type { IGameState } from "./game";

function inputs(state: IGameState): IInputs {
  return { right: true };
}
