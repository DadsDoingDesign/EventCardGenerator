class EventCardGenerator {
    constructor() {
        this.currentMode = 'web';
        this.cardData = null;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.bindEvents();
        this.initAccelerometer();
        this.fetchAndDisplayLatestCard(); // Initial load
    }

    bindEvents() {
        const card = document.getElementById('eventCard');
        if (card) {
            // Mobile touch interactions
            let touchStartTime = 0;
            let touchTimer = null;
            let isLongPress = false;
            
            card.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                isLongPress = false;
                
                // Start long press timer
                touchTimer = setTimeout(() => {
                    isLongPress = true;
                    // Enable card movement on long press
                    this.enableCardMovement(e);
                }, 500); // 500ms for long press
            });
            
            card.addEventListener('touchend', (e) => {
                clearTimeout(touchTimer);
                
                if (!isLongPress && Date.now() - touchStartTime < 500) {
                    // Short tap - flip card
                    this.flipCard();
                } else if (isLongPress) {
                    // End card movement
                    this.disableCardMovement();
                }
            });
            
            card.addEventListener('touchmove', (e) => {
                if (isLongPress) {
                    this.handleCardMovement(e);
                }
            });
            
            // Desktop click for flip
            card.addEventListener('click', (e) => {
                // Only flip on desktop (non-touch devices)
                if (!('ontouchstart' in window)) {
                    this.flipCard();
                }
            });
        }
        
        // Mobile controls modal
        this.bindMobileControls();
        
        // Desktop hover for card movement
        if (!('ontouchstart' in window)) {
            card.addEventListener('mousemove', (e) => this.handleCardMovement(e));
            card.addEventListener('mouseenter', () => this.enableCardMovement());
            card.addEventListener('mouseleave', () => this.disableCardMovement());
        }

        // Pattern Toggle - bind to all pattern groups (desktop and mobile)
        const patternGroups = document.querySelectorAll('.pattern-toggle-group');
        patternGroups.forEach(patternGroup => {
            patternGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(patternGroup, e.target);
                    this.switchPattern(e.target.dataset.pattern);
                    // Sync all pattern groups
                    this.syncAllControls('pattern', e.target.dataset.pattern);
                }
            });
        });

        // Style Toggle - bind to all style groups
        const styleGroups = document.querySelectorAll('.style-toggle-group');
        styleGroups.forEach(styleGroup => {
            styleGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(styleGroup, e.target);
                    this.switchStyle(e.target.dataset.style);
                    this.syncAllControls('style', e.target.dataset.style);
                }
            });
        });

        // Blend Mode Toggle - bind to all blend mode groups
        const blendModeGroups = document.querySelectorAll('.blend-mode-toggle-group');
        blendModeGroups.forEach(blendModeGroup => {
            blendModeGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(blendModeGroup, e.target);
                    this.switchBlendMode(e.target.dataset.blendMode);
                    this.syncAllControls('blend-mode', e.target.dataset.blendMode);
                }
            });
        });

        // Holo Type Toggle - bind to all holo type groups
        const holoTypeGroups = document.querySelectorAll('.holo-type-toggle-group');
        holoTypeGroups.forEach(holoTypeGroup => {
            holoTypeGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(holoTypeGroup, e.target);
                    this.switchHoloType(e.target.dataset.holoType);
                    this.syncAllControls('holo-type', e.target.dataset.holoType);
                }
            });
        });

        // Holo Effect Switch - bind to all switches
        const holoSwitches = document.querySelectorAll('#holo-enabled-switch, #mobile-holo-enabled-switch');
        holoSwitches.forEach(holoSwitch => {
            holoSwitch.addEventListener('change', (e) => {
                const card = document.querySelector('.card');
                if (e.target.checked) {
                    card.classList.remove('holo-disabled');
                } else {
                    card.classList.add('holo-disabled');
                }
                // Sync all switches
                holoSwitches.forEach(otherSwitch => {
                    if (otherSwitch !== e.target) {
                        otherSwitch.checked = e.target.checked;
                    }
                });
            });
        });

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

    // Mobile controls methods
    bindMobileControls() {
        const mobileBtn = document.getElementById('mobileControlsBtn');
        const modal = document.getElementById('mobileControlsModal');
        const closeBtn = document.getElementById('modalClose');

        if (mobileBtn && modal) {
            mobileBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });

            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });

            // Bind mobile control events (same as desktop)
            this.bindMobileToggleEvents();
        }
    }

    bindMobileToggleEvents() {
        // Mobile Pattern Toggle
        const mobilePatternGroup = document.querySelector('.mobile-toggle-controls .pattern-toggle-group');
        if(mobilePatternGroup) {
            mobilePatternGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(mobilePatternGroup, e.target);
                    this.switchPattern(e.target.dataset.pattern);
                    // Sync with desktop controls
                    this.syncDesktopControls('pattern', e.target.dataset.pattern);
                }
            });
        }

        // Mobile Style Toggle
        const mobileStyleGroup = document.querySelector('.mobile-toggle-controls .style-toggle-group');
        if(mobileStyleGroup) {
            mobileStyleGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(mobileStyleGroup, e.target);
                    this.switchStyle(e.target.dataset.style);
                    this.syncDesktopControls('style', e.target.dataset.style);
                }
            });
        }

        // Mobile Blend Mode Toggle
        const mobileBlendModeGroup = document.querySelector('.mobile-toggle-controls .blend-mode-toggle-group');
        if(mobileBlendModeGroup) {
            mobileBlendModeGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(mobileBlendModeGroup, e.target);
                    this.switchBlendMode(e.target.dataset.blendMode);
                    this.syncDesktopControls('blend-mode', e.target.dataset.blendMode);
                }
            });
        }

        // Mobile Holo Type Toggle
        const mobileHoloTypeGroup = document.querySelector('.mobile-toggle-controls .holo-type-toggle-group');
        if(mobileHoloTypeGroup) {
            mobileHoloTypeGroup.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-group-item')) {
                    this.updateActiveButton(mobileHoloTypeGroup, e.target);
                    this.switchHoloType(e.target.dataset.holoType);
                    this.syncDesktopControls('holo-type', e.target.dataset.holoType);
                }
            });
        }

        // Mobile Holo Effect Switch
        const mobileHoloSwitch = document.getElementById('mobile-holo-enabled-switch');
        if(mobileHoloSwitch) {
            mobileHoloSwitch.addEventListener('change', (e) => {
                this.toggleHoloEffect(e.target.checked);
                // Sync with desktop switch
                const desktopSwitch = document.getElementById('holo-enabled-switch');
                if(desktopSwitch) {
                    desktopSwitch.checked = e.target.checked;
                }
            });
        }
    }

    syncAllControls(type, value) {
        // Sync all control groups of this type (desktop and mobile)
        const allGroups = document.querySelectorAll(`.${type}-toggle-group`);
        allGroups.forEach(group => {
            const buttons = group.querySelectorAll('.toggle-group-item');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                
                // Handle different data attribute formats
                let matches = false;
                if (type === 'blend-mode') {
                    matches = btn.dataset.blendMode === value;
                } else if (type === 'holo-type') {
                    matches = btn.dataset.holoType === value;
                } else {
                    // For pattern and style
                    matches = btn.dataset[type] === value;
                }
                
                if (matches) {
                    btn.classList.add('active');
                }
            });
        });
    }

    syncDesktopControls(type, value) {
        // Keep this for backward compatibility, but use syncAllControls instead
        this.syncAllControls(type, value);
    }

    // Card movement methods
    enableCardMovement(e) {
        // Add visual feedback for movement mode
        const card = document.getElementById('eventCard');
        if (card) {
            card.style.cursor = 'grab';
        }
    }

    disableCardMovement() {
        const card = document.getElementById('eventCard');
        if (card) {
            card.style.cursor = 'pointer';
            // Reset card position smoothly
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        }
    }

    handleCardMovement(e) {
        const card = document.getElementById('eventCard');
        if (!card) return;

        let clientX, clientY;
        
        // Handle both mouse and touch events
        if (e.type.includes('touch')) {
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                return;
            }
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate rotation based on mouse/touch position
        const rotateX = (clientY - centerY) / rect.height * -20; // Max 20deg rotation
        const rotateY = (clientX - centerX) / rect.width * 20;

        // Apply rotation
        card.style.setProperty('--rx', `${rotateX}deg`);
        card.style.setProperty('--ry', `${rotateY}deg`);
    }

    // Accelerometer support for mobile devices
    initAccelerometer() {
        console.log('Initializing accelerometer...');
        
        if ('DeviceOrientationEvent' in window) {
            console.log('DeviceOrientationEvent supported');
            
            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                console.log('Requesting permission for iOS...');
                
                // Add a button to trigger permission request (iOS requires user gesture)
                const permissionBtn = document.createElement('button');
                permissionBtn.textContent = 'Enable Tilt Control';
                permissionBtn.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    z-index: 1000;
                    padding: 10px 15px;
                    background: #007AFF;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                `;
                
                permissionBtn.addEventListener('click', () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(response => {
                            console.log('Permission response:', response);
                            if (response === 'granted') {
                                this.enableAccelerometer();
                                permissionBtn.remove();
                            }
                        })
                        .catch(console.error);
                });
                
                document.body.appendChild(permissionBtn);
            } else {
                // Android and older iOS - enable directly
                console.log('Enabling accelerometer directly...');
                this.enableAccelerometer();
            }
        } else {
            console.log('DeviceOrientationEvent not supported');
        }
    }

    enableAccelerometer() {
        console.log('Enabling accelerometer...');
        let isAccelerometerActive = true; // Start active immediately
        
        // Add accelerometer-active class to enable holo effects
        const card = document.getElementById('eventCard');
        if (card) {
            card.classList.add('accelerometer-active');
        }
        
        window.addEventListener('deviceorientation', (event) => {
            console.log('Device orientation event:', event.beta, event.gamma, 'Active:', isAccelerometerActive);
            
            // Only use accelerometer when not actively touching the card
            if (!isAccelerometerActive) return;
            
            const card = document.getElementById('eventCard');
            if (!card) return;

            // Get device orientation values
            const beta = event.beta;   // Front-to-back tilt (-180 to 180)
            const gamma = event.gamma; // Left-to-right tilt (-90 to 90)

            if (beta !== null && gamma !== null) {
                // Convert to card rotation (limit range for subtle effect)
                const rotateX = Math.max(-20, Math.min(20, beta * 0.5));
                const rotateY = Math.max(-20, Math.min(20, gamma * 0.5));

                // Calculate mouse position for holo effects based on device tilt
                // Map tilt to percentage position (0-100%)
                const mouseX = Math.max(0, Math.min(100, 50 + (gamma * 2))); // Left-right tilt
                const mouseY = Math.max(0, Math.min(100, 50 + (beta * 2)));  // Front-back tilt

                console.log('Applying rotation and effects:', rotateX, rotateY, mouseX, mouseY);

                // Apply rotation and holo effect positioning
                card.style.setProperty('--rx', `${rotateX}deg`);
                card.style.setProperty('--ry', `${rotateY}deg`);
                card.style.setProperty('--mouse-x', `${mouseX}%`);
                card.style.setProperty('--mouse-y', `${mouseY}%`);
                card.style.setProperty('--posx', `${mouseX}%`);
                card.style.setProperty('--posy', `${mouseY}%`);
            }
        });

        // Enable accelerometer when card is visible and not being touched
        if (card) {
            // Enable accelerometer on touch end (after flip or movement)
            card.addEventListener('touchend', () => {
                setTimeout(() => {
                    isAccelerometerActive = true;
                    console.log('Accelerometer re-enabled after touch');
                }, 500);
            });

            // Disable accelerometer during touch interactions
            card.addEventListener('touchstart', () => {
                isAccelerometerActive = false;
                console.log('Accelerometer disabled during touch');
            });
        }
        
        console.log('Accelerometer setup complete');
    }
}

new EventCardGenerator();
