import React, { useRef, useEffect, useState } from "react";
import { PLAYER_SIZE } from "./constants";

const Canvas = ({ gameState, ...props }) => {
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const innerCtx = canvas.getContext("2d");
    setCtx(innerCtx);
  }, []);

  useEffect(() => {
    const renderGivenState = (state) => {
      if (ctx) {
        let players = ["player", "player2"];
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        let circle = new Path2D();
        circle.arc(state.food.x, state.food.y, PLAYER_SIZE / 2, 0, 360);
        ctx.fillStyle = "red";
        ctx.fill(circle);

        players.forEach((player) => {
          let rectangle = new Path2D();
          state[player].positions.forEach((position) => {
            ctx.fillStyle = state[player].color;
            rectangle.rect(position.x, position.y, PLAYER_SIZE, PLAYER_SIZE);
            ctx.fill(rectangle);
          });
        });
      }
    };
    renderGivenState(gameState);
  }, [gameState, ctx]);

  return (
    <>
      <canvas ref={canvasRef} {...props} id="canvas" />
    </>
  );
};

export default Canvas;
