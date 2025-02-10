let snake = [{ x: 200, y: 200 }];
let food = { x: 100, y: 100 };
let direction = "RIGHT";
let score = 0;
let speed = 200;
let level = 1;
let gameMode = "regular";
let timer = 10;
let gameRunning = false;
let gameInterval = null; // Store the interval for the game loop
let timerInterval = null; // Interval for counting down timer
let obstacles = []; // Array to store obstacle positions

// Function to pull user customizations from the server
async function fetchCustomizations() {
    try {
        const response = await fetch("/get_customization");
        const data = await response.json();

        if (data.success) {
            console.log("🎨 Customizations Loaded:", data);
            snakeColor = data.snake_color;
            mapColor = data.map_color;
        } else {
            console.log("⚠️ No customizations found. Using defaults.");
            snakeColor = "white";
            mapColor = "black";
        }
    } catch (error) {
        console.error("❌ Error fetching customizations:", error);
        snakeColor = "white";
        mapColor = "black";
    }
}

async function startGame(mode) {
    gameMode = mode;
    document.getElementById("gameCanvas").style.display = "block"; 
    document.getElementById("modeSelection").style.display = "none"; 
    document.getElementById("scoreDisplay").style.display = "block";
    document.getElementById("levelDisplay").style.display = "block";
    document.getElementById("gameOverPopup").style.display = "none"; 

    // Fetch user customizations before starting the game
    await fetchCustomizations();
    
    // Show timer only in Timed Mode
    if (gameMode === "timed") {
        document.getElementById("timerDisplay").style.display = "block";
        resetTimer();
    } else {
        document.getElementById("timerDisplay").style.display = "none";
    }

    if (!gameRunning) {
        gameRunning = true;
        direction = "RIGHT";
        snake = [{ x: 200, y: 200 }];
        food = { x: 100, y: 100 };
        generateObstacles(); // Generate initial obstacles
        document.addEventListener("keydown", changeDirection);
        runGame();
    }
}

function runGame() {
    if (gameInterval) { 
        clearInterval(gameInterval); // Stop any existing game loop before starting a new one
    }

    gameInterval = setInterval(() => {
        move();
        draw();
        updateUI();
    }, speed);

    if (gameMode === "timed") {
        startTimer(); // Start countdown if in Timed Mode
    }
}

function draw() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    
    // Apply custom map color
    ctx.fillStyle = mapColor;
    ctx.fillRect(0, 0, 400, 400);

    // Draw Obstacles
    ctx.fillStyle = "gray";
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, 20, 20);
    });

    // Draw Snake
    ctx.fillStyle = snakeColor; 
    snake.forEach(part => {
        ctx.fillRect(part.x, part.y, 20, 20);
    });

    // Draw Food
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, 20, 20);
}

function move() {
    let head = { ...snake[0] };

    if (direction === "UP") head.y -= 20;
    if (direction === "DOWN") head.y += 20;
    if (direction === "LEFT") head.x -= 20;
    if (direction === "RIGHT") head.x += 20;

    // Check for wall collision
    if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
        showGameOverPopup();
        return;
    }

    // Check for self-collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            showGameOverPopup();
            return;
        }
    }

    // Check for obstacle collision
    for (let obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            showGameOverPopup();
            return;
        }
    }

    // Move the snake
    snake.unshift(head);

    // If snake eats food, increase score
    if (head.x === food.x && head.y === food.y) {
        food = getRandomPosition();
        score++;

        if (score % 5 === 0) { 
            level++;
            speed *= 0.9; // Increase speed every 5 levels
            generateObstacles(); // Generate new obstacles
            runGame(); // Restart the game loop with new speed
        }

        if (gameMode === "timed") {
            resetTimer(); // Reset timer when food is eaten
        }
    } else {
        snake.pop(); // Remove tail if no food is eaten
    }
}

// Function to update UI with score and level
function updateUI() {
    document.getElementById("scoreDisplay").innerText = `Score: ${score}`;
    document.getElementById("levelDisplay").innerText = `Level: ${level}`;
    if (gameMode === "timed") {
        document.getElementById("timerDisplay").innerText = `Time Left: ${timer}s`;
    }
}

// Function to generate obstacles randomly
function generateObstacles() {
    obstacles = []; // Clear old obstacles
    let numObstacles = level * 2; // Increase obstacles every level

    for (let i = 0; i < numObstacles; i++) {
        let newObstacle;
        do {
            newObstacle = getRandomPosition();
        } while (isPositionOccupied(newObstacle));

        obstacles.push(newObstacle);
    }
}

// Function to start the timer countdown
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (timer > 0) {
            timer--;
            updateUI();
        } else {
            clearInterval(timerInterval);
            showGameOverPopup(); // End game if timer runs out
        }
    }, 1000);
}

// Function to reset the timer
function resetTimer() {
    timer = 10;
    updateUI();

    if (timerInterval) {
        clearInterval(timerInterval);
    }
    startTimer();
}

// Function to get a random position
function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * 20) * 20,
        y: Math.floor(Math.random() * 20) * 20
    };
}

// Function to check if a position is occupied
function isPositionOccupied(position) {
    // Check snake, food, and existing obstacles
    return (
        snake.some(part => part.x === position.x && part.y === position.y) ||
        food.x === position.x && food.y === position.y ||
        obstacles.some(obstacle => obstacle.x === position.x && obstacle.y === position.y)
    );
}

// Function to change direction when key is pressed
function changeDirection(event) {
    if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
    if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
}

// Function to show Game Over popup
async function showGameOverPopup() {
    document.getElementById("gameOverPopup").style.display = "block";
    clearInterval(gameInterval); // Stop game loop
    clearInterval(timerInterval); // Stop timer
    gameRunning = false;

    // Send high score update if user is logged in
    try {
        let response = await fetch("/update_score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: gameMode, score })
        });

        let data = await response.json();
        if (data.success) {
            console.log(`🏆 New high score saved: ${data.highScore}`);
        } else {
            console.log("ℹ️ Score was not high enough to update.");
        }
    } catch (error) {
        console.error("❌ Error saving score:", error);
    }
}

// Function to restart the game properly
function restartGame() {
    document.getElementById("gameOverPopup").style.display = "none";
    score = 0;
    level = 1;
    speed = 200; // Reset speed
    gameRunning = false;
    generateObstacles(); // Reset obstacles

    if (gameInterval) {
        clearInterval(gameInterval);
    }

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    startGame(gameMode);
}

// Function to go back to home screen
function goHome() {
    window.location.href = "/";
}