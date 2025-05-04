// Global variables
let scene, camera, renderer, controls;
let currentModel = null;
let currentModelName = 'treasurechest';
let light1, light2, light3, directionalLight;
let isWireframe = false;
let loadingManager;
let treasurechestModel, switchesModel, puzzleModel;
let puzzleSolved = {
    treasurechest: false,
    switches: false,
    puzzle: false
};
// Add new variables for chest animation
let chestAnimationMixer = null;
let chestOpenAction = null;
let isChestOpen = false;
let chestLid = null;
let isLidInteractive = false; // Track if lid can be interacted with
let isHoveringLid = false; // Track if mouse is hovering over lid
let originalLidMaterial = null; // Store original lid material
let highlightedLidMaterial = null; // Store highlighted lid material
let hoveredObject = null; // Currently hovered object
let passwordPanel = null; // Reference to password panel
let originalPasswordPanelMaterial = null; // Store original password panel material
let highlightedPasswordPanelMaterial = null; // Store highlighted password panel material
let isHoveringPasswordPanel = false; // Track if mouse is hovering over password panel
// Add new variables for paper movement
let paperObject = null; // Reference to the paper object
let isPaperInteractive = false; // Track if paper can be moved
let isHoveringPaper = false; // Track if mouse is hovering over paper
let originalPaperMaterial = null; // Store original paper material
let highlightedPaperMaterial = null; // Store highlighted paper material
let isDraggingPaper = false; // Track if paper is being dragged
let dragStartMousePosition = null; // Starting mouse position for drag
let dragStartPaperPosition = null; // Starting paper position for drag
let paperOriginalPosition = null; // Original position of paper
let paperMovementLimits = { // Limits for paper movement
    minX: -0.2,
    maxX: 0.2,
    minY: 0,
    maxY: 0.3,
    minZ: -0.2,
    maxZ: 0.2
};

// Sound effect variables
let sounds = {
    keypadClick: null,
    passwordSuccess: null,
    passwordError: null,
    chestOpen: null,
    chestClose: null,
    panelClick: null
};

// Web Audio API context
let audioContext = null;

// Sound effect functions
function loadSounds() {
    try {
        // Initialize Web Audio API
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load existing sound files
        sounds.passwordSuccess = new Audio('sounds/success.mp3');
        sounds.passwordSuccess.volume = 0.05;
        
        sounds.chestOpen = new Audio('sounds/chest-open.mp3');
        sounds.chestOpen.volume = 0.8;
        
        sounds.chestClose = new Audio('sounds/chest-close.mp3');
        sounds.chestClose.volume = 0.8;
        
        // These sounds will be generated with Web Audio API
        sounds.keypadClick = 'keypadClick';
        sounds.passwordError = 'passwordError';
        sounds.panelClick = 'panelClick';
        
        // Preload audio files
        sounds.passwordSuccess.load();
        sounds.chestOpen.load();
        sounds.chestClose.load();
        
        console.log("Sound effects loaded successfully");
    } catch (e) {
        console.error("Error initializing audio:", e);
    }
}

function playSound(soundName) {
    // Check if audio is disabled or context is not available
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Cannot create audio context:", e);
            return;
        }
    }
    
    // For sounds with actual audio files
    if (sounds[soundName] && sounds[soundName] instanceof Audio) {
        // Clone to allow overlapping sounds
        const soundClone = sounds[soundName].cloneNode();
        
        // Set volume before playing
        if (soundName === 'passwordSuccess') {
            soundClone.volume = 0.3; // Very low volume for success sound
        } else if (soundName === 'chestOpen') {
            soundClone.volume = 0.7; // Reduced volume for chest open
        } else if (soundName === 'chestClose') {
            soundClone.volume = 0.7; // Reduced volume for chest close
        }
        
        soundClone.play().catch(e => console.log("Error playing sound:", e));
        return;
    }
    
    // For synthesized sounds
    switch (soundName) {
        case 'keypadClick':
            playClickSound(120, 0.05);
            break;
        case 'passwordError':
            playErrorSound();
            break;
        case 'panelClick':
            playClickSound(80, 0.1);
            break;
    }
}

// Generate a short click/beep sound
function playClickSound(frequency = 160, duration = 0.08) {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Short fade out
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.error("Error playing click sound:", e);
    }
}

// Generate error sound (two descending tones)
function playErrorSound() {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(280, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.error("Error playing error sound:", e);
    }
}

// Loading progress listener
loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = function(item, loaded, total) {
    const progress = (loaded / total) * 100;
    console.log(`Loading: ${progress.toFixed(2)}%`);
};

loadingManager.onLoad = function() {
    console.log('Loading complete!');
    document.querySelector('.loader-wrapper').style.display = 'none';
};

