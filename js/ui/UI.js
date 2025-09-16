export class UI {
    constructor() {
        this.game = null;
        this.cards = [];
        this.selectedCard = null;
        this.setupCardInteractions();
    }

    setGame(game) {
        this.game = game;
    }

    setupCardInteractions() {
        // Get all cards
        this.cards = Array.from(document.querySelectorAll('.card'));
        
        // Add event listeners to each card
        this.cards.forEach(card => {
            // Mouse events
            card.addEventListener('mousedown', (e) => this.handleCardMouseDown(e, card));
            card.addEventListener('dragstart', (e) => e.preventDefault()); // Prevent default drag
            
            // Touch events
            card.addEventListener('touchstart', (e) => this.handleCardTouchStart(e, card));
            
            // Hover effects
            card.addEventListener('mouseenter', () => this.handleCardHover(card));
            card.addEventListener('mouseleave', () => this.handleCardLeave(card));
        });
        
        // Global mouse/touch events for dragging
        document.addEventListener('mousemove', (e) => this.handleGlobalMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleGlobalMouseUp(e));
        document.addEventListener('touchmove', (e) => this.handleGlobalTouchMove(e));
        document.addEventListener('touchend', (e) => this.handleGlobalTouchEnd(e));
    }

    handleCardMouseDown(e, card) {
        e.preventDefault();
        this.startCardDrag(card);
    }

    handleCardTouchStart(e, card) {
        e.preventDefault();
        this.startCardDrag(card);
    }

    startCardDrag(card) {
        if (!this.game) return;
        
        const unitType = card.dataset.unit;
        const unitData = this.game.getUnitData(unitType);
        
        // Check if player has enough elixir
        if (this.game.playerElixir < unitData.cost) {
            this.showInsufficientElixir(card);
            return;
        }
        
        // Clear previous selection
        this.clearCardSelection();
        
        // Select this card
        this.selectedCard = card;
        card.classList.add('selected');
        
        // Start dragging in game
        this.game.selectCard(unitType);
        
        // Add visual feedback
        this.addDragFeedback();
    }

    handleGlobalMouseMove(e) {
        if (this.selectedCard && this.game) {
            this.updateDragPreview(e.clientX, e.clientY);
        }
    }

    handleGlobalTouchMove(e) {
        if (this.selectedCard && this.game && e.touches.length > 0) {
            e.preventDefault();
            const touch = e.touches[0];
            this.updateDragPreview(touch.clientX, touch.clientY);
        }
    }

    handleGlobalMouseUp(e) {
        this.endCardDrag();
    }

    handleGlobalTouchEnd(e) {
        this.endCardDrag();
    }

    updateDragPreview(clientX, clientY) {
        // Update cursor position for game
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        
        // Check if within valid placement area
        const isValidPlacement = canvasY > canvas.height / 2;
        
        // Update card visual feedback
        if (isValidPlacement) {
            this.selectedCard.style.borderColor = '#27ae60';
        } else {
            this.selectedCard.style.borderColor = '#e74c3c';
        }
    }

    endCardDrag() {
        if (this.selectedCard) {
            // Reset card visuals
            this.selectedCard.classList.remove('selected');
            this.selectedCard.style.borderColor = '';
            
            this.selectedCard = null;
            this.removeDragFeedback();
        }
    }

    clearCardSelection() {
        this.cards.forEach(card => {
            card.classList.remove('selected');
            card.style.borderColor = '';
        });
    }

    addDragFeedback() {
        document.body.style.cursor = 'grabbing';
        
        // Add visual feedback to battlefield
        const canvas = document.getElementById('game-canvas');
        canvas.style.cursor = 'crosshair';
    }

    removeDragFeedback() {
        document.body.style.cursor = '';
        
        const canvas = document.getElementById('game-canvas');
        canvas.style.cursor = '';
    }

    handleCardHover(card) {
        if (!this.selectedCard) {
            this.showCardTooltip(card);
        }
    }

    handleCardLeave(card) {
        this.hideCardTooltip();
    }

    showCardTooltip(card) {
        const unitType = card.dataset.unit;
        const unitData = this.game ? this.game.getUnitData(unitType) : null;
        
        if (!unitData) return;
        
        // Create tooltip if it doesn't exist
        let tooltip = document.getElementById('card-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'card-tooltip';
            tooltip.className = 'card-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Set tooltip content
        tooltip.innerHTML = `
            <div class="tooltip-title">${unitType.charAt(0).toUpperCase() + unitType.slice(1)}</div>
            <div class="tooltip-stats">
                <div>💜 ${unitData.cost}</div>
                <div>❤️ ${unitData.health}</div>
                <div>⚔️ ${unitData.damage}</div>
                <div>🏃 ${unitData.speed}</div>
            </div>
        `;
        
        // Position tooltip
        const rect = card.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.display = 'block';
    }

    hideCardTooltip() {
        const tooltip = document.getElementById('card-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    showInsufficientElixir(card) {
        // Add temporary visual feedback for insufficient elixir
        card.classList.add('disabled');
        
        // Show floating text
        this.showFloatingText('Not enough elixir!', card);
        
        setTimeout(() => {
            card.classList.remove('disabled');
        }, 1000);
    }

    showFloatingText(text, element) {
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text';
        floatingText.textContent = text;
        
        const rect = element.getBoundingClientRect();
        floatingText.style.left = `${rect.left + rect.width / 2}px`;
        floatingText.style.top = `${rect.top}px`;
        
        document.body.appendChild(floatingText);
        
        // Animate and remove
        setTimeout(() => {
            floatingText.style.opacity = '0';
            floatingText.style.transform = 'translateY(-20px)';
        }, 100);
        
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 1100);
    }

    updateElixirDisplay(elixir) {
        const elixirElement = document.querySelector('.elixir-count');
        if (elixirElement) {
            elixirElement.textContent = Math.floor(elixir);
        }
        
        // Update card states based on elixir
        this.updateCardStates(elixir);
    }

    updateCardStates(elixir) {
        this.cards.forEach(card => {
            const unitType = card.dataset.unit;
            const unitData = this.game ? this.game.getUnitData(unitType) : null;
            
            if (unitData) {
                if (elixir < unitData.cost) {
                    card.classList.add('disabled');
                } else {
                    card.classList.remove('disabled');
                }
            }
        });
    }
}