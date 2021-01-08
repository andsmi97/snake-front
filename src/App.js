import React, { useState, useEffect } from "react";
import Canvas from "./Canvas";
import keys from "./keycodes.js";
import KeyboardEventHandler from "react-keyboard-event-handler";
import { DIRECTIONS, GAME_STATE, PLAYER_SIZE } from "./constants";
import { socket } from "./socket";

const initialState = {
  time: 60,
  gameStatus: GAME_STATE.STOP,
  winner: "none", // one of "none", "player", "player2"
  player: {
    currentPoints: 0,
    color: "#2196f3",
    direction: DIRECTIONS.RIGHT,
    speed: 10,
    positions: [
      {
        x: 0,
        y: 0,
      },
    ],
  },
  player2: {
    currentPoints: 0,
    color: "#00b248",
    direction: DIRECTIONS.LEFT,
    speed: 10,
    positions: [
      {
        x: 250 - PLAYER_SIZE,
        y: 250 - PLAYER_SIZE,
      },
    ],
  },
  food: {
    x: 0,
    y: 0,
  },
};

const App = () => {
  const [state, setState] = useState(initialState);
  const [player, setCurrentPlayer] = useState("player");

  //action emmiter
  useEffect(() => {
    socket.on("gameState", (gameState) => {
      //Add handlers here
      setState(gameState);
    });

    socket.on("action", ({ player, direction }) => {
      // game.changeDirection(player, direction);
    });

    socket.on("start", ({ message, seed }) => {
      // console.log(message);
      // setTimerStatus(true);
      // game.startGame(seed);
    });

    socket.on("pause", (message) => {
      // console.log(message);
      // setTimerStatus(false);
      // game.pauseGame();
    });

    socket.on("reset", (message) => {
      // console.log(message);
      // setTime(60);
      // setTimerStatus(false);
      // game.restartGame();
    });

    socket.on("continue", (message) => {
      // console.log(message);
      // setTimerStatus(true);
      // game.continueGame();
    });

    return () => {
      socket.removeListener("action");
      socket.removeListener("gameStatus");
      socket.removeListener("start");
      socket.removeListener("pause");
      socket.removeListener("continue");
      socket.removeListener("reset");
    };
  }, []);

  const startGame = () => {
    socket.emit("start", { message: `${player} started`, seed: Math.random() });
  };

  const pauseGame = () => {
    socket.emit("pause", `${player} paused`);
  };

  const resetGame = () => {
    socket.emit("reset", `${player} reseted`);
  };

  const continueGame = () => {
    socket.emit("continue", `${player} continued`);
  };

  const keyHandler = (key, e) => {
    switch (e.keyCode) {
      case keys.w:
      case keys.arrowUp:
        socket.emit("action", { player, direction: DIRECTIONS.UP });
        break;
      case keys.a:
      case keys.arrowLeft:
        socket.emit("action", { player, direction: DIRECTIONS.LEFT });
        break;
      case keys.d:
      case keys.arrowRight:
        socket.emit("action", { player, direction: DIRECTIONS.RIGHT });
        break;
      case keys.s:
      case keys.arrowDown:
        socket.emit("action", { player, direction: DIRECTIONS.DOWN });
        break;
      default:
        break;
    }
  };

  const renderActionButton = () => {
    if (state.gameStatus === GAME_STATE.PLAY) {
      return <button onClick={pauseGame}>Pause</button>;
    } else if (state.gameStatus === GAME_STATE.PAUSE) {
      return <button onClick={continueGame}>Continue</button>;
    }
    return <button onClick={startGame}>Start</button>;
  };

  const changePlayer = (e) => {
    if (player === "player") {
      setCurrentPlayer("player2");
    } else {
      setCurrentPlayer("player");
    }
  };

  return (
    <div className="App">
      <KeyboardEventHandler
        handleKeys={["w", "a", "s", "d"]}
        onKeyEvent={keyHandler}
        handleEventType="keydown"
      />
      <div className="game-container">
        <div>
          <p>{`${state.player.currentPoints} ${
            player === "player" ? "blue" : "green"
          } ${state.player2.currentPoints}`}</p>
          <p>
            Winner:{" "}
            {state.winner !== "none"
              ? state.winner === "player"
                ? "blue"
                : "green"
              : ""}
          </p>
          <p>{state.time}</p>
          {renderActionButton()}
          <button onClick={resetGame}>Reset</button>
          <button onClick={changePlayer}>changePlayer</button>
        </div>
        <div>
          <Canvas gameState={state} width="250" height="250" />
        </div>
      </div>
    </div>
  );
};

export default App;