// Initialize function
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    const modelContainer = document.getElementById('model-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(modelContainer.offsetWidth, modelContainer.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    modelContainer.appendChild(renderer.domElement);

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add lights
    light1 = new THREE.PointLight(0xffffff, 1.2);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    light2 = new THREE.PointLight(0xffffff, 0.7);
    light2.position.set(-5, 5, -5);
    scene.add(light2);

    light3 = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(light3);
    
    // Add directional light to better highlight the model
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 5, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Load sounds
    loadSounds();
    
    // Load models
    loadModels();

    // Window resize listener
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();

    // Initialize event listeners
    initEventListeners();
}

// Window resize handler
function onWindowResize() {
    const modelContainer = document.getElementById('model-container');
    camera.aspect = modelContainer.offsetWidth / modelContainer.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(modelContainer.offsetWidth, modelContainer.offsetHeight);
}

// Load all models
function loadModels() {
    const loader = new THREE.GLTFLoader(loadingManager);
    
    // Load treasure chest model
    loader.load('models/treasurechest/treasure_chest.glb', function(gltf) {
        treasurechestModel = gltf.scene;
        treasurechestModel.scale.set(2, 2, 2);
        treasurechestModel.rotation.y = Math.PI / 4;
        
        // Store animations with the model if they exist
        if (gltf.animations && gltf.animations.length > 0) {
            console.log(`Found ${gltf.animations.length} animations in the model`);
            treasurechestModel.animations = gltf.animations;
        }
        
        // Enable shadows for all meshes
        treasurechestModel.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Set as default model
        currentModel = treasurechestModel;
        scene.add(currentModel);
        
        // Debug: Log model structure
        logModelStructure(treasurechestModel);
        
        // Setup interactive parts
        setupTreasureChestInteractions(treasurechestModel);
    });
    
    // Load sequence switches model - placeholder for now
    loader.load('models/treasurechest/treasure_chest.glb', function(gltf) {
        switchesModel = gltf.scene;
        switchesModel.scale.set(2, 2, 2);
        switchesModel.rotation.y = Math.PI / 4;
        
        // Store animations
        if (gltf.animations && gltf.animations.length > 0) {
            switchesModel.animations = gltf.animations;
        }
        
        // Enable shadows for all meshes
        switchesModel.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        setupSwitchesInteractions(switchesModel);
    });
    
    // Load puzzle pieces model - placeholder for now
    loader.load('models/treasurechest/treasure_chest.glb', function(gltf) {
        puzzleModel = gltf.scene;
        puzzleModel.scale.set(2, 2, 2);
        puzzleModel.rotation.y = Math.PI / 4;
        
        // Store animations
        if (gltf.animations && gltf.animations.length > 0) {
            puzzleModel.animations = gltf.animations;
        }
        
        // Enable shadows for all meshes
        puzzleModel.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        setupPuzzleInteractions(puzzleModel);
    });
}

// Debug function to log model structure
function logModelStructure(model) {
    console.log("Model structure:");
    model.traverse(function(object) {
        let prefix = "";
        let parent = object.parent;
        while (parent && parent !== model) {
            prefix += "  ";
            parent = parent.parent;
        }
        console.log(prefix + "- " + object.name + (object.isMesh ? " (Mesh)" : ""));
    });
}

// Switch current model
function switchModel(modelName) {
    // Remove current model from scene
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    // Add new model to scene
    switch(modelName) {
        case 'treasurechest':
            currentModel = treasurechestModel;
            break;
        case 'switches':
            currentModel = switchesModel;
            break;
        case 'puzzle':
            currentModel = puzzleModel;
            break;
    }
    
    if (currentModel) {
        scene.add(currentModel);
        currentModelName = modelName;
        
        // Reset camera position
        camera.position.z = 5;
        controls.update();
    }
}

