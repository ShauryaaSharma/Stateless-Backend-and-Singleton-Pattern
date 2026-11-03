import { startLogger } from "./logger";
import { GameManager } from "./store";

startLogger();

setInterval(() => {
    GameManager.getInstance().addGame({
        id: Math.random().toString(),
        whitePlayerName: "Roger",
        blackPlayerName: "Denzel",
        moves: [],
    });
}, 5000);