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

        this.bindTiltEffect();
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

    bindTiltEffect() {
        const card = document.getElementById('eventCard');
        if (!card) return;

        const onMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;

            // Calculate rotation values
            // Tilt rotation calculations (adjust multipliers for stronger/weaker tilt)
            const rotateX = (y - height / 2) / (height / 2) * -8; // Invert and scale (change -8 to adjust X-axis tilt strength)
            const rotateY = (x - width / 2) / (width / 2) * 8; // Scale (change 8 to adjust Y-axis tilt strength)

            // Parallax translation calculations (adjust multipliers for stronger/weaker parallax)
            const translateX = (x - width / 2) / (width / 2) * -20; // Invert for parallax (change -20 to adjust horizontal parallax strength)
            const translateY = (y - height / 2) / (height / 2) * -20; // Invert for parallax (change -20 to adjust vertical parallax strength)

            // Calculate holo shine position
            const posX = (x / width) * 100;
            const posY = (y / height) * 100;

            // Set CSS custom properties
            card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
            card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
            card.style.setProperty('--tx', `${translateX.toFixed(2)}px`);
            card.style.setProperty('--ty', `${translateY.toFixed(2)}px`);
            card.style.setProperty('--posx', `${posX.toFixed(2)}%`);
            card.style.setProperty('--posy', `${posY.toFixed(2)}%`);
        };

        const onMouseLeave = () => {
            // Reset CSS custom properties on mouse leave
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--tx', '0px');
            card.style.setProperty('--ty', '0px');
            card.style.setProperty('--posx', '50%');
            card.style.setProperty('--posy', '50%');
        };

        card.addEventListener('mousemove', onMouseMove);
        card.addEventListener('mouseleave', onMouseLeave);
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
