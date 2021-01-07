import {
  BOTTOM_BORDER,
  DIRECTIONS,
  PLAYER_SIZE,
  RIGHT_BORDER,
  LEFT_BORDER,
  TOP_BORDER,
  GAME_STATE,
  BORDER_SIZE,
} from "./constants.js";
import * as tf from "@tensorflow/tfjs";
import * as seedrandom from "seedrandom";
export class Snake {
  players = ["player", "player2"];
  seed = 0;
  initialState = {
    gameStatus: GAME_STATE.PAUSE,
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
  state = JSON.parse(JSON.stringify(this.initialState));
  initialized = false;
  constructor(ctx) {
    if (ctx) {
      this.initialize(ctx);
    }
  }

  /**
   * Get current state as a tf.Tensor of shape [1, 2].
   */
  getStateTensor = () => {
    let array = Array(BORDER_SIZE / 10)
      .fill()
      .map(() => Array(BORDER_SIZE / 10).fill(0));

    this.state["player"].positions.forEach((position) => {
      array[position.x / 10][position.y / 10] = 1;
    });
    array = array.flat();

    let tensor = tf.tensor2d(
      [
        ...array,
        (this.state.food.x / 10 - LEFT_BORDER / 10) /
          (RIGHT_BORDER / 10 - LEFT_BORDER / 10),
        (this.state.food.y / 10 - TOP_BORDER / 10) /
          (BOTTOM_BORDER / 10 - TOP_BORDER / 10),
      ],
      [1, array.length + 2] //array length for snake and 2 for food position
    );
    return tensor;
  };

  isInverseDirection = (player, direction) => {
    switch (direction) {
      case DIRECTIONS.RIGHT:
        if (this.state[player].direction === DIRECTIONS.LEFT) {
          return true;
        }
        break;
      case DIRECTIONS.LEFT:
        if (this.state[player].direction === DIRECTIONS.RIGHT) {
          return true;
        }
        break;
      case DIRECTIONS.UP:
        if (this.state[player].direction === DIRECTIONS.DOWN) {
          return true;
        }
        break;
      case DIRECTIONS.DOWN:
        if (this.state[player].direction === DIRECTIONS.UP) {
          return true;
        }
        break;
      default:
        return false;
    }
    return false;
  };
  initialize = (ctx) => {
    this.ctx = ctx;
    // this.generateFoodPosition();
    this.initialized = true;
  };
  distanceBetweenHeads = () => {
    let x =
      this.state.player.positions[0].x - this.state.player2.positions[0].x;
    let y =
      this.state.player.positions[0].y - this.state.player2.positions[0].y;
    return Math.sqrt(x ** 2 + y ** 2);
  };
  headCollision = () => {
    if (
      (this.state.player.positions[0].x === this.state.player2.positions[0].x &&
        this.state.player.positions[0].y ===
          this.state.player2.positions[0].y) ||
      (this.isInverseDirection("player", this.state.player2.direction) &&
        this.distanceBetweenHeads() === PLAYER_SIZE)
    ) {
      console.log("draw");
      return true;
    }
    return false;
  };

  getOtherPlayer = (player) => {
    if (player === "player") {
      return "player2";
    }
    return "player";
  };
  /**
   * Checks if there is collision with itself
   * @returns {"player"|"player2"|"none"|"draw"} isCollision
   */
  hasCollisions = () => {
    if (this.headCollision()) {
      return this.getCurrentLooser();
    }

    //collision with self
    for (let p = 0; p < this.players.length; p++) {
      let player = this.players[p];
      let otherPlayer = this.getOtherPlayer(player);
      // if (this.state[player].positions.length < 4) return false;
      for (let i = 1; i < this.state[player].positions.length; i++) {
        if (
          this.state[player].positions[i].x ===
            this.state[player].positions[0].x &&
          this.state[player].positions[i].y ===
            this.state[player].positions[0].y
        ) {
          return player;
        }
        if (
          this.state[otherPlayer].positions[0].x ===
            this.state[player].positions[i].x &&
          this.state[otherPlayer].positions[0].y ===
            this.state[player].positions[i].y
        ) {
          return otherPlayer;
        }
      }
    }

    //collision with other

    return "none";
  };

  /**
   * Updates tail position
   * @private
   */
  updateTail = (player) => {
    this.state[player].positions = this.state[player].positions.map(
      (position, index) => {
        //skipping head in update
        if (index === 0) {
          return position;
        }
        return { ...this.state[player].positions[index - 1] };
      }
    );
  };

  moveUp = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].y - this.state[player].speed >=
      TOP_BORDER
    ) {
      this.state[player].positions[0].y -= this.state[player].speed;
    } else {
      this.state[player].positions[0].y = BOTTOM_BORDER - PLAYER_SIZE;
    }
  };

  moveDown = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].y + this.state[player].speed <=
      BOTTOM_BORDER - this.state[player].speed
    ) {
      this.state[player].positions[0].y += this.state[player].speed;
    } else {
      this.state[player].positions[0].y = TOP_BORDER;
    }
  };

  moveLeft = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].x - this.state[player].speed >=
      LEFT_BORDER
    ) {
      this.state[player].positions[0].x -= this.state[player].speed;
    } else {
      this.state[player].positions[0].x = RIGHT_BORDER - PLAYER_SIZE;
    }
  };

  moveRight = (player) => {
    this.updateTail(player);
    if (
      this.state[player].positions[0].x + this.state[player].speed <=
      RIGHT_BORDER - this.state[player].speed
    ) {
      this.state[player].positions[0].x += this.state[player].speed;
    } else {
      this.state[player].positions[0].x = LEFT_BORDER;
    }
  };

  autoMove = () => {
    this.players.forEach((player) => {
      switch (this.state[player].direction) {
        case DIRECTIONS.RIGHT:
          this.moveRight(player);
          break;
        case DIRECTIONS.LEFT:
          this.moveLeft(player);
          break;
        case DIRECTIONS.UP:
          this.moveUp(player);
          break;
        case DIRECTIONS.DOWN:
          this.moveDown(player);
          break;
        default:
          break;
      }
    });
  };

  gameTimer;

  pauseGame = () => {
    clearInterval(this.gameTimer);
    this.state.gameStatus = GAME_STATE.PAUSE;
  };

  startGame = (seed) => {
    this.state.gameStatus = GAME_STATE.PLAY;
    clearInterval(this.gameTimer);
    this.gameTimer = setInterval(this.update, 200);
    this.seed = seed;
    seedrandom(seed);
    this.generateFoodPosition();
  };

  continueGame = () => {
    this.state.gameStatus = GAME_STATE.PLAY;
    clearInterval(this.gameTimer);
    this.gameTimer = setInterval(this.update, 200);
  };

  getCurrentLooser = () => {
    if (
      this.state.player.positions.length > this.state.player2.positions.length
    ) {
      return "player2";
    } else if (
      this.state.player.positions.length < this.state.player2.positions.length
    ) {
      return "player";
    } else {
      return "draw";
    }
  };

  stopGame = () => {
    this.state.gameStatus = GAME_STATE.STOP;
    clearInterval(this.gameTimer);
    const result = this.getCurrentLooser();
    this.state.winner =
      result === "draw" ? result : this.getOtherPlayer(result);
  };

  getPlayersLength = () => {
    return {
      p1: this.state.player.positions.length - 1,
      p2: this.state.player2.positions.length - 1,
    };
  };

  restartGame = () => {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    clearInterval(this.gameTimer);
    this.state = { ...JSON.parse(JSON.stringify(this.initialState)) };
    // this.generateFoodPosition();
  };

  /**
   * Simple funciton to update game state
   */
  update = () => {
    if (this.state.gameStatus === GAME_STATE.PLAY) {
      let result = this.hasCollisions();
      if (result !== "none") {
        this.state.gameStatus = GAME_STATE.STOP;
        if (result === "draw") {
          this.state.winner = "draw";
        } else {
          this.state.winner = this.getOtherPlayer(result);
        }
      }
      this.autoMove();
      this.draw();
    }
  };

  /**
   * @returns {GameStatus} gamestatus
   */
  getStatus = () => this.state.gameStatus;

  /**
   * @returns {number} current points
   */
  getPoints = () => this.state.currentPoints;

  getRandomCirclePosition(max) {
    let rand = 0;
    do {
      rand = Math.floor(Math.floor(Math.random() * Math.floor(max)));
    } while (rand % 10 !== 5);
    return rand;
  }

  eatFood = () => {
    this.players.forEach((player) => {
      if (
        this.state[player].positions[0].x ===
          this.state.food.x - PLAYER_SIZE / 2 &&
        this.state[player].positions[0].y ===
          this.state.food.y - PLAYER_SIZE / 2
      ) {
        this.generateFoodPosition();
        this.state[player].positions = [
          ...this.state[player].positions,
          { x: RIGHT_BORDER, y: BOTTOM_BORDER },
        ];
        this.state.currentPoints++;
      }
    });
  };

  foodInSnake = () => {
    for (let p = 0; p < this.players.length; p++) {
      let player = this.players[p];
      for (let i = 0; i < this.state[player].positions.length; i++) {
        if (
          this.state[player].positions[i].x === this.state.food.x &&
          this.state[player].positions[i].y === this.state.food.y
        ) {
          return true;
        }
      }
    }

    return false;
  };

  getWinner = () => {
    return this.state.winner;
  };

  generateFoodPosition = () => {
    do {
      this.state.food.x = this.getRandomCirclePosition(RIGHT_BORDER);
      this.state.food.y = this.getRandomCirclePosition(BOTTOM_BORDER);
    } while (this.foodInSnake());
  };

  drawFood = () => {
    let circle = new Path2D();
    circle.arc(this.state.food.x, this.state.food.y, PLAYER_SIZE / 2, 0, 360);
    this.ctx.fillStyle = "red";
    this.ctx.fill(circle);
  };

  drawPlayer = () => {
    this.players.forEach((player) => {
      let rectangle = new Path2D();
      this.state[player].positions.forEach((position) => {
        this.ctx.fillStyle = this.state[player].color;
        rectangle.rect(position.x, position.y, PLAYER_SIZE, PLAYER_SIZE);
        this.ctx.fill(rectangle);
      });
    });
  };

  draw = () => {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawPlayer();
    this.eatFood();
    this.drawFood();
  };

  changeDirection = (player, direction) => {
    switch (direction) {
      case DIRECTIONS.UP:
        if (this.state[player].direction !== DIRECTIONS.DOWN) {
          this.state[player].direction = direction;
        }
        break;
      case DIRECTIONS.DOWN:
        if (this.state[player].direction !== DIRECTIONS.UP) {
          this.state[player].direction = direction;
        }
        break;
      case DIRECTIONS.LEFT:
        if (this.state[player].direction !== DIRECTIONS.RIGHT) {
          this.state[player].direction = direction;
        }
        break;
      case DIRECTIONS.RIGHT:
        if (this.state[player].direction !== DIRECTIONS.LEFT) {
          this.state[player].direction = direction;
        }
        break;
      default:
        this.state[player].direction = direction;
    }
  };
}