// Treasure chest interactions setup
function setupTreasureChestInteractions(model) {
    // Debug: log all model parts
    console.log("All model objects:");
    model.traverse(function(child) {
        if (child.isMesh) {
            console.log(`- Object: ${child.name} (Mesh)`);
        } else {
            console.log(`- Object: ${child.name}`);
        }
    });

    let foundLid = false;
    let foundPaper = false;
    
    // First attempt: Find lid and paper by name patterns
    model.traverse(function(child) {
        if (child.isMesh) {
            // Looking for lid in object names
            if (child.name.includes('lid') || 
                child.name.includes('Lid') ||
                child.name.includes('top') || 
                child.name.includes('Top') ||
                child.name.includes('cover') ||
                // From Blender screenshot, check specific names
                child.name.includes('polySurface28.001') ||
                child.name === 'lid' ||
                child.name === 'group1') {
                
                console.log("Found chest lid by name:", child.name);
                chestLid = child;
                foundLid = true;
                
                // Store original rotation to reset if needed
                chestLid.userData.originalRotation = child.rotation.clone();
            }
            
            // Find password panel
            if (child.name.includes('Password') || 
                child.name.includes('password') || 
                child.name.includes('Panel') || 
                child.name.includes('panel') ||
                child.name === 'PasswordPanel' ||
                child.name === 'Password_Mechanism' ||
                child.name === 'polySurface28.001' ||  // Try this as password panel too
                child.name === 'Password_Mechanism_1') {
                
                console.log("Found password panel by name:", child.name);
                markAsPasswordPanel(child);
            }
            
            // Find paper inside the chest
            if (child.name.includes('paper') || 
                child.name.includes('Paper') ||
                child.name === 'paper.002') {
                console.log("Found paper:", child.name);
                paperObject = child;
                foundPaper = true;
                // Paper will become interactive after chest opens
                child.userData.isPaper = true;
            }
        }
    });
    
    // Second attempt: If we didn't find a lid by name, look for objects with position as the lid
    if (!foundLid) {
        console.log("Trying to find lid by position or other attributes...");
        
        // Get the chest's bounding box to find the top portion
        let bbox = new THREE.Box3().setFromObject(model);
        let topY = bbox.max.y - (bbox.max.y - bbox.min.y) * 0.2; // Top 20% of model height
        
        model.traverse(function(child) {
            if (child.isMesh) {
                // Calculate this object's position in local space
                let childBbox = new THREE.Box3().setFromObject(child);
                let childTop = childBbox.max.y;
                
                // If this object is in the top portion of the chest
                if (childTop > topY) {
                    console.log(`Potential lid found by position: ${child.name} at height ${childTop}`);
                    if (!chestLid) {
                        chestLid = child;
                        foundLid = true;
                        chestLid.userData.originalRotation = child.rotation.clone();
                    }
                }
            }
        });
    }
    
    // Third attempt: If we still haven't found the lid, look for specific conditions in the Blender model
    if (!foundLid) {
        console.log("Looking for specific objects in the model...");
        
        // These objects have "lid" in their names according to the screenshot
        const lidObjects = ["The bottom half of the treasure chest", "group1", "lid"];
        
        for (const name of lidObjects) {
            let object = model.getObjectByName(name);
            if (object) {
                console.log(`Found potential lid object: ${name}`);
                chestLid = object;
                foundLid = true;
                break;
            }
        }
    }
    
    // Last resort: Use the first mesh as the lid if we still haven't found one
    if (!foundLid) {
        console.log("Using fallback method to find lid");
        let meshCount = 0;
        
        model.traverse(function(child) {
            if (child.isMesh && !foundLid) {
                meshCount++;
                // Use one of the first few meshes as the lid
                if (meshCount === 1) {  // Try the first mesh
                    console.log("Using first mesh as lid:", child.name);
                    chestLid = child;
                    foundLid = true;
                    chestLid.userData.originalRotation = child.rotation.clone();
                }
            }
        });
    }
    
    // Check if the model has animations
    if (model.animations && model.animations.length > 0) {
        console.log("Found animations in model:", model.animations.length);
        model.animations.forEach((anim, idx) => {
            console.log(`Animation ${idx}: ${anim.name}`);
        });
        
        // Create animation mixer
        chestAnimationMixer = new THREE.AnimationMixer(model);
        
        // Find animation for opening the chest
        const openAnimation = model.animations.find(anim => 
            anim.name.includes('open') || 
            anim.name.includes('Open') || 
            anim.name.includes('lid') ||
            anim.name.includes('Lid')
        );
        
        if (openAnimation) {
            console.log("Found chest open animation:", openAnimation.name);
            chestOpenAction = chestAnimationMixer.clipAction(openAnimation);
        } else if (model.animations.length > 0) {
            console.log("Using first animation as chest open:", model.animations[0].name);
            chestOpenAction = chestAnimationMixer.clipAction(model.animations[0]);
        }
    } else {
        console.log("No animations found in model, will use custom animation");
    }
    
    // If we didn't find paper by name, look for it by other attributes
    if (!foundPaper) {
        console.log("Looking for paper by other attributes...");
        
        // Look for objects that might be papers (thin, flat objects in the bottom of the chest)
        model.traverse(function(child) {
            if (child.isMesh) {
                // Try to identify paper-like objects
                let bbox = new THREE.Box3().setFromObject(child);
                let height = bbox.max.y - bbox.min.y;
                let width = bbox.max.x - bbox.min.x;
                let depth = bbox.max.z - bbox.min.z;
                
                // Paper is typically thin and flat
                if (height < 0.1 && width > 0.1 && depth > 0.1 && !foundPaper) {
                    console.log(`Potential paper found by dimensions: ${child.name}`);
                    paperObject = child;
                    foundPaper = true;
                    child.userData.isPaper = true;
                }
            }
        });
    }
    
    console.log("Treasure chest interactions setup complete");
}

