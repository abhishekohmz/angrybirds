const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas width and height to match the window's inner width
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.5;
const friction = 0.968;
const slowMotionGravity = 0.1; // Slower gravity for targets
const slowMotionFriction = 0.970; // Higher friction for slower movement

const birdStartPosition = { x: 250, y: canvas.height - 300 }; // Adjusted y-coordinate

let birds = [];
let activeBird = null;

const birdImages = [
    './images/R.png', // Replace with the path to your bird images
    './images/b.png',
    './images/y.png'
];
const loadedBirdImages = birdImages.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

const starImage = new Image();
starImage.src = './images/star.png'; // Replace with the path to your star image

let currentLevel = 1; // Initial level

function createBird() {
    const bird = {
        x: birdStartPosition.x,
        y: birdStartPosition.y,
        width: 25,
        image: loadedBirdImages[Math.floor(Math.random() * loadedBirdImages.length)], // Assign a random bird image
        vx: 0,
        vy: 0,
        isDragging: false,
        inFlight: false,
        opacity: 1,
        fadeStarted: false // Added fadeStarted property
    };
    birds.push(bird);
    activeBird = bird;
}

// Array of targets
let targets = [
    { x: 1500, y: 300, width: 50, height: 50, color: 'green', vx: 0, vy: 0, mass: 1, isFalling: false },
    { x: 1300, y: 400, width: 50, height: 50, color: 'blue', vx: 0, vy: 0, mass: 1, isFalling: false },
    { x: 1400, y: 250, width: 50, height: 50, color: 'yellow', vx: 0, vy: 0, mass: 1, isFalling: false },
    { x: 1200, y: 330, width: 50, height: 50, color: 'orange', vx: 0, vy: 0, mass: 1, isFalling: false }
];

// Array of stars
let stars = [
    { x: 1400, y: 450, width: 30, height: 30, opacity: 1, fadeStarted: false },
    { x: 1350, y: 250, width: 30, height: 30, opacity: 1, fadeStarted: false },
    { x: 1250, y: 300, width: 30, height: 30, opacity: 1, fadeStarted: false }
];

// Generate random positions with x-axis > 1000
function getRandomPosition(objectWidth, objectHeight) {
    return {
        x: 1000 + Math.random() * (canvas.width - 1000 - objectWidth),
        y: Math.random() * (canvas.height - objectHeight)
    };
}

function generateTargets(level) {
    const targetColors = ['green', 'blue', 'yellow', 'orange'];
    let newTargets = [];
    for (let i = 0; i < level + 3; i++) { // Increment the number of targets based on the level
        newTargets.push({
            ...getRandomPosition(50, 50),
            width: 50,
            height: 50,
            color: targetColors[i % targetColors.length],
            vx: 0,
            vy: 0,
            mass: 1,
            isFalling: false
        });
    }
    return newTargets;
}

function generateStars(level) {
    let newStars = [];
    for (let i = 0; i < level + 2; i++) { // Increment the number of stars based on the level
        newStars.push({
            ...getRandomPosition(30, 30),
            width: 30,
            height: 30,
            opacity: 1,
            fadeStarted: false
        });
    }
    return newStars;
}

const sling = { startX: birdStartPosition.x, startY: birdStartPosition.y, endX: birdStartPosition.x, endY: birdStartPosition.y, color: 'black' };

function drawBird(bird) {
    ctx.save();
    ctx.globalAlpha = bird.opacity;
    ctx.drawImage(bird.image, bird.x - bird.width, bird.y - bird.width, bird.width * 2, bird.width * 2);
    ctx.restore();
}

function drawTarget(target) {
    ctx.fillStyle = target.color;
    ctx.fillRect(target.x, target.y, target.width, target.height);
}

function drawStar(star) {
    ctx.save();
    ctx.globalAlpha = star.opacity;
    ctx.drawImage(starImage, star.x, star.y, star.width, star.height);
    ctx.restore();
}

function drawSling() {
    ctx.beginPath();
    ctx.moveTo(sling.startX, sling.startY);
    ctx.lineTo(sling.endX, sling.endY);
    ctx.strokeStyle = sling.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function showLevel() {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`Level: ${currentLevel}`, canvas.width / 2, 40);
}

function remainingStars() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`Stars Left: ${stars.length}`, canvas.width / 2, 90);
}

function updateBird(bird) {
    if (!bird.isDragging && bird.inFlight) {
        bird.vy += gravity;
        bird.vx *= friction;
        bird.vy *= friction;
        bird.x += bird.vx;
        bird.y += bird.vy;

        if (bird.y + bird.width > canvas.height) {
            bird.y = canvas.height - bird.width;
            bird.vy = -bird.vy * friction;
        }
        if (bird.x + bird.width > canvas.width) {
            bird.x = canvas.width - bird.width;
            bird.vx = -bird.vx * friction;
        }
        if (bird.x - bird.width < 0) {
            bird.x = bird.width;
            bird.vx = -bird.vx * friction;
        }

        // Check if bird has stopped moving
        if (Math.abs(bird.vx) < 0.1 && Math.abs(bird.vy) < 0.1) {
            bird.inFlight = false;
        }
    }

    // Start fading after 2 seconds if bird is not active and not already fading
    if (!bird.isDragging && bird !== activeBird && !bird.fadeStarted) {
        bird.fadeStarted = true;
        setTimeout(() => {
            bird.opacity = 0.99; // Start the fading process
        }, 2000);
    }

    // Reduce opacity gradually if fading has started
    if (bird.opacity < 1) {
        bird.opacity -= 0.01;
        if (bird.opacity < 0) {
            bird.opacity = 0;
        }
    }
}

