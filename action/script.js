/*
 * --------------------------------------------------------------
 * © 2024 Space Shitter
 * Author: Jack Hyun
 * All rights reserved.
 * --------------------------------------------------------------
 */

const spaceship = document.getElementById('spaceship');
const gameContainer = document.getElementById('game-container');
const levelDisplay = document.getElementById('level-display');
const healthDisplay = document.getElementById('health-display');
const countdownDisplay = document.getElementById('countdown-display');

let bullets = [];
let enemies = [];
let movement = { left: false, right: false, shooting: false };
let bulletCooldown = false; 
let enemySpeed = 2, tankySpeed = 1, advancedSpeed = 2, bossSpeed = 0.1, horizontalSpeed = 2, homingEnemySpeed = 1;
let level = 1;
let countdown = 20; 
let playerHP = 3; 
let gameOver = false;
let lastFrame = performance.now(); 
let homingDetectionRange = 200;
let bulletCooldownTime = 150; 
let lastShotTime = 0; 
let score = 0;

let bossSpawnInterval;
let bossSpawnedThisLevel = false;
let bossActive = false;

let boss2Active = false;
let boss2EnemySpawnInterval;
let boss2SpawnedThisLevel = false;
let boss2Angle = 0; 
const boss2Radius = 150; 
const boss2Speed = 0.05; 
let boss2CenterX = gameContainer.clientWidth / 2;
let boss2CenterY = boss2Radius + 10; 



window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        movement.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        movement.right = true;
    } else if (e.key === ' ') {
        e.preventDefault();
        movement.shooting = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        movement.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        movement.right = false;
    } else if (e.key === ' ') {
        movement.shooting = false;
    }
});

function moveSpaceship(deltaTime) {
    const leftPosition = spaceship.offsetLeft;
    if (movement.left && leftPosition > 0) {
        spaceship.style.left = `${leftPosition - 300 * deltaTime}px`; 
    } else if (movement.right && leftPosition < gameContainer.clientWidth - spaceship.offsetWidth) {
        spaceship.style.left = `${leftPosition + 300 * deltaTime}px`;
    }
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.textContent = `Score: ${score}`;
}

function shootBullet() {
    const currentTime = performance.now();
    if (movement.shooting && currentTime - lastShotTime >= bulletCooldownTime) {
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        bullet.style.left = `${spaceship.offsetLeft + spaceship.clientWidth / 2 - 5}px`;
        bullet.style.bottom = `${spaceship.clientHeight + 10}px`;
        gameContainer.appendChild(bullet);
        bullets.push(bullet);
        lastShotTime = currentTime; 
    }
}

function moveBullets(deltaTime) {
    bullets.forEach((bullet, index) => {
        const bulletBottom = bullet.offsetTop;
        if (bulletBottom < 0) {
            bullet.remove();
            bullets.splice(index, 1);
        } else {
            bullet.style.top = `${bulletBottom - 400 * deltaTime}px`;
        }
    });
}

function spawnParticles(x, y) {
    const particleCount = 30; 
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        gameContainer.appendChild(particle);

        const angle = Math.random() * 2 * Math.PI;
        const velocity = Math.random() * 10 + 2; 
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        (function animateParticle(time) {
            const deltaTime = (time - lastFrame) / 1000;

            const rect = particle.getBoundingClientRect();
            const newX = rect.left + vx * deltaTime * 100 - gameContainer.getBoundingClientRect().left;
            const newY = rect.top + vy * deltaTime * 100 - gameContainer.getBoundingClientRect().top;

            if (newX >= 0 && newX < gameContainer.clientWidth && newY >= 0 && newY < gameContainer.clientHeight) {
                particle.style.left = `${newX}px`;
                particle.style.top = `${newY}px`;
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        })(performance.now());
    }
}