// Helper function to mark an object as a password panel
function markAsPasswordPanel(object) {
    object.userData.clickable = true;
    object.userData.type = "password_panel";
    
    // Store reference to the password panel
    passwordPanel = object;
    
    // Store original material for hover effect
    if (object.material) {
        if (Array.isArray(object.material)) {
            // For multi-material objects
            originalPasswordPanelMaterial = object.material.map(mat => mat.clone());
            
            // Create highlighted version
            highlightedPasswordPanelMaterial = object.material.map(mat => {
                const highlightMat = mat.clone();
                highlightMat.emissive = new THREE.Color(0x553311);  // Orange glow
                highlightMat.emissiveIntensity = 0.5;
                return highlightMat;
            });
        } else {
            // For single material objects
            originalPasswordPanelMaterial = object.material.clone();
            
            // Create highlighted version
            highlightedPasswordPanelMaterial = object.material.clone();
            highlightedPasswordPanelMaterial.emissive = new THREE.Color(0x553311);  // Orange glow
            highlightedPasswordPanelMaterial.emissiveIntensity = 0.5;
        }
    }
}

// Apply highlight to the password panel when hovering
function highlightPasswordPanel(highlight) {
    if (!passwordPanel || !passwordPanel.material || isChestOpen) return;
    
    if (highlight) {
        // Apply highlighted material
        if (Array.isArray(passwordPanel.material) && Array.isArray(highlightedPasswordPanelMaterial)) {
            passwordPanel.material = highlightedPasswordPanelMaterial;
        } else if (!Array.isArray(passwordPanel.material) && !Array.isArray(highlightedPasswordPanelMaterial)) {
            passwordPanel.material = highlightedPasswordPanelMaterial;
        }
    } else {
        // Restore original material
        if (Array.isArray(passwordPanel.material) && Array.isArray(originalPasswordPanelMaterial)) {
            passwordPanel.material = originalPasswordPanelMaterial;
        } else if (!Array.isArray(passwordPanel.material) && !Array.isArray(originalPasswordPanelMaterial)) {
            passwordPanel.material = originalPasswordPanelMaterial;
        }
    }
}

// Sequence switches interactions setup
function setupSwitchesInteractions(model) {
    // Setup sequence switches interaction logic
    // For example, click colored buttons in specific order
    
    console.log("Sequence switches interactions setup complete");
}

// Puzzle pieces interactions setup
function setupPuzzleInteractions(model) {
    // Setup puzzle pieces interaction logic
    // For example, click to rotate pieces to form correct pattern
    
    console.log("Puzzle pieces interactions setup complete");
}

// Handle 3D object click
function onModelClick(event) {
    const modelContainer = document.getElementById('model-container');
    const rect = modelContainer.getBoundingClientRect();
    
    // Calculate mouse position
    const mouse = {
        x: ((event.clientX - rect.left) / modelContainer.offsetWidth) * 2 - 1,
        y: -((event.clientY - rect.top) / modelContainer.offsetHeight) * 2 + 1
    };
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with all objects in the scene that are part of the current model
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log("Clicked on object:", object.name, "Type:", object.userData.type);
        
        // Handle click based on current model type
        switch(currentModelName) {
            case 'treasurechest':
                handleTreasureChestClick(object, mouse);
                break;
            case 'switches':
                handleSwitchesClick(object);
                break;
            case 'puzzle':
                handlePuzzleClick(object);
                break;
        }
    }
}

// Handle treasure chest click
function handleTreasureChestClick(object, mouse) {
    console.log("Clicked treasure chest part: " + object.name);
    console.log("Object data:", object.userData);
    
    // Check if clicked object is the password panel
    if (object.userData.clickable && object.userData.type === "password_panel" && !isChestOpen) {
        console.log("Password panel clicked!");
        playSound('panelClick');
        showPasswordDialog();
    }
    // Check if clicked object is the interactive lid
    else if (object.userData.clickable && object.userData.type === "lid") {
        console.log("Lid clicked! Toggling lid...");
        toggleLid();
    }
    // Check if clicked object is the interactive paper
    else if (object.userData.clickable && object.userData.type === "paper") {
        console.log("Paper clicked! Starting drag...");
        startDraggingPaper(new THREE.Vector2(mouse.x, mouse.y));
    }
    // Special case: if chest is open and lid is interactive, treat clicking anywhere on the model as clicking the lid
    else if (isChestOpen && isLidInteractive && chestLid) {
        console.log("Clicked on chest model while lid is interactive");
        if (object === chestLid || object.parent === chestLid || 
            (chestLid.children && chestLid.children.includes(object))) {
            console.log("Detected click on lid or its children");
            toggleLid();
        }
    }
}

