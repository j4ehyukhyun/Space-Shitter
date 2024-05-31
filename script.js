/*
 * --------------------------------------------------------------
 * © 2024 Space Shitter
 * Author: Jack Hyun
 * All rights reserved.
 * --------------------------------------------------------------
 */

const gameContainer = document.getElementById('game-container');

let stars = [];
let gameOver = false;
let lastFrame = performance.now();

function spawnStar() {
    if (gameOver) return;

    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * (gameContainer.clientWidth - 10)}px`;
    star.style.top = '0px';
    gameContainer.appendChild(star);
    stars.push({ element: star, speed: Math.random() * 2 + 1 });
}

function moveStars(deltaTime) {
    stars.forEach((star, index) => {
        let starTop = parseFloat(star.element.style.top) || 0;
        starTop += star.speed * deltaTime * 70;

        if (starTop > gameContainer.clientHeight) {
            star.element.remove();
            stars.splice(index, 1);
        } else {
            star.element.style.top = `${starTop}px`;
        }
    });
}

function updateGame(time) {
    if (gameOver) return;

    const deltaTime = (time - lastFrame) / 1000;
    lastFrame = time;

    moveStars(deltaTime);
    requestAnimationFrame(updateGame);
}

function startGame() {
    setInterval(spawnStar, Math.random() * 150 + 70); 
    requestAnimationFrame(updateGame);
}

function endGame() {
    gameOver = true;
}

startGame();
