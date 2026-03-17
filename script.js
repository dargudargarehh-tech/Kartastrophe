const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Asset Loading ---
const titleImg = new Image();
titleImg.src = 'https://i.postimg.cc/GhQnKkYs/Gemini-Generated-Image-5u6w2z5u6w2z5u6w-(1).png';

const victoryImg = new Image();
victoryImg.src = 'https://i.postimg.cc/mgmcv1xc/Gemini-Generated-Image-5376ix5376ix5376.png'; // Replace with your victory link

const lossImg = new Image();
lossImg.src = 'https://i.postimg.cc/6Q7sBgP8/Gemini-Generated-Image-xsu82kxsu82kxsu8.png'; // Replace with your loss link

// --- Game State & Config ---
let gameActive = true;
let gameState = 'TITLE'; 
let gameMode = 'INFINITE'; 
let player = { x: 0, y: 0, speed: 0, score: 0 }; 
let cpu = { x: 0.4, y: 1500, speed: 49, active: false, finished: false }; 

const FINISH_LINE = 10000;
const keys = {};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Input Handling ---
window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
        gameActive = false;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }
    keys[e.code] = true;
});
window.addEventListener('keyup', e => keys[e.code] = false);

function resetGame(mode) {
    player = { x: 0, y: 0, speed: 0, score: 0 };
    gameMode = mode;
    cpu.active = (mode === 'RACE');
    cpu.y = 1500; 
    cpu.finished = false;
    gameState = 'PLAYING';
}

function drawCar(x, y, color, tilt = 0, sizeMult = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-35 * sizeMult, -10 * sizeMult, 70 * sizeMult, 40 * sizeMult);
    ctx.fillStyle = color;
    ctx.fillRect(-25 * sizeMult, -20 * sizeMult, 50 * sizeMult, 40 * sizeMult);
    ctx.fillStyle = '#111';
    ctx.fillRect(-15 * sizeMult, -15 * sizeMult, 30 * sizeMult, 12 * sizeMult);
    ctx.restore();
}

function drawOverlay(text, subtext, color, bgImage) {
    if (bgImage && bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 60px monospace';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '20px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 20);
}

function drawWorld() {
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height * 0.45;
    
    const skyGrad = ctx.createLinearGradient(0, 0, 0, cy);
    skyGrad.addColorStop(0, '#4facfe');
    skyGrad.addColorStop(1, '#00f2fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, cy);
    ctx.fillStyle = '#1e3f1a';
    ctx.fillRect(0, cy, width, height - cy);

    for (let y = 1; y < height - cy; y += 2) {
        const perspective = y / (height - cy);
        const trackCurve = Math.sin(player.y * 1e-19) * width;
        const drawX = cx + (trackCurve * (perspective ** 3)) - (player.x * perspective);
        const roadWidth = perspective * width * 2.0;
        const scrollOffset = (player.y * (perspective * 4.0));

        ctx.fillStyle = `rgb(${20 + perspective * 40}, ${20 + perspective * 40}, ${20 + perspective * 40})`;
        ctx.fillRect(drawX - roadWidth / 2, cy + y, roadWidth, 2);

        if ((scrollOffset % 100) < 50) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(drawX - 2, cy + y, 4, 2);
        }

        ctx.fillStyle = Math.floor(scrollOffset / 30) % 2 === 0 ? '#cc0000' : '#ffffff';
        ctx.fillRect(drawX - roadWidth / 2 - 20, cy + y, 20, 2);
        ctx.fillRect(drawX + roadWidth / 2, cy + y, 20, 2);

        if (gameMode === 'RACE') {
            const fDist = FINISH_LINE - player.y;
            if (fDist > 0 && fDist < 3000 && Math.abs((perspective * 3000) - fDist) < 20) {
                ctx.fillStyle = Math.floor(scrollOffset / 10) % 2 === 0 ? '#fff' : '#000';
                ctx.fillRect(drawX - roadWidth / 2, cy + y, roadWidth, 10);
            }
        }

        if (cpu.active) {
            const dist = cpu.y - player.y;
            if (dist > 0 && dist < 2000 && Math.abs((perspective * 2000) - dist) < 20) {
                drawCar(drawX + (roadWidth / 2 * cpu.x), cy + y, '#00ffff', 0, perspective * 2);
                if (dist < 100 && Math.abs((drawX + (roadWidth / 2 * cpu.x)) - width / 2) < 40) {
                    gameState = 'GAMEOVER';
                }
            }
        }
    }
}

function gameLoop() {
    if (!gameActive) return;

    if (gameState === 'TITLE') {
        drawOverlay("KARTASTROPHE", "Press [1] for INFINITE | Press [2] for RACE", "#00f2fe", titleImg);
        if (keys['Digit1']) resetGame('INFINITE');
        if (keys['Digit2']) resetGame('RACE');

    } else if (gameState === 'GAMEOVER') {
        drawOverlay("CRASHED", `Final Score: ${player.score} | Press [1] or [2] to restart`, "red", lossImg);
        if (keys['Digit1']) resetGame('INFINITE');
        if (keys['Digit2']) resetGame('RACE');

    } else if (gameState === 'WIN') {
        drawOverlay("VICTORY!", `Final Score: ${player.score} | Press [1] or [2] to restart`, "#00ff00", victoryImg);
        if (keys['Digit1']) resetGame('INFINITE');
        if (keys['Digit2']) resetGame('RACE');

    } else {
        if (keys['ArrowUp']) player.speed = Math.min(player.speed + 0.6, 55);
        else if (keys['ArrowDown']) player.speed = Math.max(player.speed - 1.5, 0);
        else player.speed *= 0.96;

        let tilt = 0;
        if (keys['ArrowLeft']) { player.x -= player.speed * 0.6; tilt = -0.1; }
        else if (keys['ArrowRight']) { player.x += player.speed * 0.6; tilt = 0.1; }
        else { player.x *= 0.93; }

        player.y += player.speed;
        if (player.speed > 0.1) player.score += Math.floor(player.speed / 10);

        if (cpu.active) {
            cpu.y += cpu.speed;
            if (cpu.y >= FINISH_LINE) cpu.finished = true;
        }

        if (gameMode === 'RACE') {
            if (player.y >= FINISH_LINE) {
                gameState = cpu.finished ? 'GAMEOVER' : 'WIN';
            } else if (cpu.finished && cpu.y > player.y + 1000) {
                gameState = 'GAMEOVER';
            }
        }

        drawWorld();
        drawCar(canvas.width / 2, canvas.height - 80, '#cc0000', tilt);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`MODE: ${gameMode}`, 20, 40);
        if (gameMode === 'RACE') {
            ctx.fillText(`FINISH: ${Math.max(0, Math.floor(FINISH_LINE - player.y))}m`, 20, 70);
        } else {
            ctx.fillText(`SCORE: ${player.score}`, 20, 70);
        }
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();