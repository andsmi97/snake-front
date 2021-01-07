import React, { useRef, useEffect, useState } from "react";
import keys from "./keycodes.js";
import { Snake } from "./snake";
import KeyboardEventHandler from "react-keyboard-event-handler";
import { DIRECTIONS } from "./constants";
import io from "socket.io-client";

const socket = io("http://95f18594e8f8.ngrok.io");

let game = new Snake();

const Canvas = (props) => {
  const [player, setCurrentPlayer] = useState("player");
  const [winner, setWinner] = useState(game.getWinner());
  const [time, setTime] = useState(60);
  const [timerStatus, setTimer] = useState(false);
  const [points, setPoints] = useState(game.getPlayersLength());
  const canvasRef = useRef(null);

  //action emmiter
  useEffect(() => {
    socket.on("action", ({ player, direction }) => {
      game.changeDirection(player, direction);
    });
    socket.on("start", (message) => {
      console.log(message);
      setTimer(true);
      game.startGame();
    });
    socket.on("pause", (message) => {
      console.log(message);
      setTimer(false);
      game.pauseGame();
    });
    socket.on("retart", (message) => {
      console.log(message);
      setTime(60);
      setTimer(false);
      game.restartGame();
    });

    return () => {
      socket.removeListener("action");
      socket.removeListener("start");
      socket.removeListener("pause");
      socket.removeListener("restart");
    };
  }, []);

  //ending game by timer
  useEffect(() => {
    if (winner !== "none") {
      setTimer(false);
    }
  }, [winner]);

  const startGame = () => {
    socket.emit("start", `${player} started`);
  };
  const pauseGame = () => {
    socket.emit("pause", `${player} paused`);
  };
  const restartGame = () => {
    socket.emit("restart", `${player} restarted`);
  };

  //countdown
  useEffect(() => {
    let timer1 = setInterval(() => {
      if (timerStatus && time > 0) {
        setTime(time - 1);
      }
      if (time === 0) {
        game.stopGame();
        setTimer(false);
      }
    }, 1000);

    return () => {
      clearInterval(timer1);
    };
  }, [timerStatus, time]);

  //sync with game
  useEffect(() => {
    let timer2 = setInterval(() => {
      setWinner(game.getWinner());
      setPoints(game.getPlayersLength());
    }, 200);

    return () => {
      clearInterval(timer2);
    };
  }, []);

  const changePlayer = (e) => {
    if (player === "player") {
      setCurrentPlayer("player2");
    } else {
      setCurrentPlayer("player");
    }
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    game.initialize(ctx);
  }, []);

  const keyHandler = (key, e) => {
    switch (e.keyCode) {
      case keys.w:
      case keys.arrowUp:
        // game.changeDirection(player, DIRECTIONS.UP);
        socket.emit("action", { player, direction: DIRECTIONS.UP });
        break;
      case keys.a:
      case keys.arrowLeft:
        // game.changeDirection(player, DIRECTIONS.LEFT);
        socket.emit("action", { player, direction: DIRECTIONS.LEFT });
        break;
      case keys.d:
      case keys.arrowRight:
        // game.changeDirection(player, DIRECTIONS.RIGHT);
        socket.emit("action", { player, direction: DIRECTIONS.RIGHT });
        break;
      case keys.s:
      case keys.arrowDown:
        // game.changeDirection(player, DIRECTIONS.DOWN);
        socket.emit("action", { player, direction: DIRECTIONS.DOWN });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <KeyboardEventHandler
        handleKeys={["w", "a", "s", "d"]}
        onKeyEvent={keyHandler}
        handleEventType="keydown"
      />
      <div className="game-container">
        <div>
          <p>{points ? `${points.p1} ${player} ${points.p2}` : player}</p>
          <p>Winner: {winner !== "none" ? winner : ""}</p>
          <p>{time}</p>
          <button onClick={startGame}>Start</button>
          <button onClick={pauseGame}>Pause</button>
          <button onClick={restartGame}>Restart</button>
          <button onClick={changePlayer}>changePlayer</button>
        </div>
        <div>
          <canvas ref={canvasRef} {...props} id="canvas" />
        </div>
      </div>
    </>
  );
};

export default Canvas;