// Show password input dialog
function showPasswordDialog() {
    // Check if password dialog already exists
    let passwordDialog = document.getElementById('password-dialog');
    if (passwordDialog) {
        // If it exists, just show it
        passwordDialog.style.display = 'flex';
        return;
    }
    
    // Create password dialog
    passwordDialog = document.createElement('div');
    passwordDialog.id = 'password-dialog';
    passwordDialog.className = 'password-dialog';
    
    passwordDialog.innerHTML = `
        <div class="password-content">
            <div class="password-header">
                <h3>Treasure Chest</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="password-display">
                <span id="password-display">____</span>
            </div>
            <div class="hint-container" style="text-align: center; margin-bottom: 15px;">
                <button id="hint-btn" style="background: none; border: none; color: #aaa; cursor: pointer;">
                    <i class="fas fa-question-circle"></i> Need a hint?
                </button>
                <p id="hint-text" style="display: none; color: #ff5722; font-size: 0.9rem; margin-top: 5px;">
                    Hint: The simplest combination possible...<br>(Try 1-2-3-4)
                </p>
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
                <button class="clear-btn">Clear</button>
                <button class="digit-btn" data-digit="0">0</button>
                <button class="submit-btn">Submit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(passwordDialog);
    
    // Add event listeners
    setupPasswordDialogEvents();
}

// Set up password dialog event listeners
function setupPasswordDialogEvents() {
    // Close button
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('password-dialog').style.display = 'none';
        });
    }
    
    // Hint button
    const hintBtn = document.getElementById('hint-btn');
    const hintText = document.getElementById('hint-text');
    if (hintBtn && hintText) {
        hintBtn.addEventListener('click', function() {
            playSound('keypadClick');
            if (hintText.style.display === 'none') {
                hintText.style.display = 'block';
            } else {
                hintText.style.display = 'none';
            }
        });
    }
    
    // Digit buttons
    const digitBtns = document.querySelectorAll('.digit-btn');
    digitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            playSound('keypadClick');
            const digit = this.getAttribute('data-digit');
            handleDigitInput(digit);
        });
    });
    
    // Clear button
    const clearBtn = document.querySelector('.clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            playSound('keypadClick');
            clearPassword();
        });
    }
    
    // Submit button
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            playSound('keypadClick');
            checkPassword();
        });
    }
    
    // Keyboard input
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('password-dialog').style.display !== 'none') {
            // Numbers 0-9
            if (e.key >= '0' && e.key <= '9') {
                playSound('keypadClick');
                handleDigitInput(e.key);
            }
            // Enter key
            else if (e.key === 'Enter') {
                playSound('keypadClick');
                checkPassword();
            }
            // Backspace or Escape
            else if (e.key === 'Backspace') {
                playSound('keypadClick');
                clearPassword();
            }
            else if (e.key === 'Escape') {
                document.getElementById('password-dialog').style.display = 'none';
            }
        }
    });
}

// Global password variables
let currentPassword = "";
const correctPassword = "1234"; // Set the correct password

// Handle digit input
function handleDigitInput(digit) {
    if (currentPassword.length < 4) {
        currentPassword += digit;
        updatePasswordDisplay();
    }
}

// Clear password
function clearPassword() {
    currentPassword = "";
    updatePasswordDisplay();
}

// Update password display
function updatePasswordDisplay() {
    const display = document.getElementById('password-display');
    if (display) {
        let displayText = "";
        for (let i = 0; i < 4; i++) {
            if (i < currentPassword.length) {
                displayText += "*";
            } else {
                displayText += "_";
            }
        }
        display.textContent = displayText;
    }
}

// Check if password is correct
function checkPassword() {
    if (currentPassword === correctPassword) {
        // Password correct
        playSound('passwordSuccess');
        
        const passwordDialog = document.getElementById('password-dialog');
        passwordDialog.innerHTML = `
            <div class="password-content">
                <div class="success-message">
                    <h3>Treasure Chest Unlocked!</h3>
                    <p>The chest is opening...</p>
                </div>
            </div>
        `;
        
        // Close dialog after 2 seconds
        setTimeout(function() {
            passwordDialog.style.display = 'none';
            
            // Open the chest
            openChest();
            
            // Mark puzzle as solved
            puzzleSolved.treasurechest = true;
        }, 2000);
        
        console.log("Password correct! Opening chest...");
    } else {
        // Password incorrect
        playSound('passwordError');
        
        const display = document.getElementById('password-display');
        if (display) {
            display.textContent = "XXXX";
            setTimeout(function() {
                currentPassword = "";
                updatePasswordDisplay();
            }, 1000);
        }
    }
}

// Open the chest when password is correct
function openChest() {
    if (isChestOpen) return; // Already open
    
    console.log("Opening chest...");
    playSound('chestOpen');
    
    isChestOpen = true;
    
    // Disable password panel interaction and remove highlight
    if (passwordPanel) {
        passwordPanel.userData.clickable = false;
        
        // Explicitly remove any highlight by restoring original material
        if (passwordPanel.material) {
            if (Array.isArray(passwordPanel.material) && Array.isArray(originalPasswordPanelMaterial)) {
                passwordPanel.material = originalPasswordPanelMaterial.map(mat => mat.clone());
            } else if (!Array.isArray(passwordPanel.material) && !Array.isArray(originalPasswordPanelMaterial)) {
                passwordPanel.material = originalPasswordPanelMaterial.clone();
            }
        }
    }
    
    // Check if we have an animation mixer with the chest open action
    if (chestAnimationMixer && chestOpenAction) {
        console.log("Playing chest open animation from Blender");
        chestOpenAction.reset();
        chestOpenAction.setLoop(THREE.LoopOnce);
        chestOpenAction.clampWhenFinished = true;
        chestOpenAction.timeScale = 1; // Forward
        chestOpenAction.play();
        
        // Make lid interactive after animation completes
        setTimeout(() => {
            makeLidInteractive();
            makePaperInteractive(); // Also make paper interactive once chest is open
        }, chestOpenAction.getClip().duration * 1000);
    } 
    // Otherwise, create a custom rotation animation for the lid
    else if (chestLid) {
        console.log("Using custom lid animation");
        // Use GSAP to animate the lid rotation
        gsap.to(chestLid.rotation, {
            x: -Math.PI / 2, // Rotate 90 degrees backwards
            duration: 2,
            ease: "power2.out",
            onComplete: function() {
                console.log("Chest opened");
                makeLidInteractive();
                makePaperInteractive(); // Also make paper interactive once chest is open
            }
        });
    } else {
        console.warn("No lid found for animation");
    }
}

// Make the lid interactive after chest is unlocked
function makeLidInteractive() {
    if (!chestLid) {
        console.error("No lid found to make interactive!");
        return;
    }
    
    console.log("Making lid interactive:", chestLid.name);
    isLidInteractive = true;
    
    // Mark the lid as interactive so it can be clicked
    chestLid.userData.clickable = true;
    chestLid.userData.type = "lid";
    
    // Store the original material for hover effect
    if (chestLid.material) {
        if (Array.isArray(chestLid.material)) {
            // For multi-material objects, store each original material
            originalLidMaterial = chestLid.material.map(mat => mat.clone());
            
            // Create highlighted version
            highlightedLidMaterial = chestLid.material.map(mat => {
                const highlightMat = mat.clone();
                highlightMat.emissive = new THREE.Color(0x553311);  // Orange glow
                highlightMat.emissiveIntensity = 0.5;
                return highlightMat;
            });
        } else {
            // For single material objects
            originalLidMaterial = chestLid.material.clone();
            
            // Create highlighted version
            highlightedLidMaterial = chestLid.material.clone();
            highlightedLidMaterial.emissive = new THREE.Color(0x553311);  // Orange glow
            highlightedLidMaterial.emissiveIntensity = 0.5;
        }
    }
    
    // No permanent highlight - we'll handle this on hover
    console.log("Lid is now interactive - will highlight on hover");
}

// Apply highlight to the lid when hovering
function highlightLid(highlight) {
    if (!isLidInteractive || !chestLid || !chestLid.material) return;
    
    if (highlight) {
        // Apply highlighted material
        if (Array.isArray(chestLid.material) && Array.isArray(highlightedLidMaterial)) {
            chestLid.material = highlightedLidMaterial;
        } else if (!Array.isArray(chestLid.material) && !Array.isArray(highlightedLidMaterial)) {
            chestLid.material = highlightedLidMaterial;
        }
    } else {
        // Restore original material
        if (Array.isArray(chestLid.material) && Array.isArray(originalLidMaterial)) {
            chestLid.material = originalLidMaterial;
        } else if (!Array.isArray(chestLid.material) && !Array.isArray(originalLidMaterial)) {
            chestLid.material = originalLidMaterial;
        }
    }
}

// Make the paper interactive after chest is opened
function makePaperInteractive() {
    if (!paperObject) {
        console.error("No paper object found to make interactive!");
        return;
    }
    
    console.log("Making paper interactive:", paperObject.name);
    isPaperInteractive = true;
    
    // Store original position for movement limits
    paperOriginalPosition = paperObject.position.clone();
    
    // Mark the paper as interactive
    paperObject.userData.clickable = true;
    paperObject.userData.type = "paper";
    
    // Store original material for hover effect
    if (paperObject.material) {
        if (Array.isArray(paperObject.material)) {
            // For multi-material objects
            originalPaperMaterial = paperObject.material.map(mat => mat.clone());
            
            // Create highlighted version
            highlightedPaperMaterial = paperObject.material.map(mat => {
                const highlightMat = mat.clone();
                highlightMat.emissive = new THREE.Color(0x553311);  // Orange glow
                highlightMat.emissiveIntensity = 0.5;
                return highlightMat;
            });
        } else {
            // For single material objects
            originalPaperMaterial = paperObject.material.clone();
            
            // Create highlighted version
            highlightedPaperMaterial = paperObject.material.clone();
            highlightedPaperMaterial.emissive = new THREE.Color(0x553311);  // Orange glow
            highlightedPaperMaterial.emissiveIntensity = 0.5;
        }
    }
}

// Apply highlight to paper when hovering
function highlightPaper(highlight) {
    if (!isPaperInteractive || !paperObject || !paperObject.material) return;
    
    if (highlight) {
        // Apply highlighted material
        if (Array.isArray(paperObject.material) && Array.isArray(highlightedPaperMaterial)) {
            paperObject.material = highlightedPaperMaterial;
        } else if (!Array.isArray(paperObject.material) && !Array.isArray(highlightedPaperMaterial)) {
            paperObject.material = highlightedPaperMaterial;
        }
    } else {
        // Restore original material
        if (Array.isArray(paperObject.material) && Array.isArray(originalPaperMaterial)) {
            paperObject.material = originalPaperMaterial;
        } else if (!Array.isArray(paperObject.material) && !Array.isArray(originalPaperMaterial)) {
            paperObject.material = originalPaperMaterial;
        }
    }
}

// Handle mouse move for hover effect
function onMouseMove(event) {
    const modelContainer = document.getElementById('model-container');
    const rect = modelContainer.getBoundingClientRect();
    
    // Calculate mouse position
    const mouse = {
        x: ((event.clientX - rect.left) / modelContainer.offsetWidth) * 2 - 1,
        y: -((event.clientY - rect.top) / modelContainer.offsetHeight) * 2 + 1
    };
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with all objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Reset hover states
    let foundLid = false;
    let foundPasswordPanel = false;
    let foundPaper = false;
    
    if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            
            // Check if this is the lid or part of the lid
            if (isLidInteractive && chestLid && (
                object === chestLid || 
                (object.parent && object.parent === chestLid) ||
                (chestLid.children && chestLid.children.includes(object)))) {
                
                foundLid = true;
                hoveredObject = object;
            }
            
            // Check if this is the password panel (only before chest is unlocked)
            if (!isChestOpen && passwordPanel && passwordPanel.userData.clickable && (
                object === passwordPanel || 
                (object.parent && object.parent === passwordPanel) ||
                (passwordPanel.children && passwordPanel.children.includes(object)))) {
                
                foundPasswordPanel = true;
                hoveredObject = object;
            }
            
            // Check if this is the paper (only after chest is unlocked)
            if (isPaperInteractive && paperObject && (
                object === paperObject ||
                (object.parent && object.parent === paperObject) ||
                (paperObject.children && paperObject.children.includes(object)))) {
                
                foundPaper = true;
                hoveredObject = object;
            }
        }
    }
    
    // Update lid hover state if changed
    if (foundLid !== isHoveringLid) {
        isHoveringLid = foundLid;
        highlightLid(isHoveringLid);
    }
    
    // Update password panel hover state if changed
    if (foundPasswordPanel !== isHoveringPasswordPanel) {
        isHoveringPasswordPanel = foundPasswordPanel;
        highlightPasswordPanel(isHoveringPasswordPanel);
    }
    
    // Update paper hover state if changed
    if (foundPaper !== isHoveringPaper) {
        isHoveringPaper = foundPaper;
        highlightPaper(isHoveringPaper);
    }
    
    // Update cursor style
    if (isHoveringLid || isHoveringPasswordPanel || isHoveringPaper) {
        document.body.style.cursor = isDraggingPaper ? 'grabbing' : 'pointer';
    } else {
        document.body.style.cursor = 'default';
    }
    
    // Handle paper dragging
    if (isDraggingPaper && paperObject) {
        movePaperWithMouse(mouse);
    }
}

// Start dragging the paper
function startDraggingPaper(mouse) {
    if (!isPaperInteractive || !paperObject) return;
    
    console.log("Starting paper drag");
    isDraggingPaper = true;
    dragStartMousePosition = mouse.clone();
    dragStartPaperPosition = paperObject.position.clone();
    
    // Change cursor style
    document.body.style.cursor = 'grabbing';
}

// Move paper based on mouse position
function movePaperWithMouse(mouse) {
    if (!isDraggingPaper || !paperObject) return;
    
    // Calculate mouse movement delta from drag start
    const deltaX = (mouse.x - dragStartMousePosition.x) * 0.5; // Scale down for finer control
    const deltaZ = -(mouse.y - dragStartMousePosition.y) * 0.5; // Invert Y for Z movement
    
    // Calculate new position
    const newX = dragStartPaperPosition.x + deltaX;
    const newZ = dragStartPaperPosition.z + deltaZ;
    
    // Apply constraints relative to original position
    paperObject.position.x = Math.max(
        paperOriginalPosition.x + paperMovementLimits.minX,
        Math.min(paperOriginalPosition.x + paperMovementLimits.maxX, newX)
    );
    
    paperObject.position.z = Math.max(
        paperOriginalPosition.z + paperMovementLimits.minZ,
        Math.min(paperOriginalPosition.z + paperMovementLimits.maxZ, newZ)
    );
}

// Stop dragging the paper
function stopDraggingPaper() {
    if (isDraggingPaper) {
        console.log("Stopping paper drag");
        isDraggingPaper = false;
        dragStartMousePosition = null;
        dragStartPaperPosition = null;
        
        // Reset cursor
        document.body.style.cursor = isHoveringPaper ? 'pointer' : 'default';
    }
}

// Toggle the chest lid open/closed when clicked
function toggleLid() {
    if (!isLidInteractive) {
        console.log("Lid is not yet interactive");
        return;
    }
    
    if (!chestLid) {
        console.error("No lid found to toggle!");
        return;
    }
    
    // Toggle state
    isChestOpen = !isChestOpen;
    
    if (isChestOpen) {
        // Open the lid
        console.log("Opening lid");
        playSound('chestOpen');
        
        if (chestAnimationMixer && chestOpenAction) {
            // Play Blender animation forward
            chestOpenAction.reset();
            chestOpenAction.setLoop(THREE.LoopOnce);
            chestOpenAction.clampWhenFinished = true;
            chestOpenAction.timeScale = 1; // Forward
            chestOpenAction.play();
        } else {
            // Use GSAP for custom animation
            gsap.to(chestLid.rotation, {
                x: -Math.PI / 2, // Open position
                duration: 1.5,
                ease: "power2.out"
            });
        }
    } else {
        // Close the lid
        console.log("Closing lid");
        playSound('chestClose');
        
        if (chestAnimationMixer && chestOpenAction) {
            // Play Blender animation in reverse
            chestOpenAction.reset();
            chestOpenAction.setLoop(THREE.LoopOnce);
            chestOpenAction.clampWhenFinished = true;
            chestOpenAction.timeScale = -1; // Reverse direction
            // Set time to end of animation so it plays backward from there
            chestOpenAction.time = chestOpenAction.getClip().duration;
            chestOpenAction.play();
        } else {
            // Use GSAP for custom animation
            gsap.to(chestLid.rotation, {
                x: 0, // Closed position
                duration: 1.5,
                ease: "power2.out"
            });
        }
    }
}

// Handle switches click
function handleSwitchesClick(object) {
    if (object.userData.clickable) {
        console.log("Clicked switch: " + object.name);
        // Add switch sequence logic here
    }
}

// Handle puzzle click
function handlePuzzleClick(object) {
    if (object.userData.clickable) {
        console.log("Clicked puzzle piece: " + object.name);
        // Add puzzle rotation logic here
    }
}

// Toggle wireframe mode
function toggleWireframe() {
    isWireframe = !isWireframe;
    
    if (currentModel) {
        currentModel.traverse(function(child) {
            if (child.isMesh) {
                child.material.wireframe = isWireframe;
            }
        });
    }
}

// Adjust light intensity
function adjustLightIntensity(value) {
    light1.intensity = value * 1.2;
    light2.intensity = value * 0.7;
    directionalLight.intensity = value;
}

// Rotate current model
function rotateModel() {
    if (currentModel) {
        gsap.to(currentModel.rotation, {
            y: currentModel.rotation.y + Math.PI * 2,
            duration: 2,
            ease: "power2.inOut"
        });
    }
}

// Initialize event listeners
function initEventListeners() {
    // Wireframe mode toggle
    document.getElementById('wireframe-toggle').addEventListener('click', toggleWireframe);
    
    // Light intensity adjustment
    document.getElementById('light-intensity').addEventListener('input', function(e) {
        adjustLightIntensity(parseFloat(e.target.value));
    });
    
    // Model rotation
    document.getElementById('rotate-model').addEventListener('click', rotateModel);
    
    // Model switching
    const puzzleItems = document.querySelectorAll('.puzzle-item');
    puzzleItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove all active styles
            puzzleItems.forEach(i => i.classList.remove('active'));
            // Add active style
            this.classList.add('active');
            // Switch model
            switchModel(this.dataset.model);
        });
    });
    
    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', function() {
        camera.position.z = Math.max(2, camera.position.z - 0.5);
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        camera.position.z = Math.min(10, camera.position.z + 0.5);
    });
    
    // 3D model events
    const modelContainer = document.getElementById('model-container');
    
    // Handle mouse clicks
    modelContainer.addEventListener('click', onModelClick);
    
    // Mouse move for hover effects
    modelContainer.addEventListener('mousemove', onMouseMove);
    
    // Mouse up to stop dragging (even if outside the model container)
    document.addEventListener('mouseup', function() {
        stopDraggingPaper();
    });
    
    // Mouse leave to stop dragging if mouse exits the window
    modelContainer.addEventListener('mouseleave', function() {
        if (isDraggingPaper) {
            stopDraggingPaper();
        }
    });
    
    // Light toggle
    document.getElementById('light-toggle').addEventListener('click', function() {
        const intensity = light1.intensity > 0 ? 0 : 1;
        adjustLightIntensity(intensity);
        document.getElementById('light-intensity').value = intensity;
    });
    
    // Start game button
    document.querySelector('.btn-start').addEventListener('click', function() {
        document.getElementById('puzzles').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Explore room button
    document.querySelector('.btn-discover').addEventListener('click', function() {
        document.getElementById('puzzles').scrollIntoView({ behavior: 'smooth' });
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update animation mixer if it exists
    if (chestAnimationMixer) {
        chestAnimationMixer.update(0.016); // Update with approximately 60fps
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Initialize when page is loaded
window.addEventListener('load', init); 