import { Vector2D, Utils } from '../utils/Utils.js';

export class Unit {
    constructor(position, type, team) {
        this.position = position.clone();
        this.type = type;
        this.team = team;
        this.alive = true;
        
        // Get unit stats based on type
        const stats = this.getUnitStats(type);
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.attackRange = stats.range;
        this.radius = stats.radius || 15;
        
        // Movement and combat
        this.velocity = new Vector2D();
        this.target = null;
        this.lastAttack = 0;
        this.attackCooldown = 1000; // 1 second between attacks
        
        // Animation
        this.animationTime = 0;
        this.facing = team === 'player' ? -1 : 1; // -1 = up, 1 = down
        
        // Visual
        this.emoji = this.getUnitEmoji(type);
        this.size = this.getUnitSize(type);
    }

    getUnitStats(type) {
        const stats = {
            knight: { 
                health: 1200, 
                damage: 150, 
                speed: 30, 
                range: 40, 
                radius: 15 
            },
            archer: { 
                health: 400, 
                damage: 100, 
                speed: 40, 
                range: 100, 
                radius: 12 
            },
            giant: { 
                health: 3000, 
                damage: 200, 
                speed: 20, 
                range: 50, 
                radius: 25 
            },
            wizard: { 
                health: 600, 
                damage: 250, 
                speed: 35, 
                range: 120, 
                radius: 12 
            }
        };
        
        return stats[type] || stats.knight;
    }

    getUnitEmoji(type) {
        const emojis = {
            knight: '⚔️',
            archer: '🏹',
            giant: '👹',
            wizard: '🧙‍♂️'
        };
        return emojis[type] || '⚔️';
    }

    getUnitSize(type) {
        const sizes = {
            knight: 20,
            archer: 18,
            giant: 30,
            wizard: 20
        };
        return sizes[type] || 20;
    }

    update(deltaTime, game) {
        if (!this.alive) return;

        // Find target
        this.findTarget(game);
        
        // Move towards target or enemy base
        this.move(deltaTime, game);
        
        // Attack if in range
        this.attemptAttack(game);
        
        // Update animation
        this.animationTime += deltaTime;
    }

    findTarget(game) {
        let closestTarget = null;
        let closestDistance = Infinity;
        
        // Look for enemy units first
        game.units.forEach(unit => {
            if (unit.team !== this.team && unit.alive) {
                const distance = this.position.distanceTo(unit.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = unit;
                }
            }
        });
        
        // If no units, target enemy tower
        if (!closestTarget) {
            const enemyTower = game.towers.find(tower => 
                tower.team !== this.team && tower.alive
            );
            if (enemyTower) {
                closestTarget = enemyTower;
            }
        }
        
        this.target = closestTarget;
    }

    move(deltaTime, game) {
        if (!this.target) return;
        
        const distanceToTarget = this.position.distanceTo(this.target.position);
        
        // If within attack range, stop moving
        if (distanceToTarget <= this.attackRange) {
            this.velocity.set(0, 0);
            return;
        }
        
        // Move towards target
        const direction = this.position.directionTo(this.target.position);
        this.velocity = direction.multiply(this.speed);
        
        // Update position
        const movement = this.velocity.clone().multiply(deltaTime);
        this.position.add(movement);
        
        // Update facing direction
        if (direction.y < 0) {
            this.facing = -1; // Moving up
        } else if (direction.y > 0) {
            this.facing = 1; // Moving down
        }
        
        // Keep unit within bounds
        this.position.x = Utils.clamp(this.position.x, this.radius, game.canvas.width - this.radius);
        this.position.y = Utils.clamp(this.position.y, this.radius, game.canvas.height - this.radius);
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
        if (this.type === 'archer' || this.type === 'wizard') {
            // Ranged attack - create projectile
            this.createProjectile(target, game);
        } else {
            // Melee attack - direct damage
            target.takeDamage(this.damage);
        }
    }

    createProjectile(target, game) {
        const projectile = {
            position: this.position.clone(),
            target: target.position.clone(),
            speed: 200,
            damage: this.damage,
            team: this.team,
            alive: true,
            type: this.type,
            
            update: function(deltaTime) {
                const direction = this.position.directionTo(this.target);
                const movement = direction.multiply(this.speed * deltaTime);
                this.position.add(movement);
                
                // Check if reached target area
                const distance = this.position.distanceTo(this.target);
                if (distance < 10) {
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
                ctx.fillStyle = this.team === 'player' ? '#3498db' : '#e74c3c';
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, 3, 0, Math.PI * 2);
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
    }

    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        
        // Draw unit shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y + this.size/2, this.size/2, this.size/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw unit body
        ctx.translate(this.position.x, this.position.y);
        
        // Add walking animation
        const walkOffset = Math.sin(this.animationTime * 8) * 2;
        ctx.translate(0, walkOffset);
        
        // Team color background
        ctx.fillStyle = this.team === 'player' ? '#3498db' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Unit emoji
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        // Health bar
        this.drawHealthBar(ctx);
        
        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 1.5;
        const barHeight = 4;
        const barY = -this.size - 10;
        
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
    }
}