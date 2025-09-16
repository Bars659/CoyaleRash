import { Vector2D } from '../utils/Utils.js';

export class Tower {
    constructor(position, team) {
        this.position = position.clone();
        this.team = team;
        this.alive = true;
        
        // Tower stats
        this.maxHealth = 2500;
        this.health = 2500;
        this.damage = 200;
        this.attackRange = 150;
        this.radius = 30;
        
        // Combat
        this.target = null;
        this.lastAttack = 0;
        this.attackCooldown = 800; // 0.8 seconds between attacks
        
        // Visual
        this.size = 40;
        this.emoji = '🏰';
    }

    update(deltaTime, game) {
        if (!this.alive) return;
        
        // Find target
        this.findTarget(game);
        
        // Attack if target in range
        this.attemptAttack(game);
        
        // Update health display
        this.updateHealthDisplay();
    }

    findTarget(game) {
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // Look for enemy units within range
        game.units.forEach(unit => {
            if (unit.team !== this.team && unit.alive) {
                const distance = this.position.distanceTo(unit.position);
                if (distance <= this.attackRange && distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = unit;
                }
            }
        });
        
        this.target = closestTarget;
    }

    attemptAttack(game) {
        if (!this.target || !this.target.alive) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastAttack < this.attackCooldown) return;
        
        const distanceToTarget = this.position.distanceTo(this.target.position);
        if (distanceToTarget <= this.attackRange) {
            this.attack(this.target, game);
            this.lastAttack = currentTime;
        }
    }

    attack(target, game) {
        // Create projectile
        const projectile = {
            position: this.position.clone(),
            target: target.position.clone(),
            speed: 300,
            damage: this.damage,
            team: this.team,
            alive: true,
            type: 'tower',
            
            update: function(deltaTime) {
                const direction = this.position.directionTo(this.target);
                const movement = direction.multiply(this.speed * deltaTime);
                this.position.add(movement);
                
                // Check if reached target area
                const distance = this.position.distanceTo(this.target);
                if (distance < 15) {
                    this.alive = false;
                }
                
                // Remove if off-screen
                if (this.position.x < 0 || this.position.x > 800 || 
                    this.position.y < 0 || this.position.y > 600) {
                    this.alive = false;
                }
            },
            
            render: function(ctx) {
                ctx.save();
                ctx.fillStyle = this.team === 'player' ? '#f39c12' : '#e67e22';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 3;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        
        game.projectiles.push(projectile);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        this.updateHealthDisplay();
    }

    updateHealthDisplay() {
        if (this.team === 'player') {
            const healthText = document.querySelector('.health-text');
            const healthFill = document.querySelector('.health-fill');
            
            if (healthText) {
                healthText.textContent = `${Math.floor(this.health)}/${this.maxHealth}`;
            }
            
            if (healthFill) {
                const healthPercent = (this.health / this.maxHealth) * 100;
                healthFill.style.width = `${healthPercent}%`;
            }
        }
    }

    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y + this.size/2, this.size/2, this.size/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tower base
        ctx.translate(this.position.x, this.position.y);
        
        // Team color base
        ctx.fillStyle = this.team === 'player' ? '#2ecc71' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Tower structure
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Tower emoji
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        // Attack range indicator (when targeting)
        if (this.target) {
            ctx.strokeStyle = this.team === 'player' ? '#3498db' : '#e74c3c';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Health bar
        this.drawHealthBar(ctx);
        
        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 1.5;
        const barHeight = 6;
        const barY = -this.size - 15;
        
        // Background
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#27ae60' : 
                       healthPercent > 0.3 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(-barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);
        
        // Health text
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.floor(this.health)}`, 0, barY + barHeight/2);
    }
}