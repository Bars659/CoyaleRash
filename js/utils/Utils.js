// Vector2D utility class for position and movement calculations
export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Copy constructor
    static from(other) {
        return new Vector2D(other.x, other.y);
    }

    // Add another vector
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    // Subtract another vector
    subtract(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    // Multiply by scalar
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    // Get magnitude (length) of vector
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Normalize vector (make length = 1)
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    // Get distance to another vector
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get direction vector to another point
    directionTo(other) {
        return new Vector2D(other.x - this.x, other.y - this.y).normalize();
    }

    // Clone this vector
    clone() {
        return new Vector2D(this.x, this.y);
    }

    // Set values
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
}

// Utility functions
export class Utils {
    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Linear interpolation
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Check if two circles collide
    static circleCollision(pos1, radius1, pos2, radius2) {
        const distance = pos1.distanceTo(pos2);
        return distance < (radius1 + radius2);
    }

    // Check if point is inside rectangle
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }

    // Generate random number between min and max
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Generate random integer between min and max (inclusive)
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}