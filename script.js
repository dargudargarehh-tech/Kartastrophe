const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State & Config ---
let gameActive = true;
let gameState = 'TITLE'; 
let gameMode = 'INFINITE'; 
let player = { x: 0, y: 0, speed: 0, score: 0 }; 
let cpu = { x: 0.4, y: 1500, speed: 49, active: false, finished: false }; 

const FINISH_LINE = 10000;
const keys = {};

// --- Setup ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Input Handling ---
window.addEventListener('keydown', e => {
    // Escape key instantly kills the script and clears the screen
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

// --- Visual Renderers ---
function drawCar(x, y, color, tilt = 0, sizeMult = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-35 * sizeMult, -10 * sizeMult, 70 * sizeMult, 40 * sizeMult);
    // Main Body
    ctx.fillStyle = color;
    ctx.fillRect(-25 * sizeMult, -20 * sizeMult, 50 * sizeMult, 40 * sizeMult);
    // Glass/Windshield
    ctx.fillStyle = '#111';
    ctx.fillRect(-15 * sizeMult, -15 * sizeMult, 30 * sizeMult, 12 * sizeMult);
    ctx.restore();
}

function drawWorld() {
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height * 0.45; // Horizon
    
    // Gradient Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, cy);
    skyGrad.addColorStop(0, '#4facfe');
    skyGrad.addColorStop(1, '#00f2fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, cy);

    // Grass
    ctx.fillStyle = '#1e3f1a';
    ctx.fillRect(0, cy, width, height - cy);

    // Pseudo-3D Road Rendering
    for (let y = 1; y < height - cy; y += 2) {
        const perspective = y / (height - cy);
        
        // Near-zero turn logic as requested
        const trackCurve = Math.sin(player.y * 1e-19) * width;
        const drawX = cx + (trackCurve * (perspective ** 3)) - (player.x * perspective);
        const roadWidth = perspective * width * 2.0;
        const scrollOffset = (player.y * (perspective * 4.0));

        // Asphalt Road
        const roadColor = Math.floor(20 + (perspective * 40));
        ctx.fillStyle = `rgb(${roadColor}, ${roadColor}, ${roadColor})`;
        ctx.fillRect(drawX - roadWidth / 2, cy + y, roadWidth, 2);

        // Center Dashed Lines
        if ((scrollOffset % 100) < 50) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(drawX - 2, cy + y, 4, 2);
        }

        // Road-side Curbs
        ctx.fillStyle = Math.floor(scrollOffset / 30) % 2 === 0 ? '#cc0000' : '#ffffff';
        ctx.fillRect(drawX - roadWidth / 2 - 20, cy + y, 20, 2);
        ctx.fillRect(drawX + roadWidth / 2, cy + y, 20, 2);

        // Finish Line (Race Mode Only)
        if (gameMode === 'RACE') {
            const fDist = FINISH_LINE - player.y;
            if (fDist > 0 && fDist < 3000 && Math.abs((perspective * 3000) - fDist) < 20) {
                ctx.fillStyle = Math.floor(scrollOffset / 10) % 2 === 0 ? '#fff' : '#000';
                ctx.fillRect(drawX - roadWidth / 2, cy + y, roadWidth, 10);
            }
        }

        // CPU Rival Rendering
        if (cpu.active) {
            const dist = cpu.y - player.y;
            // Draw if within range
            if (dist > 0 && dist < 2000 && Math.abs((perspective * 2000) - dist) < 20) {
                drawCar(drawX + (roadWidth / 2 * cpu.x), cy + y, '#00ffff', 0, perspective * 2);
                
                // Collision Detection
                if (dist < 100 && Math.abs((drawX + (roadWidth / 2 * cpu.x)) - width / 2) < 40) {
                    gameState = 'GAMEOVER';
                }
            }
        }
    }
}

// --- Core Loop ---
function gameLoop() {
    if (!gameActive) return;

    if (gameState === 'TITLE') {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00f2fe';
        ctx.font = 'bold 60px monospace';
        ctx.fillText("KARTASTROPHE", canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '20px monospace';
        ctx.fillStyle = 'white';
        ctx.fillText("Press [1] for INFINITE | Press [2] for RACE", canvas.width / 2, canvas.height / 2 + 20);
        if (keys['Digit1']) resetGame('INFINITE');
        if (keys['Digit2']) resetGame('RACE');

    } else if (gameState === 'GAMEOVER' || gameState === 'WIN') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = gameState === 'WIN' ? '#00ff00' : 'red';
        ctx.font = 'bold 60px monospace';
        ctx.fillText(gameState === 'WIN' ? "VICTORY!" : "CRASHED", canvas.width / 2, canvas.height / 2);
        ctx.font = '20px monospace';
        ctx.fillStyle = 'white';
        ctx.fillText(`Final Score: ${player.score}`, canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText("Press [1] or [2] to restart", canvas.width / 2, canvas.height / 2 + 100);
        if (keys['Digit1']) resetGame('INFINITE');
        if (keys['Digit2']) resetGame('RACE');

    } else {
        // --- Input & Physics ---
        if (keys['ArrowUp']) player.speed = Math.min(player.speed + 0.6, 55);
        else if (keys['ArrowDown']) player.speed = Math.max(player.speed - 1.5, 0);
        else player.speed *= 0.96;

        let tilt = 0;
        if (keys['ArrowLeft']) { player.x -= player.speed * 0.6; tilt = -0.1; }
        else if (keys['ArrowRight']) { player.x += player.speed * 0.6; tilt = 0.1; }
        else { player.x *= 0.93; } // Auto-centering

        player.y += player.speed;
        
        // Only score while driving
        if (player.speed > 0.1) player.score += Math.floor(player.speed / 10);

        // --- CPU AI Logic ---
        if (cpu.active) {
            cpu.y += cpu.speed;
            if (cpu.y >= FINISH_LINE) cpu.finished = true;
        }

        // --- Race Logic ---
        if (gameMode === 'RACE') {
            if (player.y >= FINISH_LINE) {
                gameState = cpu.finished ? 'GAMEOVER' : 'WIN';
            } else if (cpu.finished && cpu.y > player.y + 1000) {
                gameState = 'GAMEOVER';
            }
        }

        drawWorld();
        drawCar(canvas.width / 2, canvas.height - 80, '#cc0000', tilt);

        // --- HUD ---
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

// Start
gameLoop();