// CANVAS AND CTX CREATION
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
- easter egg (?)
- highscores
- prevent enemies from spawning on top of eachother 
*/

// GLOBAL VARIABLES
let chr; // charactre pressed
let key_pressed = false; // key_pressed bool
let current_word = ""; // current input string
let word_index = 0; //
let word_x; // input x-position
let word_y; // input y-position
let started = false; // bool to check if user has typed "start"
const word_list = [
  "angry",
  "skateboard",
  "wifi",
  "computer",
  "dogs",
  "lemons",
  "keyboard",
];
let focusedEnemy = 0; // which enemy is in focus
let word_speed = 0; // speed word is moving by
let delta_time = 0.0;
let word_counter = 0; // number of enemies destroyed
let spawnrate = 0; // number of words at the screen at the same time
let score = 0;
let difficulty = 0; // Currently does nothing. scaleable with time or no. of words killed?
let start_time = new Date().getTime() / 1000; // start-time in seconds
let menu_enemy = [];
let game_is_over = false;
let in_settings = false;
let setUpComplete = false;

function start_clock() {
  if (started) start_time = new Date().getTime() / 1000;
}

// currently shows infinite, fix
function get_wpm() {
  /* calculates wpm */
  var minutes = delta_time / 60;
  var wpm = Math.floor(word_counter / minutes);
  ctx.fillStyle = "orange";
  ctx.font = "16px Arial";
  ctx.fillText(wpm.toString(), 900, 50);
}

class Enemy {
  constructor(text, x_pos, y_pos, dead, placeholder_x, chrs_correct) {
    this.text = text;
    this.x_pos = x_pos;
    this.y_pos = y_pos;
    this.dead = dead;
    this.placeholder_x = placeholder_x;
    this.chrs_correct = chrs_correct;
  }

  draw() {
    if (this.dead == false) {
      this.placeholder_x = this.x_pos; // set placeholder
      for (var i = 0; i < this.text.length; i++) {
        var ch = this.text.charAt(i);
        if (i < this.chrs_correct && this == enemies[focusedEnemy]) {
          ctx.fillStyle = "green";
        } else {
          ctx.fillStyle = "white";
        }
        ctx.font = "28px Arial";
        ctx.fillText(ch, this.x_pos, this.y_pos);
        this.x_pos += ctx.measureText(ch).width;
      }
      this.x_pos = this.placeholder_x; // reset x location
    } else {
      this.text = word_list[Math.floor(Math.random() * word_list.length)];
      if (started) {
        this.x_pos = 0;
      } else {
        this.x_pos = -200;
      } // sets position off-screen if not started
      this.y_pos = Math.floor(Math.random() * canvas.height);
      if (this.y_pos > canvas.height / 2) {
        this.y_pos -= 20;
      } else {
        this.y_pos += 20;
      }
      this.dead = false;
    }
  }

