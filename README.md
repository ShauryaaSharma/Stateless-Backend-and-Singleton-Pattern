# Stateless Backend and Singleton Pattern

Notes and demo code on how backends hold (or avoid holding) state, and how to share that state safely in a Node.js/TypeScript app.

## What we're learning

1. Stateful vs stateless backends
2. State management in a backend app
3. The Singleton pattern

---

## Stateful vs stateless backends

A common interview question.

### Stateless servers

Most HTTP servers don't hold any `state`. They have no in-memory variables they depend on, and they rely on the database for state instead.

![Stateless backends sharing one Postgres database](./images/stateless-backend.png)

**Advantages**

- Users can connect to any server, so no stickiness is needed.
- Autoscaling up and down is easy. You can route traffic based on CPU usage alone.

### Stateful servers

Sometimes a server needs to hold state in memory. Good examples:

1. An in-memory cache ([code100x/cms `Cache.ts`](https://github.com/code100x/cms/blob/e905c71eacf9d99f68db802b24b7b3a924ae27f1/src/db/Cache.ts#L3))
2. The state of a game in a realtime game ([code100x/chess `Game.ts`](https://github.com/code100x/chess/blob/main/apps/ws/src/Game.ts#L41-L47))
3. The 10 most recent chats of a chat app, kept in memory

![A WebSocket server holding the state of two games in memory](./images/ws-server-state.png)

Case 1 needs no stickiness. Cases 2 and 3 do.

### Stickiness

Making sure a user who is interested in a specific room gets connected to the specific server that holds that room.

![Users routed to the WebSocket server that holds their room](./images/stickiness.png)

A good question at this point: **how do you store state in a JS project?**

---

## State in a JS process

### Approach 1: an exported array

If several files need the same state, you can export a variable from one file and import it everywhere. Node caches modules, so every file gets the same array.

`store.ts`

```ts
interface Game {
    whitePlayer: string;
    blackPlayer: string;
    moves: string[];
}

export const games: Game[] = [];
```

`index.ts` pushes to the array:

```ts
import { games } from "./store";
import { startLogger } from "./logger";

startLogger();

setInterval(() => {
    games.push({
        whitePlayer: "harkirat",
        blackPlayer: "jaskirat",
        moves: []
    });
}, 5000);
```

`logger.ts` reads it:

```ts
import { games } from "./store";

export function startLogger() {
    setInterval(() => {
        console.log(games);
    }, 4000);
}
```

This works, but often you want to attach functionality to the state too. That's where a class helps.

> There are other ways to store state in a TS project too. Redux is a popular one, and yes, you can use Redux on the backend as well.

### Approach 2: a `GameManager` class

A class that stores the games and exposes functions to change them:

```ts
interface Game {
    id: string;
    whitePlayer: string;
    blackPlayer: string;
    moves: string[];
}

export class GameManager {
    private games: Game[] = [];

    public addGame(game: Game) {
        this.games.push(game);
    }

    public getGames() {
        return this.games;
    }

    public addMove(gameId: string, move: string) {
        const game = this.games.find(game => game.id === gameId);
        if (game) {
            game.moves.push(move);
        }
    }

    public logState() {
        console.log(this.games);
    }
}
```

---

## Sharing the class: three approaches

| Approach | How | Problem |
|---|---|---|
| Bad | Create a new `GameManager` in every file | Every file gets its own separate `games` list, so the logger never sees what `index.ts` adds |
| Better | Export a single instance from `GameManager.ts` and import it everywhere | Works, but nothing stops a developer from writing `new GameManager()` again |
| Best | Singleton pattern | Makes it impossible to create a second instance |

---

## The Singleton pattern

The goal is to completely prevent any developer from creating a new instance of `GameManager`.

### Static attributes

In JavaScript, `static` declares methods or properties that belong to the **class itself**, not to any instance of it. That lets the class hold its one shared instance.

```ts
export class GameManager {
    private static instance: GameManager;   // the one shared instance
    private games: Game[] = [];

    private constructor() {
        // A private constructor means `new GameManager()` fails outside the class
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    // ... addGame, getGames, addMove, logState
}
```

Usage:

```ts
GameManager.getInstance().addGame(...)
```

Try writing `new GameManager()` anywhere else. TypeScript won't let you.

---

## Running the demo

```bash
npm install
npx tsc -b
node dist/index.js
```

Every few seconds a game is added and the logger prints the growing list.

## Key takeaway

State held in memory disappears when the process restarts, and every server instance gets its own copy. That is why scalable backends keep servers stateless and store state in a database. When you do need in-memory state (games, caches, chat), use a Singleton so the whole app shares one source of truth, and use stickiness so users reach the right server.