function applyRandomSpin(enemyElement) {
    const spinDuration = Math.random() * 1.4 + 0.9;

    const isClockwise = Math.random() > 0.5;
    const direction = isClockwise ? 'normal' : 'reverse';
    enemyElement.style.animation = `spin ${spinDuration}s ${direction} linear infinite`;
}

function moveEnemies(deltaTime) {
    enemies.forEach((enemyObj, index) => {
        const { element, type, direction } = enemyObj;
        let enemyTop = parseFloat(element.style.top) || 0;

        if (type === 'regular') {
            enemyTop += enemySpeed * deltaTime * 70;
        } else if (type === 'tanky') {
            enemyTop += tankySpeed * deltaTime * 70;
        } else if (type === 'advanced') {
            enemyTop += advancedSpeed * deltaTime * 70;
            let enemyLeft = parseFloat(element.style.left) || 0;

            if (direction === 'right') {
                enemyLeft += horizontalSpeed * deltaTime * 100;
                if (enemyLeft >= gameContainer.clientWidth - element.clientWidth) {
                    enemyObj.direction = 'left';
                }
            } else {
                enemyLeft -= horizontalSpeed * deltaTime * 100;
                if (enemyLeft <= 0) {
                    enemyObj.direction = 'right';
                }
            }

            element.style.left = `${enemyLeft}px`;
        } else if (type === 'boss') {
            let bossLeft = parseFloat(element.style.left) || 0;

            if (enemyObj.direction === 'right') {
                bossLeft += horizontalSpeed * deltaTime * 100;
                if (bossLeft >= gameContainer.clientWidth - element.clientWidth) {
                    enemyObj.direction = 'left'; 
                }
            } else {
                bossLeft -= horizontalSpeed * deltaTime * 100;
                if (bossLeft <= 0) {
                    enemyObj.direction = 'right';
                }
            }

            element.style.left = `${bossLeft}px`;
            element.style.top = '0px'; 
        }

        if (enemyTop > gameContainer.clientHeight) {
            element.remove();
            enemies.splice(index, 1);
        } else if (type !== 'boss') {
            element.style.top = `${enemyTop}px`;
        }
    });
}


function shakeCamera() {
    const shakeIntensity = 50;
    let shakeCount = 0;

    function shake() {
        if (shakeCount < 10) {
            const x = Math.random() * shakeIntensity - shakeIntensity / 2;
            const y = Math.random() * shakeIntensity - shakeIntensity / 2;
            gameContainer.style.transform = `translate(${x}px, ${y}px)`;
            shakeCount++;
            requestAnimationFrame(shake);
        } else {
            gameContainer.style.transform = 'translate(0, 0)';
        }
    }

    shake();
}

function checkCollisions() {
    enemies.forEach((enemyObj, eIndex) => {
        const { element, type } = enemyObj;

        bullets.forEach((bullet, bIndex) => {
            if (
                bullet.offsetLeft < element.offsetLeft + element.clientWidth &&
                bullet.offsetLeft + bullet.clientWidth > element.offsetLeft &&
                bullet.offsetTop < element.offsetTop + element.clientHeight &&
                bullet.offsetTop + bullet.clientHeight > element.offsetTop
            ) {
            
                bullet.remove();
                bullets.splice(bIndex, 1);

                if (type === 'tanky') {
                    enemyObj.health -= 1;
                    if (enemyObj.health <= 0) {
                        score += 20;  
                        updateScoreDisplay();
                        spawnParticles(element.offsetLeft + 15, element.offsetTop + 15);
                        element.remove();
                        enemies.splice(eIndex, 1);
                    }
                } else if (type === 'advanced') {
                    score += 15; 
                    updateScoreDisplay();
                    spawnParticles(element.offsetLeft + 10, element.offsetTop + 10);
                    element.remove();
                    enemies.splice(eIndex, 1);
                } else if (type === 'boss' || type === 'boss2') {
                    enemyObj.health -= 1;
                    if (enemyObj.health <= 0) {
                        score += 50; 
                        updateScoreDisplay();
                        spawnParticles(element.offsetLeft + element.clientWidth / 2, element.offsetTop + element.clientHeight / 2);
                        element.remove();
                        enemies.splice(eIndex, 1);
                        bossActive = false;  
                        boss2Active = false; 
                        goToNextLevel(); 
                    }
                } else {
                    score += 5; 
                    updateScoreDisplay();
                    spawnParticles(element.offsetLeft + 10, element.offsetTop + 10);
                    element.remove();
                    enemies.splice(eIndex, 1);
                }
            }
        });

        if (
            element.offsetLeft < spaceship.offsetLeft + spaceship.clientWidth &&
            element.offsetLeft + element.clientWidth > spaceship.offsetLeft &&
            element.offsetTop < spaceship.offsetTop + spaceship.clientHeight &&
            element.offsetTop + element.clientHeight > spaceship.offsetTop
        ) {
            element.remove();
            enemies.splice(eIndex, 1);
            playerHP -= 1;
            updateHealth();
            shakeCamera();

            if (playerHP === 0) {
                endGame();
            }
        }
    });
}

