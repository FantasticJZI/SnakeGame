class TetrisGame {
    constructor() {
        // Canvas 元素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // UI 元素
        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        this.levelElement = document.getElementById('level');
        this.highScoreElement = document.getElementById('high-score');
        this.piecesPlacedElement = document.getElementById('piecesPlaced');
        this.gameSpeedElement = document.getElementById('gameSpeed');
        this.gameTimeElement = document.getElementById('gameTime');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLinesElement = document.getElementById('finalLines');
        this.finalLevelElement = document.getElementById('finalLevel');
        this.restartBtn = document.getElementById('restartBtn');
        this.holdBtn = document.getElementById('holdBtn');
        
        // 遊戲設定
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        this.CANVAS_WIDTH = this.BOARD_WIDTH * this.BLOCK_SIZE;
        this.CANVAS_HEIGHT = this.BOARD_HEIGHT * this.BLOCK_SIZE;
        
        // 遊戲狀態
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.piecesPlaced = 0;
        this.highScore = localStorage.getItem('tetrisHighScore') || 0;
        this.startTime = null;
        this.gameTime = 0;
        
        // 遊戲板
        this.board = this.createBoard();
        
        // 方塊定義
        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00f000'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#f00000'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000f0'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ff7f00'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        // 當前方塊
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        
        // 方塊位置
        this.pieceX = 0;
        this.pieceY = 0;
        this.pieceRotation = 0;
        
        // 動畫效果
        this.particles = [];
        this.lineClearAnimation = [];
        this.dropTime = 0;
        this.lastTime = 0;
        
        // 綁定事件
        this.bindEvents();
        this.updateHighScore();
        this.generateNextPiece();
        this.spawnPiece();
        this.gameLoop();
    }
    
    createBoard() {
        return Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    bindEvents() {
        // 鍵盤控制
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) {
                if (e.code !== 'KeyP') {
                    this.startGame();
                }
            }
            
            if (this.gamePaused) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'KeyC':
                    e.preventDefault();
                    this.holdPiece();
                    break;
                case 'KeyP':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // 觸控控制
        document.getElementById('moveLeft').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(-1, 0);
            } else if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('moveRight').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(1, 0);
            } else if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('softDrop').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(0, 1);
            } else if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('rotate').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.rotatePiece();
            } else if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('hardDrop').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.hardDrop();
            } else if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('holdBtn').addEventListener('click', () => {
            if (this.gameRunning && !this.gamePaused) {
                this.holdPiece();
            } else if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        // 重新開始按鈕
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // 觸控事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleTouch(x, y);
        });
        
        // 防止觸控滾動
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    handleTouch(x, y) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const threshold = 60; // 增加觸控區域
        
        // 左側區域 - 左移
        if (x < centerX - threshold) {
            this.movePiece(-1, 0);
        }
        // 右側區域 - 右移
        else if (x > centerX + threshold) {
            this.movePiece(1, 0);
        }
        // 下方區域 - 快速下降
        else if (y > centerY + threshold) {
            this.movePiece(0, 1);
        }
        // 上方區域 - 旋轉
        else if (y < centerY - threshold) {
            this.rotatePiece();
        }
        // 中央區域 - 瞬間下降
        else {
            this.hardDrop();
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.startTime = Date.now();
        this.gameOverElement.style.display = 'none';
        this.gameOverElement.classList.remove('show');
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
        }
    }
    
    restartGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.piecesPlaced = 0;
        this.gameTime = 0;
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.particles = [];
        this.lineClearAnimation = [];
        this.updateScore();
        this.generateNextPiece();
        this.spawnPiece();
        this.gameOverElement.style.display = 'none';
        this.gameOverElement.classList.remove('show');
    }
    
    generateNextPiece() {
        const randomType = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        this.nextPiece = {
            type: randomType,
            shape: this.pieces[randomType].shape,
            color: this.pieces[randomType].color
        };
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
            this.generateNextPiece();
        } else {
            const randomType = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
            this.currentPiece = {
                type: randomType,
                shape: this.pieces[randomType].shape,
                color: this.pieces[randomType].color
            };
        }
        
        this.pieceX = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.pieceY = 0;
        this.pieceRotation = 0;
        this.canHold = true;
        
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.pieceX + dx;
        const newY = this.pieceY + dy;
        
        if (this.isValidPosition(newX, newY, this.currentPiece.shape)) {
            this.pieceX = newX;
            this.pieceY = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        if (this.isValidPosition(this.pieceX, this.pieceY, rotated)) {
            this.currentPiece.shape = rotated;
            this.pieceRotation = (this.pieceRotation + 1) % 4;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2; // 快速下降獎勵分數
        }
        this.placePiece();
    }
    
    holdPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        // 創建方塊的深拷貝，重置旋轉狀態
        const pieceToHold = {
            type: this.currentPiece.type,
            shape: this.pieces[this.currentPiece.type].shape.map(row => [...row]),
            color: this.currentPiece.color
        };
        
        if (this.holdPiece) {
            // 交換當前方塊和存放方塊
            this.currentPiece = {
                type: this.holdPiece.type,
                shape: this.holdPiece.shape.map(row => [...row]),
                color: this.holdPiece.color
            };
            this.holdPiece = pieceToHold;
        } else {
            // 存放當前方塊
            this.holdPiece = pieceToHold;
            this.spawnPiece();
        }
        
        this.canHold = false;
        this.pieceX = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.pieceY = 0;
        this.pieceRotation = 0;
        
        // 檢查新方塊位置是否有效
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    isValidPosition(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    checkCollision() {
        return !this.isValidPosition(this.pieceX, this.pieceY, this.currentPiece.shape);
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.pieceX + col;
                    const y = this.pieceY + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.piecesPlaced++;
        this.createPlaceParticles();
        this.clearLines();
        this.spawnPiece();
        this.updateScore();
    }
    
    clearLines() {
        const linesToClear = [];
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        if (linesToClear.length > 0) {
            this.lines += linesToClear.length;
            this.level = Math.floor(this.lines / 10) + 1;
            
            // 計算分數
            const baseScore = [0, 40, 100, 300, 1200][linesToClear.length] * this.level;
            this.score += baseScore;
            
            // 行消除動畫
            this.lineClearAnimation = linesToClear;
            
            // 延遲移除行
            setTimeout(() => {
                this.removeLines(linesToClear);
                this.lineClearAnimation = [];
            }, 300);
        }
    }
    
    removeLines(linesToClear) {
        for (let i = linesToClear.length - 1; i >= 0; i--) {
            this.board.splice(linesToClear[i], 1);
            this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
        }
    }
    
    createPlaceParticles() {
        const centerX = (this.pieceX + this.currentPiece.shape[0].length / 2) * this.BLOCK_SIZE;
        const centerY = (this.pieceY + this.currentPiece.shape.length / 2) * this.BLOCK_SIZE;
        
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                alpha: 1,
                color: this.currentPiece.color
            });
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.linesElement.textContent = this.lines;
        this.levelElement.textContent = this.level;
        this.piecesPlacedElement.textContent = this.piecesPlaced;
        this.gameSpeedElement.textContent = this.level;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
            localStorage.setItem('tetrisHighScore', this.highScore);
        }
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    updateGameTime() {
        if (this.gameRunning && this.startTime) {
            this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            this.gameTimeElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.finalLinesElement.textContent = this.lines;
        this.finalLevelElement.textContent = this.level;
        this.gameOverElement.style.display = 'block';
        this.gameOverElement.classList.add('show');
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.updateGameTime();
        
        // 自動下降
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.dropTime += deltaTime;
        const dropInterval = Math.max(50, 1000 - (this.level - 1) * 100);
        
        if (this.dropTime >= dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.placePiece();
            }
            this.dropTime = 0;
        }
        
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.alpha = particle.life;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            return particle.life > 0;
        });
    }
    
    draw() {
        // 清空主畫布
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製網格
        this.drawGrid();
        
        // 繪製已放置的方塊
        this.drawBoard();
        
        // 繪製當前方塊
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.pieceX, this.pieceY, this.ctx);
        }
        
        // 繪製行消除動畫
        this.drawLineClearAnimation();
        
        // 繪製粒子
        this.drawParticles();
        
        // 繪製下一個方塊
        this.drawNextPiece();
        
        // 繪製存放方塊
        this.drawHoldPiece();
        
        // 繪製暫停提示
        if (this.gamePaused) {
            this.drawPauseText();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col], this.ctx);
                }
            }
        }
    }
    
    drawPiece(piece, x, y, ctx) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    this.drawBlock(x + col, y + row, piece.color, ctx, true);
                }
            }
        }
    }
    
    drawBlock(x, y, color, ctx, isGhost = false) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        ctx.save();
        
        if (isGhost) {
            ctx.globalAlpha = 0.3;
        }
        
        // 方塊主體
        ctx.fillStyle = color;
        ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // 方塊邊框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // 高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, 2);
        ctx.fillRect(pixelX + 2, pixelY + 2, 2, this.BLOCK_SIZE - 4);
        
        ctx.restore();
    }
    
    drawLineClearAnimation() {
        if (this.lineClearAnimation.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (const row of this.lineClearAnimation) {
                this.ctx.fillRect(0, row * this.BLOCK_SIZE, this.canvas.width, this.BLOCK_SIZE);
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#2c3e50';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * 20) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * 20) / 2;
            
            for (let row = 0; row < this.nextPiece.shape.length; row++) {
                for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                    if (this.nextPiece.shape[row][col]) {
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(
                            offsetX + col * 20 + 1,
                            offsetY + row * 20 + 1,
                            18, 18
                        );
                    }
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.fillStyle = '#2c3e50';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdPiece) {
            const blockSize = 20;
            const offsetX = (this.holdCanvas.width - this.holdPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.holdCanvas.height - this.holdPiece.shape.length * blockSize) / 2;
            
            for (let row = 0; row < this.holdPiece.shape.length; row++) {
                for (let col = 0; col < this.holdPiece.shape[row].length; col++) {
                    if (this.holdPiece.shape[row][col]) {
                        const x = offsetX + col * blockSize;
                        const y = offsetY + row * blockSize;
                        
                        // 方塊主體
                        this.holdCtx.fillStyle = this.holdPiece.color;
                        this.holdCtx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
                        
                        // 方塊邊框
                        this.holdCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        this.holdCtx.lineWidth = 1;
                        this.holdCtx.strokeRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
                        
                        // 高光效果
                        this.holdCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.holdCtx.fillRect(x + 2, y + 2, blockSize - 4, 2);
                        this.holdCtx.fillRect(x + 2, y + 2, 2, blockSize - 4);
                    }
                }
            }
        }
    }
    
    drawPauseText() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('遊戲暫停', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按 P 繼續', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});