// CANVAS AND CTX CREATION
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

document.getElementsByTagName("body")[0].appendChild(canvas);
document.addEventListener("keydown", key_down_handler);
window.addEventListener("resize", resizeCanvas);

// simple keypress handler, turns keycode into character
// thats stored in chr variable
function key_down_handler(event) {
  key_pressed = true;
  if (event.keyCode === 8) chr = "backspace";
  else if (event.keyCode === 13) chr = "enter";
  else {
    chr = String.fromCharCode(event.keyCode).toLowerCase();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/// /// game part /// ///

/*
TODO
- put enemy class into separate script
- more words (allow users to upload own .txt files)
- fix settings menu with difficulty
- highscores
- prevent enemies from spawning on top of eachother 
- easter eggs (?)
*/

// GLOBAL VARIABLES
let chr; // character pressed
let key_pressed = false; // key_pressed bool
let current_word = ""; // current input string
let word_index = 0; // index of the letter in a word
let word_x; // input x-position
let word_y; // input y-position
const word_list = [
  "angry",
  "skateboard",
  "wifi",
  "computer",
  "dogs",
  "lemons",
  "keyboard",
];
let enemies = [];
let focusedEnemy = 0; // which enemy is in focus
let word_speed = 0; // speed word is moving by
let delta_time = 0.0;
let placeholder_time = 0.0;
let word_counter = 0; // number of enemies destroyed
let spawnrate = 0; // number of words at the screen at the same time
let score = 0;
let difficulty = 0; // Currently does nothing. scaleable with time or no. of words killed?
let start_time = 0; // start-time in seconds
let started = false;
let gameState = "start";

class Enemy {
  constructor(text, x_pos, y_pos, dead, placeholder_x, chrs_correct) {
    this.text = text;
    this.x_pos = x_pos;
    this.y_pos = y_pos;
    this.dead = dead;
    this.placeholder_x = placeholder_x;
    this.chrs_correct = chrs_correct;

    this.adjustYPosition();
  }

  adjustYPosition() {
    let overlap = true;
    let maxAttempts = 10;
    while (overlap && maxAttempts > 0) {
      overlap = false;
      for (const enemy of enemies) {
        if (enemy !== this && Math.abs(enemy.y_pos - this.y_pos) < 40) {
          overlap = true;
          this.y_pos += 20;
          if (this.y_pos > canvas.height) {
            this.y_pos = 20;
          }
          break;
        }
      }
      maxAttempts--;
    }
  }

  draw() {
    if (this.dead == false) {
      this.placeholder_x = this.x_pos; // set placeholder
      for (var i = 0; i < this.text.length; i++) {
        var ch = this.text.charAt(i);
        ctx.fillStyle =
          i < this.chrs_correct && this == enemies[focusedEnemy]
            ? "green"
            : "white";
        ctx.font = "32px Arial";
        ctx.fillText(ch, this.x_pos, this.y_pos);
        this.x_pos += ctx.measureText(ch).width;
      }
      this.x_pos = this.placeholder_x; // reset x location
    } else {
      this.text = word_list[Math.floor(Math.random() * word_list.length)];
      this.x_pos = 0;
      this.y_pos = Math.floor(Math.random() * canvas.height);
      this.adjustYPosition();
      this.dead = false;
    }
  }

  // this function updates the chrs_correct variable to the correct number of correct characters
  get_chrs_correct() {
    this.chrs_correct = 0;
    for (var i = 0; i < this.text.length; i++) {
      if (this.text.charAt(i) == current_word.charAt(i)) {
        this.chrs_correct++;
      } else {
        break;
      }
    }
  }
}

// start menu
function start() {
  enemies = [];
  const start_enemy = new Enemy(
    "start",
    (canvas.width / 100) * 50,
    (canvas.height / 100) * 50,
    false
  );
  const options_enemy = new Enemy(
    "options",
    (canvas.width / 100) * 50,
    (canvas.height / 100) * 60,
    false
  );

  enemies.push(start_enemy, options_enemy);
  for (const enemy of enemies) enemy.draw();
}

// Options menu
function options_menu() {
  enemies = [];
  const option_enemy_regular = new Enemy(
    "regular",
    (canvas.width / 100) * 50,
    (canvas.height / 100) * 40,
    false
  );
  const option_enemy_extreme = new Enemy(
    "extreme",
    (canvas.width / 100) * 50,
    (canvas.height / 100) * 50,
    false
  );
  const option_enemy_help = new Enemy(
    "help",
    (canvas.width / 100) * 50,
    (canvas.height / 100) * 60,
    false
  );

  enemies.push(option_enemy_regular, option_enemy_extreme, option_enemy_help);
  for (const enemy of enemies) enemy.draw();

  if (current_word === "help") {
    ctx.fillStyle = "black";
    ctx.fillRect(
      option_enemy_help.x_pos,
      option_enemy_help.y_pos - 28,
      ctx.measureText(option_enemy_help.text).width,
      40
    );
    option_enemy_help.text = "write 'surrender' to give up";
  }
}

// Loops through current word and colors characters accordingly
function draw_input() {
  for (var i = 0; i < current_word.length; i++) {
    var ch = current_word.charAt(i);
    //blir fortfarande fel här när det inte finns några fiender att döda...
    if (i < enemies[focusedEnemy].chrs_correct) {
      ctx.fillStyle = "white";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.font = "50px Arial";
    ctx.fillText(ch, word_x, word_y);
    word_x += ctx.measureText(ch).width;
  }
}

// finds focus based on first character of word and how far it is from the end of the screen
function find_focus() {
  var highest = -10000; // Magic number, what does it mean?
  for (const enemy of enemies) {
    if (current_word.charAt(0) === enemy.text.charAt(0)) {
      if (enemy.x_pos > highest) {
        highest = enemy.x_pos;
        focusedEnemy = enemies.indexOf(enemy);
      }
    }
  }
}

// *unsure if this works. doesnt feel like it anyway*
// increases numbers of words on screen every 5 seconds
function dynamic_difficulty() {
  if (placeholder_time === 0.0) {
    placeholder_time = delta_time;
  }
  if (delta_time - placeholder_time > 5) {
    spawnrate++;
    placeholder_time = 0.0;
  }
  if (enemies.length < spawnrate) {
    enemies[enemies.length] = new Enemy("", -50, 200, true, "");
  }
}

// currently shows infinite, fix
function get_wpm() {
  /* calculates wpm */
  if (delta_time > 0) {
    var minutes = delta_time / 60;
    var wpm = Math.floor(word_counter / minutes);
    ctx.fillStyle = "orange";
    ctx.font = "22px Arial";
    ctx.fillText(wpm.toString(), 900, 50);
  }
}

/* displays game-over screen */
function game_over() {
  enemy_restart = new Enemy("r", -50, 0, false);
  enemies.push(enemy_restart);
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("You survived for " + score.toString() + " seconds.", 100, 100);
  ctx.fillText("You killed " + word_counter.toString() + " words.", 100, 200);
  ctx.fillText("Type 'r' to Restart", 100, 300);
}

// sets all game variables to 0 and takes the player back to start
function resetGame() {
  current_word = "";
  start_time = 0;
  delta_time = 0;
  spawnrate = 0;
  word_counter = 0;
  word_speed = 0;
  focusedEnemy = 0;
  score = 0;
  difficulty = 0;
  started = false;

  gameState = "start";
}

function startClock() {
  start_time = new Date().getTime() / 1000;
  started = true;
}

function updateGameLogic() {
  if (!started) startClock();
  word_speed = 0.75; // words start moving (after start)
  delta_time = new Date().getTime() / 1000 - start_time;
  get_wpm(); // displays wpm
  dynamic_difficulty(); // adjust difficulty dynamically
}

function endTheGame() {
  current_word = "";
  enemies = [];
  focusedEnemy = 0;
  word_speed = 0; // stop movement
  score = Math.floor(delta_time);
  gameState = "game_over";
}

// the game-loop
function draw() {
  // clear canvas
  resizeCanvas();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Handle different game states
  switch (gameState) {
    case "start":
      start();
      break;
    case "menu":
      options_menu();
      break;
    case "running":
      updateGameLogic();
      break;
    case "game_over":
      game_over();
      break;
  }

  console.log(`Gamestate: ${gameState}`);

  // places user-inputs in bottom right corner
  word_x = (canvas.width / 100) * 70;
  word_y = (canvas.height / 100) * 75;

  if (key_pressed) {
    if (chr === "enter") {
      if (
        current_word === "surrender" &&
        (gameState === "running" || gameState === "menu")
      ) {
        endTheGame();
      } else if (current_word === enemies[focusedEnemy].text) {
        if (gameState === "menu") {
          if (current_word === "regular") {
            difficulty = 1;
          } else if (current_word === "extreme") {
            difficulty = 1.5;
          }
          gameState = "running";
        } else if (current_word === "r" && gameState === "game_over") {
          resetGame();
        } else if (current_word === "start") {
          gameState = "running";
        } else if (current_word === "options" && gameState !== "running") {
          gameState = "menu"; // turn on settings menu
        }
      }
      if (gameState !== "game_over") {
        enemies[focusedEnemy].dead = true; // random_word is destroyed
        word_counter++; // increase eniemies destroyed
        current_word = ""; // word is reset
      }
    } else if (chr === "backspace") {
      current_word = current_word.slice(0, -1); // removes last character
      if (word_index != 0) {
        word_index--;
      } // decrease word index
    } else {
      word_index++;
      current_word += chr; // adds character to word
    }

    key_pressed = false; // not accepting keypress
  }

  if (focusedEnemy >= 0 && focusedEnemy < enemies.length) {
    enemies[focusedEnemy].get_chrs_correct(); // updates chrs_correct
  } else {
    console.warn("Invalid focus index:", focusedEnemy);
  }

  // check if enemy is off screen
  for (const enemy of enemies) {
    if (enemy.x_pos > canvas.width) {
      endTheGame();
    }
  }

  if (gameState !== "game_over") {
    for (var i = 0; i < enemies.length; i++) {
      enemies[i].draw(); // draws enemy
      enemies[i].x_pos += word_speed; // moves enemy
    }
  }

  draw_input(); // display the current guess
  find_focus(); // finds which enemy to focus

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