function updateGame(time) {
    const deltaTime = (time - lastFrame) / 1000;
    lastFrame = time;

    if (!gameOver) {
        moveSpaceship(deltaTime);
        moveBullets(deltaTime);
        moveEnemies(deltaTime);
        moveStars(deltaTime); 
        checkCollisions();

        shootBullet();

        requestAnimationFrame(updateGame);
    }
}


function startLevelTimer() {
    setInterval(() => {
        level += 1;
        bossSpawnedThisLevel = false;
        boss2SpawnedThisLevel = false;
        updateLevel();
        enemySpeed += 1;
        tankySpeed += 0.5;
        advancedSpeed += 0.5;
        countdown = 20;
        updateCountdown();
    }, 20000);

    setInterval(() => {
        if (gameOver) {
            return; 
        }
        if (countdown > 0) {
            countdown -= 1;
            updateCountdown();
        }
    }, 1000);
}


function goToNextLevel() {
    level += 1; 
    updateLevel(); 
    countdown = 20; 
    updateCountdown(); 

    bossSpawnedThisLevel = false;
    boss2SpawnedThisLevel = false;
}

function spawnEnemy() {
    if (gameOver) {
        return; 
    }
  
     const randomDelay = Math.floor(Math.random() * 1501) + 500;


     setTimeout(() => {
        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        
        enemy.style.left = `${Math.random() * (gameContainer.clientWidth - 20)}px`;
        enemy.style.top = '0px'; 
        gameContainer.appendChild(enemy);
        enemies.push({ element: enemy, type: 'regular' });
        gameContainer.appendChild(enemy);
        applyRandomSpin(enemy);
     }, randomDelay);
}

function spawnTankyEnemy() {
    if (gameOver) {
        return; 
    }
    const randomDelay = Math.floor(Math.random() * 1501) + 500;

     setTimeout(() => {
        const enemy = document.createElement('div');
        enemy.className = 'tanky-enemy';
        enemy.style.left = `${Math.random() * (gameContainer.clientWidth - 30)}px`;
        enemy.style.top = '0px'; 
        gameContainer.appendChild(enemy);
        enemies.push({ element: enemy, type: 'tanky', health: 3 });
        
        gameContainer.appendChild(enemy);
        applyRandomSpin(enemy);
     }, randomDelay);
}

function spawnAdvancedEnemy() {
    if (gameOver) {
        return; 
    }
    const randomDelay = Math.floor(Math.random() * 1501) + 500;

    setTimeout(() => {
        const enemy = document.createElement('div');
        enemy.className = 'advanced-enemy';
        enemy.style.left = `${Math.random() * (gameContainer.clientWidth - 20)}px`;
        enemy.style.top = '0px';
        gameContainer.appendChild(enemy);
        enemies.push({ element: enemy, type: 'advanced', direction: Math.random() > 0.5 ? 'right' : 'left' });
        gameContainer.appendChild(enemy);
        applyRandomSpin(enemy);
     }, randomDelay);
}