  get_chrs_correct() {
    /* 
            this function updates the chrs_correct variable to the correct
            number of correct characters 
        */
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

// generate enemies
const enemies = [];
for (var i = 0; i < 6; i++) {
  enemies[i] = new Enemy("", -50, 200, true, "");
  spawnrate++;
}

function start_or_lose() {
  /* 
        start and lose "menues" 
    */
  if (started != true && in_settings === false) {
    enemies[0].text = "start";
    enemies[0].x_pos = (canvas.width / 100) * 50;
    enemies[0].y_pos = (canvas.height / 100) * 50;
    enemies[1].text = "options";
    enemies[1].x_pos = (canvas.width / 100) * 50;
    enemies[1].y_pos = (canvas.height / 100) * 60;
    if (game_is_over) {
      game_over();
    }
  }
  // check if enemy is off screen
  for (const enemy of enemies) {
    if (enemy.x_pos > canvas.width) {
      started = false; // stop game
      spawnrate = 6;
      enemies.splice(5, enemies.length - 5);
      word_speed = 0; // stop movement
      for (e of enemies) {
        e.x_pos = -200;
      }
      game_is_over = true;
      score = Math.floor(delta_time);
    }
  }
}

function settings_menu() {
  enemies[0].text = "medium";
  enemies[0].x_pos = (canvas.width / 100) * 50;
  enemies[0].y_pos = (canvas.height / 100) * 50;
  enemies[1].text = "extreme";
  enemies[1].x_pos = (canvas.width / 100) * 50;
  enemies[1].y_pos = (canvas.height / 100) * 60;
  enemies[2].text = "help";
  enemies[2].x_pos = (canvas.width / 100) * 50;
  enemies[2].y_pos = (canvas.height / 100) * 70;

  if (current_word === enemies[0].text) {
    difficulty = 0;
    in_settings = false;
  } else if (current_word === enemies[1].text) {
    difficulty = 1;
    in_settings = false;
  } else if (current_word === enemies[2].text) {
    enemies[2].text = "Just type man, write 'surrender' if you chicken out ";
    difficulty = 0;
    in_settings = false;
  }
  started = true;
}

function game_over() {
  /* this function displays game-over screen */
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("You survived for " + score.toString() + " seconds.", 100, 100);
  ctx.fillText("You killed " + word_counter.toString() + " words.", 100, 200);
}

function draw_input() {
  /* 
        loops through current word and colors 
        characters accordingly 
    */
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

function find_focus() {
  /* finds focus based on first character of word
       and how far it is from the end of the screen */
  if (started === false) {
    if (current_word.charAt(0) === "s") {
      focusedEnemy = 0;
    } else if (current_word.charAt(0) === "o") {
      focusedEnemy = 1;
    }
  } else {
    var highest = -10000;
    for (const enemy of enemies) {
      if (current_word.charAt(0) === enemy.text.charAt(0)) {
        if (enemy.x_pos > highest) {
          highest = enemy.x_pos;
          focusedEnemy = enemies.indexOf(enemy);
        }
      }
    }
  }
}

let placeholder_time = 0.0;

// unsure if this works. doesnt feel like it anyway
function dynamic_difficulty() {
  /* increases numbers of words on screen every 5 seconds */
  if (started === true && placeholder_time === 0.0) {
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

function setUp() {
  start_clock(); // starts clock once game starts
  delta_time = new Date().getTime() / 1000 - start_time; // seconds after start
  setUpComplete = true;
}

function startGame() {
  word_speed = 0.4; // words start moving (after start)
  in_settings = false;
  word_index = 0; // reset word index
  chrs_correct = 0; // reset chrs correct
}

function draw() {
  // the game-loop
  // clear canvas
  resizeCanvas();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (in_settings) {
    settings_menu();
  }

  if (!setUpComplete) setUp();
  if (!started) startGame();

  dynamic_difficulty(); // enables harder and harder
  start_or_lose(); // handles start and lose of game
  get_wpm(); // displays wpm
  find_focus(); // finds which enemy to focus

  for (var i = 0; i < enemies.length; i++) {
    enemies[i].draw(); // draws enemy
    enemies[i].x_pos += word_speed; // moves enemy
  }

  // places user-inputs in bottom right corner
  word_x = (canvas.width / 100) * 70;
  word_y = (canvas.height / 100) * 75;

  if (key_pressed) {
    if (chr === "enter") {
      console.log(current_word);
      if (current_word === "surrender" && started) {
        enemies.length = 0; //Find a way that clears all enemies from the screen but respawns start and options
        game_over();
      }

      if (current_word === enemies[focusedEnemy].text) {
        if (started === false) {
          in_settings = true; // turn on settings menu
        }

        enemies[focusedEnemy].dead = true; // random_word is destroyed
        word_counter++; // increase eniemies destroyed
      }
      current_word = ""; // word is reset
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

  draw_input(); // display the current guess

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
