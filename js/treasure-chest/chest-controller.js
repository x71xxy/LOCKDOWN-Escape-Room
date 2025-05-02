// Treasure Chest Controller
class TreasureChestController {
    constructor(scene, renderer, camera, controls) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.controls = controls;
        
        this.chestModel = null;
        this.paperModel = null;
        
        this.isChestOpen = false;
        this.isPasswordCorrect = false;
        
        this.correctPassword = "1234"; // Correct password
        this.currentPassword = "";
        
        this.chestAnimationMixer = null;
        this.chestOpenAction = null;
        
        this.clock = new THREE.Clock();
        
        // Check if existing model is already in scene
        if (window.currentModel && window.currentModelName === 'treasurechest_new') {
            console.log('Using existing treasure chest model');
            this.chestModel = window.currentModel;
            this.setupExistingModel();
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('Initializing new treasure chest controller');
        // Load chest model
        this.loadChestModel();
        
        // Initialize UI
        this.initUI();
    }
    
    setupExistingModel() {
        // If model already exists, set up references and animations
        if (this.chestModel) {
            console.log('Setting up existing model');
            
            this.chestModel.traverse((child) => {
                console.log("Found object:", child.name); // Debug: log all object names
                
                if (child.isMesh) {
                    // Enable shadows
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Save reference to paper object for later interaction
                    if (child.name.includes('paper')) {
                        this.paperModel = child;
                        // Initially paper is not interactive
                        this.paperModel.userData.interactive = false;
                    }
                }
            });
            
            // Set up custom animation since we don't have animation data
            this.setupCustomAnimation();
            
            // Initialize UI
            this.initUI();
        }
    }
    
