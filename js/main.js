// Game main entry point
import { Game } from './game/Game.js';
import { UI } from './ui/UI.js';

class CoyaleRash {
    constructor() {
        this.game = null;
        this.ui = null;
        this.init();
    }

    init() {
        // Initialize UI first
        this.ui = new UI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show main menu
        this.showMainMenu();
    }

    setupEventListeners() {
        // Start game button
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Instructions button
        document.getElementById('instructions-btn').addEventListener('click', () => {
            this.showInstructions();
        });

        // Close instructions
        document.getElementById('close-instructions').addEventListener('click', () => {
            this.hideInstructions();
        });
    }

    showMainMenu() {
        document.getElementById('game-menu').classList.remove('hidden');
    }

    hideMainMenu() {
        document.getElementById('game-menu').classList.add('hidden');
    }

    showInstructions() {
        document.getElementById('instructions-modal').classList.remove('hidden');
    }

    hideInstructions() {
        document.getElementById('instructions-modal').classList.add('hidden');
    }

    startGame() {
        this.hideMainMenu();
        
        // Initialize the game
        this.game = new Game();
        this.game.start();
        
        // Connect UI to game
        this.ui.setGame(this.game);
    }

    resetGame() {
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        this.showMainMenu();
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CoyaleRash();
});