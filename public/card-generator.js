class EventCardGenerator {
    constructor() {
        this.currentMode = 'web';
        this.cardData = null;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.bindEvents();
        this.fetchAndDisplayLatestCard(); // Initial load
    }

    bindEvents() {
        const card = document.getElementById('eventCard');
        if (card) {
            card.addEventListener('click', () => this.flipCard());
        }

        // Pattern Toggle
        const patternGroup = document.querySelector('.pattern-toggle-group');
        if(patternGroup) {
            patternGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(patternGroup, e.target);
                    this.switchPattern(e.target.dataset.pattern);
                }
            });
        }

        // Style Toggle
        const styleGroup = document.querySelector('.style-toggle-group');
        if(styleGroup) {
            styleGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(styleGroup, e.target);
                    this.switchStyle(e.target.dataset.style);
                }
            });
        }

        // Blend Mode Toggle
        const blendModeGroup = document.querySelector('.blend-mode-toggle-group');
        if(blendModeGroup) {
            blendModeGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(blendModeGroup, e.target);
                    this.switchBlendMode(e.target.dataset.blendMode);
                }
            });
        }

        // Holo Type Toggle
        const holoTypeGroup = document.querySelector('.holo-type-toggle-group');
        if(holoTypeGroup) {
            holoTypeGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(holoTypeGroup, e.target);
                    this.switchHoloType(e.target.dataset.holoType);
                }
            });
        }

        // Holo Effect Switch
        const holoSwitch = document.getElementById('holo-enabled-switch');
        if(holoSwitch) {
            holoSwitch.addEventListener('change', (e) => {
                const card = document.querySelector('.card');
                if (e.target.checked) {
                    card.classList.remove('holo-disabled');
                } else {
                    card.classList.add('holo-disabled');
                }
            });
        }

        this.setupHoloEffect();
    }

    updateActiveButton(group, activeButton) {
        group.querySelectorAll('.toggle-group-item').forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    flipCard() {
        const card = document.getElementById('eventCard');
        if (card) {
            card.classList.toggle('flipped');
        }
    }

    switchPattern(patternType) {
        const holoPattern = document.querySelector('.holo-pattern');
        if (!holoPattern) return;
        holoPattern.classList.remove('pattern-outlined', 'pattern-filled');
        if (patternType === 'outlined') {
            holoPattern.classList.add('pattern-outlined');
        } else if (patternType === 'filled') {
            holoPattern.classList.add('pattern-filled');
        }
    }

    switchStyle(styleType) {
        const card = document.getElementById('eventCard');
        if (!card) return;
        card.classList.remove('floating');
        if (styleType === 'floating') {
            card.classList.add('floating');
        }
    }

    switchBlendMode(blendMode) {
        const card = document.querySelector('.card');
        if (!card) return;
        card.classList.remove('luminosity', 'normal', 'overlay');
        card.classList.add(blendMode);
    }

    switchHoloType(holoType) {
        const card = document.querySelector('.card');
        if (!card) return;
        card.classList.remove('white-holo');
        if (holoType === 'white') {
            card.classList.add('white-holo');
        }
    }

    setupHoloEffect() {
        const card = document.getElementById('eventCard');
        if (!card) return;

        let animationFrame = null;
        let mouseX = 0;
        let mouseY = 0;
        let cardRect = card.getBoundingClientRect();
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let currentRotateX = 0;
        let currentRotateY = 0;

        // Update card rect on window resize
        window.addEventListener('resize', () => {
            cardRect = card.getBoundingClientRect();
        });

        const updateCardTransform = (clientX, clientY, isDragUpdate = false) => {
            const width = cardRect.width;
            const height = cardRect.height;
            
            let normalX, normalY;
            
            if (isDragUpdate && isDragging) {
                // For drag, calculate rotation based on drag distance
                const dragDistanceX = (clientX - dragStartX) / width;
                const dragDistanceY = (clientY - dragStartY) / height;
                
                // Add to current rotation (accumulative)
                currentRotateY = Math.max(-30, Math.min(30, currentRotateY + dragDistanceX * 20));
                currentRotateX = Math.max(-30, Math.min(30, currentRotateX - dragDistanceY * 20));
                
                // Update drag start for next frame
                dragStartX = clientX;
                dragStartY = clientY;
                
                // Use accumulated rotation values
                const rotateX = currentRotateX;
                const rotateY = currentRotateY;
                
                // Calculate position for effects based on current touch/mouse position
                const x = clientX - cardRect.left;
                const y = clientY - cardRect.top;
                const posX = (x / width) * 100;
                const posY = (y / height) * 100;
                
                // Batch all style updates
                card.style.cssText += `
                    --rx: ${rotateX}deg;
                    --ry: ${rotateY}deg;
                    --tx: ${rotateY * -0.5}px;
                    --ty: ${rotateX * 0.5}px;
                    --posx: ${posX}%;
                    --posy: ${posY}%;
                    --mouse-x: ${posX}%;
                    --mouse-y: ${posY}%;
                `;
            } else {
                // For hover, calculate based on position
                const x = clientX - cardRect.left;
                const y = clientY - cardRect.top;
                
                normalX = (x / width - 0.5) * 2;
                normalY = (y / height - 0.5) * 2;
                
                // Tilt rotation calculations
                const rotateX = normalY * -10;
                const rotateY = normalX * 10;
                
                // Parallax translation calculations
                const translateX = normalX * -15;
                const translateY = normalY * -15;
                
                // Calculate holo shine position
                const posX = (x / width) * 100;
                const posY = (y / height) * 100;
                
                // Batch all style updates
                card.style.cssText += `
                    --rx: ${rotateX}deg;
                    --ry: ${rotateY}deg;
                    --tx: ${translateX}px;
                    --ty: ${translateY}px;
                    --posx: ${posX}%;
                    --posy: ${posY}%;
                    --mouse-x: ${posX}%;
                    --mouse-y: ${posY}%;
                `;
            }
        };

        // Mouse events
        const onMouseMove = (e) => {
            if (!isDragging) {
                mouseX = e.clientX;
                mouseY = e.clientY;

                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                animationFrame = requestAnimationFrame(() => updateCardTransform(mouseX, mouseY, false));
            }
        };

        const onMouseEnter = () => {
            cardRect = card.getBoundingClientRect();
            card.style.willChange = 'transform';
        };

        const onMouseLeave = () => {
            if (!isDragging) {
                resetCard();
            }
        };

        // Touch events for mobile
        const onTouchStart = (e) => {
            e.preventDefault(); // Prevent scrolling while dragging
            isDragging = true;
            const touch = e.touches[0];
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            cardRect = card.getBoundingClientRect();
            card.style.willChange = 'transform';
            
            // Initialize current rotation to 0 at start of drag
            currentRotateX = 0;
            currentRotateY = 0;
        };

        const onTouchMove = (e) => {
            if (isDragging) {
                e.preventDefault();
                const touch = e.touches[0];
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                animationFrame = requestAnimationFrame(() => 
                    updateCardTransform(touch.clientX, touch.clientY, true)
                );
            }
        };

        const onTouchEnd = (e) => {
            e.preventDefault();
            isDragging = false;
            
            // Smoothly return to center
            setTimeout(() => {
                if (!isDragging) {
                    resetCard();
                }
            }, 100);
        };

        // Mouse drag events for desktop
        const onMouseDown = (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            cardRect = card.getBoundingClientRect();
            card.style.willChange = 'transform';
            
            // Initialize current rotation to 0 at start of drag
            currentRotateX = 0;
            currentRotateY = 0;
            
            // Prevent text selection while dragging
            e.preventDefault();
        };

        const onMouseDrag = (e) => {
            if (isDragging) {
                e.preventDefault();
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                animationFrame = requestAnimationFrame(() => 
                    updateCardTransform(e.clientX, e.clientY, true)
                );
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                
                // Check if mouse is still over card
                const rect = card.getBoundingClientRect();
                const isMouseOverCard = 
                    mouseX >= rect.left && 
                    mouseX <= rect.right && 
                    mouseY >= rect.top && 
                    mouseY <= rect.bottom;
                
                if (!isMouseOverCard) {
                    resetCard();
                }
            }
        };

        const resetCard = () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            card.style.willChange = 'auto';
            card.style.cssText += `
                --rx: 0deg;
                --ry: 0deg;
                --tx: 0px;
                --ty: 0px;
                --posx: 50%;
                --posy: 50%;
            `;
            
            currentRotateX = 0;
            currentRotateY = 0;
        };

        // Mouse events
        card.addEventListener('mouseenter', onMouseEnter);
        card.addEventListener('mousemove', onMouseMove);
        card.addEventListener('mouseleave', onMouseLeave);
        card.addEventListener('mousedown', onMouseDown);
        
        // Global mouse events for drag
        document.addEventListener('mousemove', onMouseDrag);
        document.addEventListener('mouseup', onMouseUp);
        
        // Touch events
        card.addEventListener('touchstart', onTouchStart, { passive: false });
        card.addEventListener('touchmove', onTouchMove, { passive: false });
        card.addEventListener('touchend', onTouchEnd, { passive: false });
    }

    async fetchAndDisplayLatestCard() {
        // This is a placeholder for fetching real data
        this.cardData = this.createPlaceholderData();
        this.updateCardDisplay();
    }

    createPlaceholderData() {
        return {
            eventData: {
                event_name: 'Windsurf World Cup',
                date: '2025-07-25T10:00:00Z',
                location: 'Maui, Hawaii',
                organizer: 'PWA',
            },
            userData: {
                name: 'Kai Lenny',
                member_since: '2010-01-15T00:00:00Z',
                discount_code: 'WS2025KL',
                avatar: 'KL',
            },
            imageData: {
                url: './placeholder/placeholder_image.png',
                variation: 'ocean waves crashing on shore'
            }
        };
    }

    updateCardDisplay() {
        if (!this.cardData) return;
        // This function would update the DOM with cardData
        // For brevity, this is simplified
    }

    flipCard() {
        const card = document.getElementById('eventCard');
        if (card) {
            card.classList.toggle('flipped');
        }
    }
}

new EventCardGenerator();