    loadChestModel() {
        const loader = new THREE.GLTFLoader();
        
        // Try loading with correct path first
        loader.load(
            'models/treasure_chest.glb', // Correct path based on file structure
            (gltf) => {
                console.log('Chest model loaded successfully', gltf);
                
                this.chestModel = gltf.scene;
                this.scene.add(this.chestModel);
                
                // Set chest position and scale
                this.chestModel.position.set(0, 0, 0);
                this.chestModel.scale.set(0.5, 0.5, 0.5);
                
                // Find chest parts and paper
                this.chestModel.traverse((child) => {
                    console.log("Found object:", child.name); // Debug: log all object names
                    
                    if (child.isMesh) {
                        // Enable shadows
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Save reference to paper object for later interaction
                        if (child.name.includes('paper')) {
                            this.paperModel = child;
                            // Initially paper is not interactive
                            this.paperModel.userData.interactive = false;
                        }
                    }
                });
                
                // Setup animations
                if (gltf.animations && gltf.animations.length) {
                    console.log("Found animations:", gltf.animations.length);
                    this.chestAnimationMixer = new THREE.AnimationMixer(this.chestModel);
                    this.chestOpenAction = this.chestAnimationMixer.clipAction(gltf.animations[0]);
                    this.chestOpenAction.clampWhenFinished = true;
                    this.chestOpenAction.setLoop(THREE.LoopOnce);
                } else {
                    console.log("No animations found, using custom animation");
                    // If no animations, create a custom one
                    this.setupCustomAnimation();
                }
                
                // Update references in global scope if they exist
                if (typeof window.currentModel !== 'undefined') {
                    window.currentModel = this.chestModel;
                }
                if (typeof window.currentModelName !== 'undefined') {
                    window.currentModelName = 'treasurechest_new';
                }
                
                // Hide loading message if it exists
                const loadingElement = document.getElementById('loading-chest');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                
                // Do NOT automatically show password input anymore
                // We'll only show it when the user clicks on the chest
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
                
                // Try alternative path if first one fails
                console.log('Trying alternative model path...');
                loader.load(
                    'treasure_chest.glb', // Try in root directory
                    (gltf) => {
                        console.log('Chest model loaded from alternate path', gltf);
                        // Same processing as above
                        this.chestModel = gltf.scene;
                        this.scene.add(this.chestModel);
                        
                        this.chestModel.position.set(0, 0, 0);
                        this.chestModel.scale.set(0.5, 0.5, 0.5);
                        
                        this.chestModel.traverse((child) => {
                            console.log("Found object:", child.name); // Debug
                            
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                
                                if (child.name.includes('paper')) {
                                    this.paperModel = child;
                                    this.paperModel.userData.interactive = false;
                                }
                            }
                        });
                        
                        if (gltf.animations && gltf.animations.length) {
                            console.log("Found animations in alternate path:", gltf.animations.length);
                            this.chestAnimationMixer = new THREE.AnimationMixer(this.chestModel);
                            this.chestOpenAction = this.chestAnimationMixer.clipAction(gltf.animations[0]);
                            this.chestOpenAction.clampWhenFinished = true;
                            this.chestOpenAction.setLoop(THREE.LoopOnce);
                        } else {
                            this.setupCustomAnimation();
                        }
                        
                        // Update references in global scope if they exist
                        if (typeof window.currentModel !== 'undefined') {
                            window.currentModel = this.chestModel;
                        }
                        if (typeof window.currentModelName !== 'undefined') {
                            window.currentModelName = 'treasurechest_new';
                        }
                        
                        // Manage UI elements if they exist
                        const loadingElement = document.getElementById('loading-chest');
                        if (loadingElement) {
                            loadingElement.style.display = 'none';
                        }
                        
                        // Do NOT automatically show password input
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded (alternate path)');
                    },
                    (error) => {
                        console.error('Failed to load model from any path:', error);
                        
                        // Show error in UI if container exists
                        const container = document.querySelector('.lockbox-code-content');
                        if (container) {
                            container.innerHTML = `
                                <div class="error-message">
                                    <p>Failed to load treasure chest model.</p>
                                    <p>Error: ${error.message}</p>
                                </div>
                            `;
                        }
                    }
                );
            }
        );
    }
    
    setupCustomAnimation() {
        // If exported model has no animations, create a custom rotation animation
        // Look for the chest part using the new name from the screenshot
        this.chestPart = null;
        
        // Try all possible names for the chest part
        const possibleNames = [
            "polySurface28.001", 
            "The_bottom_half_of_the_treasure_chest",
            "chest_bottom_wood",
            "polySurface28"
        ];
        
        // Try each name
        for (const name of possibleNames) {
            const part = this.chestModel.getObjectByName(name);
            if (part) {
                this.chestPart = part;
                console.log(`Found chest part with name: ${name}`);
                break;
            }
        }
        
        // If still not found, try to find any mesh that might be the chest
        if (!this.chestPart) {
            this.chestModel.traverse((child) => {
                if (child.isMesh && !this.chestPart) {
                    // Try to find the main chest part by size or other criteria
                    this.chestPart = child;
                    console.log(`Using fallback part: ${child.name}`);
                }
            });
        }
        
        if (this.chestPart) {
            console.log("Using custom animation with part:", this.chestPart.name);
            // Initial rotation
            this.chestPart.rotation.x = 0;
            
            // Create a simulation animation mixer
            this.chestAnimationMixer = {
                update: () => {
                    if (this.isChestOpen && this.chestPart.rotation.x < 0.8) {
                        this.chestPart.rotation.x += 0.01;
                        if (this.chestPart.rotation.x >= 0.8) {
                            // Enable paper interaction when animation completes
                            if (this.paperModel) {
                                this.paperModel.userData.interactive = true;
                            }
                        }
                    }
                }
            };
        } else {
            console.warn("Could not find any chest part for animation");
        }
    }
    
    initUI() {
        // Get container or create one if needed
        let container = document.querySelector('.lockbox-code-content');
        if (!container) {
            container = document.createElement('div');
            container.className = 'lockbox-code-content';
            const modelContainer = document.getElementById('model-container');
            if (modelContainer) {
                modelContainer.appendChild(container);
            } else {
                document.body.appendChild(container);
                console.warn('Model container not found, appending to body');
            }
        }
        
        // Create password input UI if it doesn't already exist
        if (!document.getElementById('password-input')) {
            // Create password input UI
            const passwordUI = document.createElement('div');
            passwordUI.id = 'password-input';
            passwordUI.style.display = 'none'; // Initially hidden, shown after model loads
            passwordUI.innerHTML = `
                <div class="password-display">
                    <p>Enter password to unlock: <span id="password-display">****</span></p>
                </div>
                <div class="keypad">
                    <button class="digit-btn" data-digit="1">1</button>
                    <button class="digit-btn" data-digit="2">2</button>
                    <button class="digit-btn" data-digit="3">3</button>
                    <button class="digit-btn" data-digit="4">4</button>
                    <button class="digit-btn" data-digit="5">5</button>
                    <button class="digit-btn" data-digit="6">6</button>
                    <button class="digit-btn" data-digit="7">7</button>
                    <button class="digit-btn" data-digit="8">8</button>
                    <button class="digit-btn" data-digit="9">9</button>
                    <button class="digit-btn" data-digit="0">0</button>
                    <button class="clear-btn">Clear</button>
                    <button class="submit-btn">Submit</button>
                </div>
            `;
            
            // Create loading indicator
            const loadingInfo = document.createElement('div');
            loadingInfo.id = 'loading-chest';
            loadingInfo.innerHTML = `
                <p>Loading treasure chest model...</p>
            `;
            
            // Add to page
            container.appendChild(loadingInfo);
            container.appendChild(passwordUI);
            
            // Add event listeners for buttons
            this.addEventListeners();
        } else {
            console.log('Password UI already exists');
        }
    }
    
    addEventListeners() {
        // Ensure listeners aren't added multiple times
        this.eventListenersAdded = true;
        
        // Add listeners directly without waiting for DOMContentLoaded
        const addListeners = () => {
            // Digit button click events
            document.querySelectorAll('.digit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const digit = e.target.dataset.digit;
                    this.inputDigit(digit);
                });
            });
            
            // Clear button click event
            const clearBtn = document.querySelector('.clear-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.clearPassword();
                });
            }
            
            // Submit button click event
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.checkPassword();
                });
            }
            
            // Keyboard input events
            document.addEventListener('keydown', (e) => {
                // Number keys (0-9)
                if (e.key >= '0' && e.key <= '9') {
                    this.inputDigit(e.key);
                }
                // Enter key
                else if (e.key === 'Enter') {
                    this.checkPassword();
                }
                // Backspace key
                else if (e.key === 'Backspace') {
                    this.clearPassword();
                }
            });
            
            // Click handler for the 3D model
            const modelContainer = document.getElementById('model-container');
            if (modelContainer) {
                modelContainer.addEventListener('click', (event) => {
                    this.handleModelClick(event);
                });
            }
        };
        
        // Check if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addListeners);
        } else {
            addListeners();
        }
    }
    
    inputDigit(digit) {
        if (this.currentPassword.length < 4) {
            this.currentPassword += digit;
            this.updatePasswordDisplay();
        }
    }
    
    clearPassword() {
        this.currentPassword = "";
        this.updatePasswordDisplay();
    }
    
    updatePasswordDisplay() {
        const displayElement = document.getElementById('password-display');
        if (displayElement) {
            let display = '';
            for (let i = 0; i < 4; i++) {
                if (i < this.currentPassword.length) {
                    display += '*';
                } else {
                    display += '_';
                }
            }
            displayElement.textContent = display;
        }
    }
    
    checkPassword() {
        console.log('Checking password:', this.currentPassword);
        if (this.currentPassword === this.correctPassword) {
            console.log('Password correct!');
            this.isPasswordCorrect = true;
            
            // Show success message
            const passwordInput = document.getElementById('password-input');
            if (passwordInput) {
                passwordInput.innerHTML = `
                    <div class="success-message">
                        <p>Password correct!</p>
                        <p>The chest is unlocking...</p>
                    </div>
                `;
            }
            
            // Open the chest
            this.openChest();
            
            // Update puzzle state if global variable exists
            if (typeof window.puzzleSolved !== 'undefined') {
                window.puzzleSolved.treasurechest = true;
            }
        } else {
            console.log('Password incorrect!');
            // Show error and reset
            const displayElement = document.getElementById('password-display');
            if (displayElement) {
                displayElement.textContent = 'XXXX';
                setTimeout(() => {
                    this.currentPassword = '';
                    this.updatePasswordDisplay();
                }, 1000);
            }
        }
    }
    
    openChest() {
        this.isChestOpen = true;
        
        if (this.chestOpenAction) {
            // If we have animation, play it
            console.log('Playing chest open animation');
            this.chestOpenAction.reset();
            this.chestOpenAction.play();
        } else if (this.chestAnimationMixer && this.chestAnimationMixer.update) {
            // Otherwise custom animation will be played in update
            console.log('Using custom chest open animation');
        }
    }
    
    handleModelClick(event) {
        if (!this.chestModel) return;
        
        // Calculate mouse position in normalized device coordinates
        const modelContainer = document.getElementById('model-container');
        if (!modelContainer) return;
        
        const rect = modelContainer.getBoundingClientRect();
        const mouse = {
            x: ((event.clientX - rect.left) / modelContainer.offsetWidth) * 2 - 1,
            y: -((event.clientY - rect.top) / modelContainer.offsetHeight) * 2 + 1
        };
        
        // Create raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Get all intersected objects with the paper
        const intersects = raycaster.intersectObject(this.chestModel, true);
        
        if (intersects.length > 0) {
            console.log('Chest clicked!');
            // Check if we hit the paper and chest is open
            if (this.isChestOpen && this.paperModel && 
                (intersects[0].object === this.paperModel || 
                 intersects[0].object.parent === this.paperModel)) {
                
                // Only if paper is interactive
                if (this.paperModel.userData.interactive) {
                    console.log('Paper clicked!');
                    this.movePaper();
                }
            } else if (!this.isChestOpen) {
                // Clicked on chest while closed - show password UI
                console.log('Showing password input from click');
                const passwordInput = document.getElementById('password-input');
                if (passwordInput) {
                    passwordInput.style.display = 'block';
                }
            }
        }
    }
    
    movePaper() {
        if (!this.paperModel) return;
        
        console.log('Moving paper out of chest');
        
        // Animate paper moving up
        const originalPosition = this.paperModel.position.clone();
        const targetPosition = originalPosition.clone().add(new THREE.Vector3(0, 1, 0));
        
        // Simple animation using GSAP if available, otherwise manual animation
        if (typeof gsap !== 'undefined') {
            gsap.to(this.paperModel.position, {
                y: targetPosition.y,
                duration: 1.5,
                ease: "power2.out"
            });
        } else {
            // Manual animation fallback
            const startTime = Date.now();
            const duration = 1500; // 1.5 seconds
            
            const animatePaper = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Simple easing
                const easedProgress = progress * (2 - progress);
                
                this.paperModel.position.y = originalPosition.y + (targetPosition.y - originalPosition.y) * easedProgress;
                
                if (progress < 1) {
                    requestAnimationFrame(animatePaper);
                }
            };
            
            animatePaper();
        }
    }
    
    update() {
        const delta = this.clock.getDelta();
        
        // Update animation mixer if it exists
        if (this.chestAnimationMixer && this.chestAnimationMixer.update) {
            this.chestAnimationMixer.update(delta);
        }
    }
}

// Export the controller class
export { TreasureChestController }; 