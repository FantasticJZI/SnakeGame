class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        this.snakeLengthElement = document.getElementById('snakeLength');
        this.gameSpeedElement = document.getElementById('gameSpeed');
        
        // 遊戲設定
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 遊戲狀態
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // 蛇的初始狀態
        this.snake = [
            {x: 10, y: 10}
        ];
        this.dx = 0;
        this.dy = 0;
        
        // 食物位置
        this.food = this.generateFood();
        
        // 視覺效果
        this.particles = [];
        this.foodPulse = 0;
        this.snakeGlow = 0;
        this.eatAnimation = 0;
        
        // 綁定事件
        this.bindEvents();
        this.updateHighScore();
        this.gameLoop();
    }
    
    bindEvents() {
        // 鍵盤控制
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code !== 'Space') {
                this.startGame();
            }
            
            switch(e.code) {
                case 'ArrowUp':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
                case 'Space':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // 重新開始按鈕
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOverElement.style.display = 'none';
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
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.food = this.generateFood();
        this.particles = [];
        this.eatAnimation = 0;
        this.updateScore();
        this.gameOverElement.style.display = 'none';
        this.gameOverElement.classList.remove('show');
    }
    
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        return newFood;
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        // 移動蛇頭
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // 檢查牆壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // 檢查自身碰撞
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // 檢查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
            this.eatAnimation = 1;
            this.createEatParticles(head.x, head.y);
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        // 清空畫布
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新動畫
        this.updateAnimations();
        
        // 繪製網格
        this.drawGrid();
        
        // 繪製粒子效果
        this.drawParticles();
        
        // 繪製蛇
        this.drawSnake();
        
        // 繪製食物
        this.drawFood();
        
        // 繪製暫停提示
        if (this.gamePaused) {
            this.drawPauseText();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            if (index === 0) {
                // 蛇頭 - 添加發光效果
                this.ctx.save();
                this.ctx.shadowColor = '#4ecdc4';
                this.ctx.shadowBlur = 10 + this.snakeGlow * 5;
                
                // 蛇頭漸變
                const headGradient = this.ctx.createRadialGradient(
                    x + this.gridSize/2, y + this.gridSize/2, 0,
                    x + this.gridSize/2, y + this.gridSize/2, this.gridSize/2
                );
                headGradient.addColorStop(0, '#4ecdc4');
                headGradient.addColorStop(1, '#26a69a');
                this.ctx.fillStyle = headGradient;
                
                this.ctx.fillRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // 蛇頭的眼睛
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#2c3e50';
                const eyeSize = 3;
                const eyeOffset = 5;
                this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                
                // 眼睛高光
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(x + eyeOffset + 1, y + eyeOffset + 1, 1, 1);
                this.ctx.fillRect(x + this.gridSize - eyeOffset - eyeSize + 1, y + eyeOffset + 1, 1, 1);
                
                this.ctx.restore();
            } else {
                // 蛇身 - 漸變效果
                const bodyGradient = this.ctx.createLinearGradient(x, y, x + this.gridSize, y + this.gridSize);
                bodyGradient.addColorStop(0, '#45b7b8');
                bodyGradient.addColorStop(1, '#26a69a');
                this.ctx.fillStyle = bodyGradient;
                
                this.ctx.fillRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
                
                // 蛇身邊框
                this.ctx.strokeStyle = '#1de9b6';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4);
            }
        });
    }
    
    drawFood() {
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        
        // 食物脈衝效果
        const pulseRadius = radius + Math.sin(this.foodPulse) * 2;
        
        this.ctx.save();
        
        // 食物發光效果
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 15;
        
        // 食物漸變
        const foodGradient = this.ctx.createRadialGradient(
            centerX - 3, centerY - 3, 0,
            centerX, centerY, pulseRadius
        );
        foodGradient.addColorStop(0, '#ff8e8e');
        foodGradient.addColorStop(0.7, '#ff6b6b');
        foodGradient.addColorStop(1, '#e53e3e');
        
        this.ctx.fillStyle = foodGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 食物高光
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffb3ba';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 3, centerY - 3, pulseRadius / 3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 食物閃爍效果
        if (Math.sin(this.foodPulse * 2) > 0.8) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, pulseRadius / 2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawPauseText() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('遊戲暫停', this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('按空白鍵繼續', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.snakeLengthElement.textContent = this.snake.length;
        
        // 根據分數調整遊戲速度
        let speed = 150;
        let speedText = '正常';
        
        if (this.score >= 50) {
            speed = 120;
            speedText = '快速';
        } else if (this.score >= 100) {
            speed = 100;
            speedText = '極快';
        } else if (this.score >= 200) {
            speed = 80;
            speedText = '瘋狂';
        }
        
        this.gameSpeedElement.textContent = speedText;
        this.gameSpeed = speed;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
            localStorage.setItem('snakeHighScore', this.highScore);
        }
    }
    
    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    updateAnimations() {
        // 更新食物脈衝
        this.foodPulse += 0.1;
        
        // 更新蛇的發光效果
        this.snakeGlow = Math.sin(this.foodPulse * 0.5) * 0.5 + 0.5;
        
        // 更新吃食物動畫
        if (this.eatAnimation > 0) {
            this.eatAnimation -= 0.05;
        }
        
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.alpha = particle.life;
            return particle.life > 0;
        });
    }
    
    createEatParticles(x, y) {
        const centerX = x * this.gridSize + this.gridSize / 2;
        const centerY = y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                alpha: 1,
                color: `hsl(${Math.random() * 60 + 15}, 70%, 60%)`
            });
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
        this.gameOverElement.classList.add('show');
    }
    
    gameLoop() {
        this.update();
        this.draw();
        setTimeout(() => this.gameLoop(), this.gameSpeed || 150);
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
