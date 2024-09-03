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

// Resizes canvas equal to window size (responsive yay)
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/// /// game part /// ///

/*
TODO
- put enemy class into separate script
- allow users to upload own .txt files?
-- https://www.geeksforgeeks.org/how-to-read-a-local-text-file-using-javascript/
- highscores 
- easter eggs (?)
*/

// GLOBAL VARIABLES
let chr; // character pressed
let key_pressed = false; // key_pressed bool
let current_word = ""; // current input string
let word_index = 0; // index of the letter in a word
let word_x; // input x-position
let word_y; // input y-position
let word_list = []; // The words the enemies will have, filled by fetching from https://random-word-api.herokuapp.com/home
let enemies = [];
let focusedEnemy = 0; // which enemy is in focus
let word_speed = 0; // speed word is moving by
let delta_time = 0.0;
let word_counter = 0; // number of enemies destroyed
let spawnrate = 0; // number of words at the screen at the same time
let score = 0;
let difficulty = 0; // Currently does nothing. scaleable with time or no. of words killed?
let start_time = 0; // start-time in seconds
let wordsFetched = false;
let fetchingInProgress = false;
let started = false;
let makeHarder = false;
let gameState = "loading";

// gets 150 words with 9 or less characters
async function fetchRandomWords(wordCount, maxLength) {
  try {
    const batchSize = wordCount * 10;

    const response = await fetch(
      `https://random-word-api.herokuapp.com/word?number=${batchSize}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    let words = await response.json();
    words = words.filter((word) => word.length <= maxLength);
    return words.slice(0, wordCount);
  } catch (error) {
    console.error("Failed to fetch words: ", error);
    return [];
  }
}

// loads the fetched words into the array before proceeding
async function loadWords() {
  if (!wordsFetched && !fetchingInProgress) {
    fetchingInProgress = true;
    word_list = await fetchRandomWords(150, 9);
    console.log("Word list populated: ", word_list);
    wordsFetched = true;
    initializeEnemies();
    gameState = "start";
  }
}

// Async functions always return a promise, so filling the enemies array needs to be a separate function
function initializeEnemies() {
  enemies = [];
  for (let i = 0; i < spawnrate; i++) {
    const word = word_list[Math.floor(Math.random() * word_list.length)];
    enemies.push(new Enemy(word, -50, Math.random() * canvas.height, false));
  }
  focusedEnemy = 0;
}

class Enemy {
  constructor(text, x_pos, y_pos, dead, placeholder_x, chrs_correct = 0) {
    this.text = text;
    this.x_pos = x_pos;
    this.y_pos = y_pos;
    this.dead = dead;
    this.placeholder_x = placeholder_x;
    this.chrs_correct = chrs_correct;

    this.adjustYPosition();
  }

  // Doesnt completely work, its still possible for words to spawn on top of each other after adjusting once
  adjustYPosition() {
    const minY = 80;
    const maxY = canvas.height - minY;

    if (this.y_pos < minY) this.y_pos = minY;
    else if (this.y_pos > maxY) this.y_pos = maxY;

    let overlap = true;
    let maxAttempts = 50;
    while (overlap && maxAttempts > 0) {
      overlap = false;
      for (const enemy of enemies) {
        if (enemy !== this && Math.abs(enemy.y_pos - this.y_pos) < 40) {
          overlap = true;
          this.y_pos += 30;
          if (this.y_pos > maxY) {
            this.y_pos = minY;
          }
          break;
        }
      }
      maxAttempts--;
    }
  }

  draw() {
    if (this.dead) {
      this.respawn();
    } else {
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
    }
  }

  // updates the chrs_correct variable to the correct number of correct characters
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

  respawn() {
    this.text = word_list[Math.floor(Math.random() * word_list.length)];
    this.x_pos = -50;
    this.y_pos = Math.random() * canvas.height;
    this.dead = false;
    this.adjustYPosition();
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

// increases numbers of words on screen for every 8 words killed
function dynamic_difficulty() {
  if (word_counter % 8 !== 0) makeHarder = true;
  if (word_counter % 8 === 0 && makeHarder) {
    word_speed += difficulty / 20;
    spawnrate += difficulty;
    makeHarder = false;
  }
  if (enemies.length < spawnrate) {
    enemies[enemies.length] = new Enemy("", -50, 0, true);
  }
}

// calculates and displays words per minute
function get_wpm() {
  if (delta_time > 0) {
    var minutes = delta_time / 60;
    var wpm = Math.floor(word_counter / minutes);
    ctx.fillStyle = "orange";
    ctx.font = "24px Arial";
    ctx.fillText(`WPM : ${wpm.toString()}`, canvas.width / 2 + 100, 100);
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

// sets variables to values once the game starts
function setup() {
  start_time = new Date().getTime() / 1000;
  word_speed = 0.75;
  spawnrate = 3;
  started = true;
}

function updateGameLogic() {
  if (!started) setup();
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

function loading() {
  ctx.fillStyle = "white";
  ctx.font = "32px Arial";
  ctx.fillText("Loading...", canvas.width / 2 - 50, canvas.height / 2);
  loadWords();
}

// the game-loop
function draw() {
  // clear canvas
  resizeCanvas();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Handle different game states
  switch (gameState) {
    case "loading":
      loading();
      break;
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

  // places user-inputs in bottom right corner
  word_x = (canvas.width / 100) * 70;
  word_y = (canvas.height / 100) * 75;

  //Long ahh if-statement for what happens when a key is pressed
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
          difficulty = 1;
          gameState = "running";
        } else if (current_word === "options" && gameState !== "running") {
          gameState = "menu"; // turn on settings menu
        }
        if (gameState !== "game_over") {
          enemies[focusedEnemy].dead = true; // random_word is destroyed
          word_counter++; // increase eniemies destroyed
          current_word = ""; // word is reset
        }
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

  // check if enemy is off screen
  if (enemies.length > 0) {
    for (const enemy of enemies) {
      if (enemy.x_pos > canvas.width) {
        endTheGame();
      }
    }
  }

  // Spawns and moves enemies
  if (gameState !== "game_over" && gameState !== "loading") {
    for (var i = 0; i < enemies.length; i++) {
      enemies[i].get_chrs_correct(); // needed to make letters in menu and start green
      enemies[i].draw(); // draws enemy
      enemies[i].x_pos += word_speed; // moves enemy
    }
  }

  if (gameState !== "loading" && enemies.length > 0) {
    if (focusedEnemy >= 0 && focusedEnemy < enemies.length) {
      enemies[focusedEnemy].get_chrs_correct(); // updates chrs_correct
    } else {
      console.warn("Invalid focus index:", focusedEnemy);
    }
  }
  find_focus(); // finds which enemy to focus
  draw_input(); // display the current guess

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
