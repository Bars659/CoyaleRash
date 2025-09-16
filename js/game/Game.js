import { Vector2D, Utils } from '../utils/Utils.js';
import { Unit } from '../entities/Unit.js';
import { Tower } from '../entities/Tower.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.running = false;
        this.lastTime = 0;
        
        // Game objects
        this.units = [];
        this.towers = [];
        this.projectiles = [];
        
        // Player resources
        this.playerElixir = 10;
        this.maxElixir = 10;
        this.elixirRegenRate = 1; // per second
        this.lastElixirRegen = 0;
        
        // Selected card
        this.selectedCard = null;
        this.draggingCard = false;
        
        // Mouse/touch input
        this.mousePos = new Vector2D();
        this.isMouseDown = false;
        
        // Game areas
        this.playerZone = {
            x: 0,
            y: this.canvas.height / 2,
            width: this.canvas.width,
            height: this.canvas.height / 2
        };
        
        this.enemyZone = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height / 2
        };
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeTowers();
    }

    setupCanvas() {
        // Set canvas size
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 500;
        
        // Set context properties
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    initializeTowers() {
        // Player tower
        this.towers.push(new Tower(
            new Vector2D(this.canvas.width / 2, this.canvas.height - 50),
            'player'
        ));
        
        // Enemy tower
        this.towers.push(new Tower(
            new Vector2D(this.canvas.width / 2, 50),
            'enemy'
        ));
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        // Start AI
        this.startEnemyAI();
    }

    stop() {
        this.running = false;
    }

    gameLoop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update elixir
        this.updateElixir(deltaTime);
        
        // Update units
        this.updateUnits(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update towers
        this.updateTowers(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Remove dead entities
        this.cleanupEntities();
        
        // Check win conditions
        this.checkWinConditions();
    }

    updateElixir(deltaTime) {
        this.lastElixirRegen += deltaTime;
        if (this.lastElixirRegen >= 1.0) { // Regenerate every second
            this.playerElixir = Math.min(this.playerElixir + this.elixirRegenRate, this.maxElixir);
            this.lastElixirRegen = 0;
            this.updateElixirDisplay();
        }
    }

    updateUnits(deltaTime) {
        this.units.forEach(unit => {
            unit.update(deltaTime, this);
        });
    }

    updateProjectiles(deltaTime) {
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
        });
    }

    updateTowers(deltaTime) {
        this.towers.forEach(tower => {
            tower.update(deltaTime, this);
        });
    }

    checkCollisions() {
        // Unit vs Unit combat
        for (let i = 0; i < this.units.length; i++) {
            const unit1 = this.units[i];
            if (!unit1.alive) continue;
            
            for (let j = i + 1; j < this.units.length; j++) {
                const unit2 = this.units[j];
                if (!unit2.alive || unit1.team === unit2.team) continue;
                
                const distance = unit1.position.distanceTo(unit2.position);
                if (distance < unit1.attackRange) {
                    unit1.attack(unit2);
                }
                if (distance < unit2.attackRange) {
                    unit2.attack(unit1);
                }
            }
        }
        
        // Projectile vs Unit collisions
        this.projectiles.forEach(projectile => {
            this.units.forEach(unit => {
                if (unit.team !== projectile.team && unit.alive) {
                    const distance = projectile.position.distanceTo(unit.position);
                    if (distance < unit.radius) {
                        unit.takeDamage(projectile.damage);
                        projectile.alive = false;
                    }
                }
            });
        });
    }

    cleanupEntities() {
        this.units = this.units.filter(unit => unit.alive);
        this.projectiles = this.projectiles.filter(projectile => projectile.alive);
    }

    checkWinConditions() {
        const playerTower = this.towers.find(t => t.team === 'player');
        const enemyTower = this.towers.find(t => t.team === 'enemy');
        
        if (!playerTower.alive) {
            this.endGame('defeat');
        } else if (!enemyTower.alive) {
            this.endGame('victory');
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(135, 206, 235, 1)'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw battlefield
        this.drawBattlefield();
        
        // Draw towers
        this.towers.forEach(tower => tower.render(this.ctx));
        
        // Draw units
        this.units.forEach(unit => unit.render(this.ctx));
        
        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Draw placement preview
        if (this.selectedCard && this.draggingCard) {
            this.drawPlacementPreview();
        }
    }

    drawBattlefield() {
        // Draw river/divider in the middle
        this.ctx.fillStyle = '#4682B4';
        this.ctx.fillRect(0, this.canvas.height / 2 - 10, this.canvas.width, 20);
        
        // Draw grass on player side
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height / 2 + 10, this.canvas.width, this.canvas.height / 2 - 10);
        
        // Draw enemy grass
        this.ctx.fillStyle = '#98FB98';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2 - 10);
        
        // Draw placement zone highlight if dragging
        if (this.selectedCard && this.draggingCard) {
            this.ctx.fillStyle = 'rgba(243, 156, 18, 0.3)';
            this.ctx.fillRect(
                this.playerZone.x,
                this.playerZone.y,
                this.playerZone.width,
                this.playerZone.height
            );
        }
    }

    drawPlacementPreview() {
        if (Utils.pointInRect(this.mousePos, this.playerZone)) {
            this.ctx.fillStyle = 'rgba(46, 204, 113, 0.6)';
        } else {
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
        }
        
        this.ctx.beginPath();
        this.ctx.arc(this.mousePos.x, this.mousePos.y, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Input handling
    handleMouseDown(e) {
        this.updateMousePosition(e);
        this.isMouseDown = true;
    }

    handleMouseMove(e) {
        this.updateMousePosition(e);
    }

    handleMouseUp(e) {
        this.updateMousePosition(e);
        this.isMouseDown = false;
        
        if (this.selectedCard && this.draggingCard) {
            this.tryPlaceUnit();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            this.updateTouchPosition(e.touches[0]);
            this.isMouseDown = true;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            this.updateTouchPosition(e.touches[0]);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isMouseDown = false;
        
        if (this.selectedCard && this.draggingCard) {
            this.tryPlaceUnit();
        }
    }

    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.set(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    }

    updateTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.set(
            touch.clientX - rect.left,
            touch.clientY - rect.top
        );
    }

    // Card and unit placement
    selectCard(cardType) {
        this.selectedCard = cardType;
        this.draggingCard = true;
    }

    tryPlaceUnit() {
        if (!this.selectedCard || !Utils.pointInRect(this.mousePos, this.playerZone)) {
            this.cancelCardPlacement();
            return;
        }
        
        const unitData = this.getUnitData(this.selectedCard);
        if (this.playerElixir >= unitData.cost) {
            this.spawnUnit(this.selectedCard, this.mousePos.clone(), 'player');
            this.playerElixir -= unitData.cost;
            this.updateElixirDisplay();
        }
        
        this.cancelCardPlacement();
    }

    cancelCardPlacement() {
        this.selectedCard = null;
        this.draggingCard = false;
    }

    spawnUnit(type, position, team) {
        const unit = new Unit(position, type, team);
        this.units.push(unit);
        
        // Add spawn animation
        unit.element?.classList.add('unit-spawn');
    }

    getUnitData(type) {
        const unitTypes = {
            knight: { cost: 3, health: 1200, damage: 150, speed: 30, range: 40 },
            archer: { cost: 3, health: 400, damage: 100, speed: 40, range: 100 },
            giant: { cost: 5, health: 3000, damage: 200, speed: 20, range: 50 },
            wizard: { cost: 5, health: 600, damage: 250, speed: 35, range: 120 }
        };
        return unitTypes[type] || unitTypes.knight;
    }

    updateElixirDisplay() {
        const elixirElement = document.querySelector('.elixir-count');
        if (elixirElement) {
            elixirElement.textContent = Math.floor(this.playerElixir);
        }
    }

    // AI for enemy
    startEnemyAI() {
        setInterval(() => {
            if (this.running) {
                this.enemyAI();
            }
        }, 3000); // AI acts every 3 seconds
    }

    enemyAI() {
        const unitTypes = ['knight', 'archer', 'giant', 'wizard'];
        const randomType = unitTypes[Utils.randomInt(0, unitTypes.length - 1)];
        
        const spawnX = Utils.random(100, this.canvas.width - 100);
        const spawnY = Utils.random(50, this.enemyZone.height - 50);
        
        this.spawnUnit(randomType, new Vector2D(spawnX, spawnY), 'enemy');
    }

    endGame(result) {
        this.running = false;
        
        // Show game over screen
        setTimeout(() => {
            alert(result === 'victory' ? 'Victory!' : 'Defeat!');
            // Reset game or return to menu
            window.location.reload();
        }, 1000);
    }
}