function spawnEnemiesNearBoss(bossElement) {
    if (gameOver) {
        return; 
    }
    function spawnSingleEnemy() {
        if (gameOver) {
            return; 
        }
        if (bossElement.parentNode === null) {
            clearInterval(bossSpawnInterval);
            return;
        }

        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        const bossLeft = parseFloat(bossElement.style.left);
        const bossTop = parseFloat(bossElement.style.top);
        const bossWidth = bossElement.offsetWidth;

        const offsetX = Math.random() * 30 - 15;
        const offsetY = Math.random() * 50 + bossElement.offsetHeight; 

        const enemyLeft = Math.min(Math.max(bossLeft + bossWidth / 2 + offsetX, 0), gameContainer.clientWidth - 20);
        const enemyTop = Math.min(bossTop + offsetY, gameContainer.clientHeight - 20); 

        enemy.style.left = `${enemyLeft}px`;
        enemy.style.top = `${enemyTop}px`;
        gameContainer.appendChild(enemy);
        applyRandomSpin(enemy);

        enemies.push({ element: enemy, type: 'regular' });
    }

    bossSpawnInterval = setInterval(spawnSingleEnemy, 300);
}

function spawnBossEnemy() {
    if (gameOver) {
        return; 
    }
    if (bossActive || bossSpawnedThisLevel) {
        return;
    }

    const boss = document.createElement('div');
    boss.className = 'boss-enemy';
    boss.style.left = `${(gameContainer.clientWidth - 30) / 2}px`; 
    boss.style.top = '0px'; 
    gameContainer.appendChild(boss);

    enemies.push({ element: boss, type: 'boss', direction: 'right', health: 20 });

    bossActive = true;
    bossSpawnedThisLevel = true;

    spawnEnemiesNearBoss(boss);
}

function spawnAdvancedEnemiesAroundMovingBoss(boss2) {
    if (gameOver) {
        return; 
    }

    const bossRect = boss2.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const bossLeft = bossRect.left - containerRect.left;
    const bossTop = bossRect.top - containerRect.top;
    const bossWidth = boss2.offsetWidth;
    const bossHeight = boss2.offsetHeight;

    const positions = [
        { left: bossLeft - 20, top: bossTop + bossHeight / 4, direction: 'left' }, 
        { left: bossLeft - 20, top: bossTop + 5.5 * bossHeight / 4, direction: 'left' }, 
        { left: bossLeft + bossWidth + 20, top: bossTop + bossHeight / 4, direction: 'right' }, 
        { left: bossLeft + bossWidth + 20, top: bossTop + 5.5 * bossHeight / 4, direction: 'right' } 
    ];

    positions.forEach(position => {
        const advancedEnemy = document.createElement('div');
        advancedEnemy.className = 'advanced-enemy';

        advancedEnemy.style.left = `${Math.min(Math.max(position.left, 0), gameContainer.clientWidth - 20)}px`;
        advancedEnemy.style.top = `${Math.min(Math.max(position.top, 0), gameContainer.clientHeight - 20)}px`;


        gameContainer.appendChild(advancedEnemy);

        applyRandomSpin(advancedEnemy);

        enemies.push({ element: advancedEnemy, type: 'advanced', direction: position.direction});
    });
}

function moveBoss2Circular(boss2) {
    if (!boss2Active) return; 

    const x = boss2CenterX + boss2Radius * Math.cos(boss2Angle);
    const y = boss2CenterY + boss2Radius * Math.sin(boss2Angle);

    boss2.style.left = `${x-60}px`;
    boss2.style.top = `${y}px`;

    boss2Angle += boss2Speed;
    requestAnimationFrame(() => moveBoss2Circular(boss2));
}