function updateTarget(target) {
    if (target.isFalling) { // Only update target if it's falling
        target.vx *= slowMotionFriction;
        target.vy += slowMotionGravity;
        target.vy *= slowMotionFriction;
        target.x += target.vx;
        target.y += target.vy;

        if (target.y + target.height > canvas.height) {
            target.y = canvas.height - target.height;
            target.vy = -target.vy * slowMotionFriction;
        }
        if (target.x + target.width > canvas.width) {
            target.x = canvas.width - target.width;
            target.vx = -target.vx * slowMotionFriction;
        }
        if (target.x < 0) {
            target.x = 0;
            target.vx = -target.vx * slowMotionFriction;
        }
    }
}

function updateStar(star) {
    if (star.fadeStarted) {
        star.opacity -= 0.01;
        if (star.opacity < 0) {
            star.opacity = 0;
        }
    }
}

function checkCollision(bird, target) {
    if (
        bird.x + bird.width > target.x &&
        bird.x - bird.width < target.x + target.width &&
        bird.y + bird.width > target.y &&
        bird.y - bird.width < target.y + target.height
    ) {
        target.color = 'black';
        target.isFalling = true; // Set target to start falling
        // Calculate impact force and apply to the target with further reduced speed
        target.vx = (bird.vx * bird.width / target.mass) * 0.01; // Adjusted multiplier
        target.vy = (bird.vy * bird.width / target.mass) * 0.01; // Adjusted multiplier
    }
}

function checkStarCollision(bird, star) {
    if (
        bird.x + bird.width > star.x &&
        bird.x - bird.width < star.x + star.width &&
        bird.y + bird.width > star.y &&
        bird.y - bird.width < star.y + star.height
    ) {
        star.fadeStarted = true;
    }
}

function nextLevel() {
    // Increment level

    if(currentLevel<3){
        currentLevel++;
    }
    else{
        alert('Game completed')
    }
    

    // Reset birds
    birds = [];
    createBird();

    // Reset stars with random positions and incremented count
    stars = generateStars(currentLevel);

    // Reset targets with random positions and incremented count
    targets = generateTargets(currentLevel);

    // Restart game loop
    gameLoop();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSling();
    birds.forEach(drawBird);
    targets.forEach(drawTarget);
    stars.forEach(drawStar);
    birds.forEach(updateBird);
    targets.forEach(updateTarget);
    stars.forEach(updateStar);
    birds.forEach(bird => targets.forEach(target => checkCollision(bird, target)));
    birds.forEach(bird => stars.forEach(star => checkStarCollision(bird, star)));
    birds = birds.filter(bird => bird.opacity > 0); // Remove birds that have fully faded away
    stars = stars.filter(star => star.opacity > 0); // Remove stars that have fully faded away


    // show current level
    showLevel();

    // show remaining stars count
    remainingStars();

    

    // Check if all stars have faded completely
    if (stars.length === 0) {
        // Delay showing the alert message by 1 second
        setTimeout(function () {
            // Alert the game win message
            alert(`Congratulations! You've won the level ${currentLevel} game!`);
            // next llevel 
            nextLevel();
        }, 1000);
    } else {
        requestAnimationFrame(gameLoop);
    }
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (
        mouseX > activeBird.x - activeBird.width &&
        mouseX < activeBird.x + activeBird.width &&
        mouseY > activeBird.y - activeBird.width &&
        mouseY < activeBird.y + activeBird.width
    ) {
        activeBird.isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (activeBird.isDragging) {
        const rect = canvas.getBoundingClientRect();
        activeBird.x = e.clientX - rect.left;
        activeBird.y = e.clientY - rect.top;
        sling.endX = activeBird.x;
        sling.endY = activeBird.y;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (activeBird.isDragging) {
        const rect = canvas.getBoundingClientRect();
        // Calculate the distance dragged
        const distanceX = sling.startX - activeBird.x;
        const distanceY = sling.startY - activeBird.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Adjust the multiplier (0.1) to control the velocity based on dragging distance
        const velocityMultiplier = 0.1 + distance * 0.001; // Increase velocity with dragging distance

        
        // Calculate the velocity components based on the distance dragged
        const velX = distanceX * velocityMultiplier;
        const velY = distanceY * velocityMultiplier;

        // Assign the calculated velocities to the bird
        activeBird.vx = velX;
        activeBird.vy = velY;

        activeBird.isDragging = false;
        activeBird.inFlight = true;
        sling.endX = sling.startX;
        sling.endY = sling.startY;
        createBird(); // Create a new bird immediately after launching
    }
});

createBird(); // Initial bird
gameLoop();