function spawnBoss2Enemy() {
    if (gameOver) {
        return; 
    }
    if (boss2Active || boss2SpawnedThisLevel) {
        return;
    }

    const boss2 = document.createElement('div');
    boss2.className = 'boss2-enemy';
    boss2.style.width = '120px';
    boss2.style.height = '120px';
    gameContainer.appendChild(boss2);


    enemies.push({ element: boss2, type: 'boss2', health: 10 });


    boss2Active = true;


    boss2SpawnedThisLevel = true;

    requestAnimationFrame(() => moveBoss2Circular(boss2));

    boss2EnemySpawnInterval = setInterval(() => spawnAdvancedEnemiesAroundMovingBoss(boss2), 500);
}

function startEnemySpawning() {
    setInterval(() => {
        if (level >= 1 && level != 5  && level != 10) {
            spawnEnemy();
        }
        if (level >= 2 && level != 5 && level != 6 && level != 10) {
            spawnTankyEnemy();
        }
        if (level >= 3 && level != 5 && level != 10 && level != 6) {
            spawnEnemy();
        }
        if (level >= 4 && level != 5 && level != 6 && level != 10) {
            spawnEnemy();
        }
        if (level == 5 && level != 10){
            spawnBossEnemy();
        }
        if (level >= 6 && level != 10) {
            spawnAdvancedEnemy();
        }
        if (level >= 7 && level != 10) {
            spawnTankyEnemy();
        }
        if (level >= 8 && level != 10) {
            spawnEnemy();
        }
        if (level >= 9 && level != 10) {
            spawnAdvancedEnemy();
        }
        if (level == 10 ) {
            spawnBoss2Enemy();
        }
    }, 1000);
}

let stars = [];

function spawnStar() {
    if (gameOver) {
        return; 
    }
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * (gameContainer.clientWidth - 10)}px`; 
    star.style.top = '0px'; 
    gameContainer.appendChild(star);
    stars.push({ element: star, speed: Math.random() * 2 + 1 });
}

function moveStars(deltaTime) {
    stars.forEach((starObj, index) => {
        const { element, speed } = starObj;
        let starTop = parseFloat(element.style.top) || 0;

        starTop += speed * deltaTime * 70; 


        if (starTop > gameContainer.clientHeight) {
            element.remove();
            stars.splice(index, 1); 
        } else {
            element.style.top = `${starTop}px`; 
        }
    });
}

setInterval(() => {
    spawnStar();
}, Math.random() * 150 + 70);
function updateGame(time) {
    const deltaTime = (time - lastFrame) / 1000;
    lastFrame = time;

    if (!gameOver) {
        moveSpaceship(deltaTime);
        moveBullets(deltaTime);
        moveEnemies(deltaTime);
        moveStars(deltaTime); 
        checkCollisions();

        if (movement.shooting) {
            shootBullet();
        }

        requestAnimationFrame(updateGame);
    }
}

function updateLevel() {
    if (gameOver) {
        return; 
    }
    levelDisplay.textContent = `Level: ${level}`;
}

function updateHealth() {
    if (gameOver) {
        return;
    }
    healthDisplay.textContent = `HP: ${playerHP}`;
}

function updateCountdown() {
    if (gameOver) {
        return; 
    }
    countdownDisplay.textContent = `Next Level In: ${countdown}s`;
}


function startGame() {
    startLevelTimer();
    startEnemySpawning();
    updateHealth();
    updateCountdown();
    requestAnimationFrame(updateGame);
    updateScoreDisplay(); 
}

function endGame() {
    gameOver = true;
    const finalLevelDisplay = document.getElementById('final-level');
    const finalScoreDisplay = document.getElementById('final-score'); 

    finalLevelDisplay.textContent = `You reached Level: ${level}`;
    finalScoreDisplay.textContent = `Your score: ${score}`; 

    document.getElementById('game-over-screen').style.display = 'block';
}


function restartGame() {
    location.reload();
}


startGame();