// Global variables
let scene, camera, renderer, controls;
let currentModel = null;
let currentModelName = 'treasurechest';
let light1, light2, light3, directionalLight, sideLight, sunLight;
let isWireframe = false;
let loadingManager;
let treasurechestModel, switchesModel, puzzleModel;
let puzzleSolved = {
    treasurechest: false,
    switches: false,
    puzzle: false
};

// Breathing light effect variables
let centerGoldSphere = null;
let centerGoldOriginalEmissive = null;
let breathingLightActive = false;
let breathingLightIntensity = 0;

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

// Add new variables for note frequencies
const noteFrequencies = {
    C: 261.63,  // Do
    D: 293.66,  // Re
    E: 329.63,  // Mi
    F: 349.23,  // Fa
    G: 392.00,  // Sol
    A: 440.00,  // La
    B: 493.88,  // Ti
    C2: 523.25  // High Do
};

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
    
    // Process note sound effects
    if (soundName.startsWith('note_')) {
        const note = soundName.substring(5); // Get the note part (note_C -> C)
        playNoteSound(note);
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

// Play note sound
function playNoteSound(note = 'C', duration = 0.3) {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Use sine wave to simulate instrument sound
        oscillator.type = 'sine';
        
        // Set note frequency
        const frequency = noteFrequencies[note] || noteFrequencies.C;
        oscillator.frequency.value = frequency;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Fade in and fade out effect
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.error("Error playing note sound:", e);
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
    
    // Add side light to illuminate the treasure chest better
    sideLight = new THREE.SpotLight(0xffa54d, 1.5);
    sideLight.position.set(-8, 2, 0);
    sideLight.angle = Math.PI / 6;
    sideLight.penumbra = 0.3;
    sideLight.castShadow = true;
    sideLight.shadow.mapSize.width = 1024;
    sideLight.shadow.mapSize.height = 1024;
    scene.add(sideLight);
    
    // Add sun light for puzzle model
    sunLight = new THREE.DirectionalLight(0xffffff, 0);  // Initially off (intensity 0)
    sunLight.position.set(0, 20, 5);
    sunLight.castShadow = true;
    // Set up wide shadow camera to cover the entire puzzle
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

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
        treasurechestModel.position.y = -1; // Move the chest slightly downward
        
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
    
    // Load sequence switches model
    loader.load('models/switches/swithches.glb', function(gltf) {
        switchesModel = gltf.scene;
        switchesModel.scale.set(2, 2, 2);
        switchesModel.rotation.y = Math.PI / 4;
        switchesModel.position.set(0, -1, 0); // Adjust position as needed
        
        // Store animations
        if (gltf.animations && gltf.animations.length > 0) {
            switchesModel.animations = gltf.animations;
            console.log(`Found ${gltf.animations.length} animations in the switches model`);
        }
        
        // Enable shadows for all meshes
        switchesModel.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Apply wood material to ButtonBase immediately
                if (child.name === 'ButtonBase') {
                    console.log("Applying wood material to ButtonBase during load");
                    
                    // Create a wood texture material
                    const woodMaterial = new THREE.MeshStandardMaterial({
                        color: 0x3d2314, // Rich dark brown
                        roughness: 0.7,
                        metalness: 0.1
                    });
                    
                    // Create a wood texture loader
                    const textureLoader = new THREE.TextureLoader();
                    
                    // Apply immediate color (texture will load asynchronously)
                    child.material = woodMaterial;
                    
                    // Try to load wood texture
                    textureLoader.load(
                        'https://threejs.org/examples/textures/hardwood2_diffuse.jpg',
                        function(texture) {
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            texture.repeat.set(2, 1);
                            woodMaterial.map = texture;
                            
                            // Also load bump map
                            textureLoader.load(
                                'https://threejs.org/examples/textures/hardwood2_bump.jpg',
                                function(bumpMap) {
                                    bumpMap.wrapS = THREE.RepeatWrapping;
                                    bumpMap.wrapT = THREE.RepeatWrapping;
                                    bumpMap.repeat.set(2, 1);
                                    woodMaterial.bumpMap = bumpMap;
                                    woodMaterial.bumpScale = 0.05;
                                }
                            );
                        }
                    );
                }
            }
        });
        
        // Debug: Log model structure
        console.log("Switches model structure:");
        logModelStructure(switchesModel);
        
        // Hide initially
        switchesModel.visible = false;
        scene.add(switchesModel);
        
        setupSwitchesInteractions(switchesModel);
    }, undefined, function(error) {
        console.error('Error loading switches model:', error);
    });
    
    // Load directional pad puzzle model
    loader.load('models/puzzle/directional_pad_larger_base.glb', function(gltf) {
        puzzleModel = gltf.scene;
        puzzleModel.scale.set(2, 2, 2);
        // Adjust rotation for top-down view
        puzzleModel.rotation.x = Math.PI / 2; // Rotate 90 degrees to make top face up
        puzzleModel.rotation.y = 0;
        puzzleModel.rotation.z = 0;
        
        // Store animations
        if (gltf.animations && gltf.animations.length > 0) {
            puzzleModel.animations = gltf.animations;
        }
        
        // Enable shadows for all meshes and fix materials
        puzzleModel.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                console.log(`Puzzle model part: ${child.name}`);
                
                // Fix materials on load
                if (child.material) {
                    // Ensure material is properly initialized
                    child.material.needsUpdate = true;
                    
                    // Improve material properties
                    if (child.material.metalness !== undefined) {
                        // Prevent excessive reflections by limiting metalness
                        child.material.metalness = Math.min(child.material.metalness, 0.7);
                        child.material.roughness = Math.max(child.material.roughness, 0.3);
                    }
                    
                    // Add emissive glow to directional buttons for better visibility
                    if (child.name.startsWith('arrow_')) {
                        // Get direction from name
                        const direction = child.name.substring(6);
                        
                        // Set different emissive colors based on direction
                        switch(direction) {
                            case 'N':
                                child.material.emissive = new THREE.Color(0x005500); // Green
                                break;
                            case 'S': 
                                child.material.emissive = new THREE.Color(0x550000); // Red
                                break;
                            case 'E':
                                child.material.emissive = new THREE.Color(0x000055); // Blue
                                break;
                            case 'W':
                                child.material.emissive = new THREE.Color(0x555500); // Yellow
                                break;
                            case 'NE':
                            case 'NW':
                            case 'SE':
                            case 'SW':
                                child.material.emissive = new THREE.Color(0x333333); // Grey
                                break;
                        }
                        child.material.emissiveIntensity = 0.3;
                    }
                    
                    // Fix center button's material
                    if (child.name === 'center_gold') {
                        // Ensure the center gold button has good visibility
                        child.material.emissive = new THREE.Color(0x553300);
                        child.material.emissiveIntensity = 0.4;
                        child.material.metalness = 0.8;
                        child.material.roughness = 0.2;
                        child.material.envMapIntensity = 1.5;
                    }
                }
            }
        });
        
        // Hide initially
        puzzleModel.visible = false;
        scene.add(puzzleModel);
        
        setupPuzzleInteractions(puzzleModel);
    }, undefined, function(error) {
        console.error('Error loading puzzle model:', error);
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
    if (currentModelName === modelName) return;
    
    console.log(`Switching model to: ${modelName}`);
    
    // When switching away from switches model, clear color labels
    if (currentModelName === 'switches') {
        document.querySelectorAll('.color-label').forEach(label => {
            label.remove();
        });
    }
    
    // Hide current model
    if (currentModel) {
        currentModel.visible = false;
    }
    
    // Show requested model
    currentModelName = modelName;
    
    // Reset camera and controls
    switch(modelName) {
        case 'treasurechest':
            camera.position.set(0, 0, 5);
            camera.rotation.set(0, 0, 0);
            break;
        case 'switches':
            camera.position.set(0, 0, 5);
            camera.rotation.set(0, 0, 0);
            break;
        case 'puzzle':
            // Set to top-down view
            camera.position.set(0, 0, 8);  // Increase height
            camera.position.y = -3;        // Move back a bit
            camera.lookAt(0, 0, 0);        // Ensure camera is looking at model center
            break;
        default:
            camera.position.set(0, 0, 5);
            camera.rotation.set(0, 0, 0);
    }
    
    controls.reset();
    
    switch(modelName) {
        case 'treasurechest':
            currentModel = treasurechestModel;
            // Reset standard lighting
            light1.position.set(5, 5, 5);
            light2.position.set(-5, 5, -5);
            directionalLight.position.set(0, 5, 10);
            sideLight.position.set(-8, 2, 0);
            
            // Reset intensities
            light1.intensity = 1.2;
            light2.intensity = 0.7;
            light3.intensity = 0.8;
            directionalLight.intensity = 1;
            sideLight.intensity = 1.5;
            
            // Turn off sun light for treasure chest
            sunLight.intensity = 0;
            
            // Deactivate breathing light effect
            breathingLightActive = false;
            break;
            
        case 'switches':
            currentModel = switchesModel;
            // Reset standard lighting
            light1.position.set(5, 5, 5);
            light2.position.set(-5, 5, -5);
            directionalLight.position.set(0, 5, 10);
            sideLight.position.set(-8, 2, 0);
            
            // Reset intensities
            light1.intensity = 1.2;
            light2.intensity = 0.7;
            light3.intensity = 0.8;
            directionalLight.intensity = 1;
            sideLight.intensity = 1.5;
            
            // Turn off sun light for switches
            sunLight.intensity = 0;
            
            // Deactivate breathing light effect
            breathingLightActive = false;
            break;
            
        case 'puzzle':
            currentModel = puzzleModel;
            
            // Adjust light positions for more balanced illumination
            light1.position.set(3, 5, 3); // Lower and adjust position
            light2.position.set(-3, 5, -3); // Lower and adjust position
            directionalLight.position.set(0, 8, 5); // Lower height and increase side angle
            sideLight.position.set(0, 6, -8); // Adjust side light position
            
            // Adjust light intensities for more balanced illumination
            light1.intensity = 0.8; // Reduce intensity
            light2.intensity = 0.8; // Reduce intensity
            light3.intensity = 1.0; // Adjust ambient light
            directionalLight.intensity = 1.0; // Reduce intensity
            sideLight.intensity = 0.6; // Reduce intensity
            
            // Adjust sun position and intensity
            sunLight.position.set(2, 12, 8); // Move sun position to reduce excessive brightness at the top
            sunLight.intensity = 1.2; // Reduce sun intensity
            sunLight.color.set(0xfffaf0); // Maintain warm sunlight color
            
            // Activate breathing light effect for the center gold sphere
            breathingLightActive = true;
            
            // Optimize materials for better visibility
            puzzleModel.traverse(function(child) {
                if (child.isMesh) {
                    // Ensure all materials have proper settings
                    if (child.material) {
                        // Make sure materials respond well to lighting
                        child.material.needsUpdate = true;
                        
                        if (child.material.metalness !== undefined) {
                            // Adjust metalness/roughness for better light reflection
                            child.material.metalness = Math.min(child.material.metalness, 0.7);
                            child.material.roughness = Math.max(child.material.roughness, 0.3);
                        }
                    }
                }
            });
            break;
    }
    
    if (currentModel) {
        currentModel.visible = true;
    }
    
    // Toggle submit button visibility
    const submitContainer = document.getElementById('submit-button-container');
    if (submitContainer) {
        submitContainer.style.display = currentModelName === 'switches' ? 'block' : 'none';
    }
    
    // Update active class on puzzle items
    document.querySelectorAll('.puzzle-item').forEach(item => {
        if (item.dataset.model === modelName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
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
    console.log('Setting up sequence switches interactions');
    
    // Store all button objects
    const buttons = [];
    const buttonSlots = [];
    let buttonBase = null;
    
    // Find all buttons and button slots in the model
    model.traverse((child) => {
        if (child.name && child.name.startsWith('button_') && !child.name.includes('slot')) {
            buttons.push(child);
            console.log(`Found button: ${child.name}`);
        }
        if (child.name && child.name.includes('button_slot')) {
            buttonSlots.push(child);
            console.log(`Found button slot: ${child.name}`);
        }
        if (child.name === 'ButtonBase') {
            buttonBase = child;
            console.log(`Found button base: ${child.name}`);
        }
    });
    
    // Store original materials for all buttons
    const originalButtonMaterials = {};
    buttons.forEach(button => {
        if (button.material) {
            originalButtonMaterials[button.name] = button.material.clone();
        }
    });
    
    // Rainbow colors for buttons (in RGB format)
    const buttonColors = [
        new THREE.Color(1.0, 0.1, 0.1),   // Vibrant red
        new THREE.Color(1.0, 0.5, 0.0),   // Vibrant orange
        new THREE.Color(1.0, 1.0, 0.0),   // Vibrant yellow
        new THREE.Color(0.0, 0.8, 0.0),   // Vibrant green
        new THREE.Color(0.1, 0.4, 1.0),   // Vibrant blue
        new THREE.Color(0.5, 0.0, 0.9),   // Vibrant indigo
        new THREE.Color(0.9, 0.1, 0.9)    // Vibrant purple
    ];
    
    // Color names (for displaying labels)
    const colorNames = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Purple"];
    
    // Current color index for each button (starts at -1 = no color)
    const buttonColorIndices = {};
    buttons.forEach(button => {
        buttonColorIndices[button.name] = -1;
    });
    
    // Add button click handlers
    window.switchesClickHandler = (event) => {
        const intersects = getIntersects(event);
        
        for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            
            // Check if clicked object is a button
            if (object.name && object.name.startsWith('button_') && !object.name.includes('slot')) {
                cycleButtonColor(object);
                playSound('keypadClick');
                break;
            }
        }
    };
    
    // Function to cycle button color
    function cycleButtonColor(button) {
        const currentIndex = buttonColorIndices[button.name];
        const nextIndex = (currentIndex + 1) % 8; // 7 colors + 1 no color
        buttonColorIndices[button.name] = nextIndex;
        
        // Play sound corresponding to the note
        if (nextIndex >= 0 && nextIndex <= 6) {
            // Mapping relationship: red-Do, orange-Re, yellow-Mi, green-Fa, blue-Sol, indigo-La, purple-Ti
            const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            playSound('note_' + notes[nextIndex]);
        } else {
            // Play high Do when no color
            playSound('note_C2');
        }
        
        if (nextIndex === -1 || nextIndex === 7) {
            // Reset to original material (no color)
            if (originalButtonMaterials[button.name]) {
                button.material = originalButtonMaterials[button.name].clone();
            }
        } else {
            // Apply color with enhanced visibility
            const newMaterial = new THREE.MeshStandardMaterial({
                color: buttonColors[nextIndex],
                metalness: 0.8,
                roughness: 0.1,
                emissive: buttonColors[nextIndex],  // Add self-illumination
                emissiveIntensity: 0.3             // Moderate self-illumination intensity
            });
            button.material = newMaterial;
            
            // Get button number for displaying label
            const buttonNumber = parseInt(button.name.split('_')[1]);
            
            // Delete existing label (if any)
            const existingLabel = document.getElementById(`color-label-${buttonNumber}`);
            if (existingLabel) {
                existingLabel.remove();
            }
            
            // Add color name label
            const colorLabel = document.createElement('div');
            colorLabel.id = `color-label-${buttonNumber}`;
            colorLabel.className = 'color-label';
            colorLabel.textContent = colorNames[nextIndex];
            colorLabel.style.position = 'absolute';
            colorLabel.style.color = 'white';
            colorLabel.style.backgroundColor = 'rgba(0,0,0,0.7)';
            colorLabel.style.padding = '2px 5px';
            colorLabel.style.borderRadius = '3px';
            colorLabel.style.fontSize = '12px';
            colorLabel.style.fontWeight = 'bold';
            colorLabel.style.zIndex = '10';
            
            // Calculate label position (based on button count dynamically)
            const buttonCount = buttons.length;
            const modelContainer = document.getElementById('model-container');
            const leftOffset = modelContainer.offsetWidth * 0.1;
            const buttonSpacing = (modelContainer.offsetWidth * 0.8) / (buttonCount - 1);
            const leftPos = leftOffset + buttonNumber * buttonSpacing;
            
            colorLabel.style.bottom = '70px';
            colorLabel.style.left = `${leftPos}px`;
            colorLabel.style.transform = 'translateX(-50%)';
            colorLabel.style.pointerEvents = 'none'; // Prevent interference with clicks
            
            modelContainer.appendChild(colorLabel);
        }
    }
    
    // Function to clear all color labels
    function clearColorLabels() {
        document.querySelectorAll('.color-label').forEach(label => {
            label.remove();
        });
    }
    
    // Create and add submit button to the scene
    createSubmitButton();
    
    function createSubmitButton() {
        // Create submit button container
        const submitContainer = document.createElement('div');
        submitContainer.id = 'submit-button-container';
        submitContainer.style.position = 'absolute';
        submitContainer.style.bottom = '20px';
        submitContainer.style.left = '50%';
        submitContainer.style.transform = 'translateX(-50%)';
        submitContainer.style.display = currentModelName === 'switches' ? 'block' : 'none';
        
        // Create submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit Sequence';
        submitButton.className = 'submit-button';
        submitButton.style.padding = '10px 20px';
        submitButton.style.backgroundColor = '#2c3e50';
        submitButton.style.color = 'white';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '5px';
        submitButton.style.cursor = 'pointer';
        submitButton.style.fontSize = '16px';
        submitButton.style.fontWeight = 'bold';
        submitButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        // Add hover effect
        submitButton.onmouseover = () => {
            submitButton.style.backgroundColor = '#34495e';
        };
        submitButton.onmouseout = () => {
            submitButton.style.backgroundColor = '#2c3e50';
        };
        
        // Add click event for submission
        submitButton.onclick = checkSequence;
        
        // Add button to container
        submitContainer.appendChild(submitButton);
        
        // Add container to document
        document.getElementById('model-container').appendChild(submitContainer);
    }
    
    // Function to check if sequence is correct
    function checkSequence() {
        // The correct sequence is the rainbow order (red, orange, yellow, green, blue, indigo, purple)
        const correctSequence = [0, 1, 2, 3, 4, 5, 6]; // Indices of colors in order
        
        // Get current sequence from buttons
        const currentSequence = [];
        for (let i = 0; i < buttons.length; i++) {
            const buttonName = `button_${i}`;
            const colorIndex = buttonColorIndices[buttonName];
            if (colorIndex >= 0 && colorIndex <= 6) {
                currentSequence.push(colorIndex);
            } else {
                // If any button is not set, consider it incorrect
                showResult(false, 'All buttons must have a color assigned!');
                return;
            }
        }
        
        // Check if sequence matches
        let isCorrect = true;
        for (let i = 0; i < correctSequence.length; i++) {
            if (i >= currentSequence.length || currentSequence[i] !== correctSequence[i]) {
                isCorrect = false;
                break;
            }
        }
        
        showResult(isCorrect);
        
        if (isCorrect) {
            puzzleSolved.switches = true;
            
            // Play successful sequence
            playSuccessfulSequence();
            
            // Display clue for next puzzle after 3 seconds
            setTimeout(() => {
                showClueForNextPuzzle();
            }, 3000);
            
            // If puzzle is solved, remove labels after 6 seconds
            setTimeout(() => {
                clearColorLabels();
            }, 6000);
        } else {
            playSound('passwordError');
        }
    }
    
    // Add function to play successful sequence
    function playSuccessfulSequence() {
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
        let delay = 0;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                playNoteSound(note, 0.3);
            }, delay);
            delay += 250; // Each note plays 250ms after the previous
        });
    }

    // Function to show result message
    function showResult(isCorrect, message = null) {
        // Remove any existing message
        const existingMessage = document.getElementById('sequence-result');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create result message
        const resultMessage = document.createElement('div');
        resultMessage.id = 'sequence-result';
        resultMessage.style.position = 'absolute';
        resultMessage.style.top = '20px';
        resultMessage.style.left = '50%';
        resultMessage.style.transform = 'translateX(-50%)';
        resultMessage.style.padding = '10px 20px';
        resultMessage.style.borderRadius = '5px';
        resultMessage.style.color = 'white';
        resultMessage.style.fontWeight = 'bold';
        resultMessage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        resultMessage.style.zIndex = '1000';
        
        if (isCorrect) {
            resultMessage.style.backgroundColor = '#27ae60';
            resultMessage.textContent = 'Correct sequence! Puzzle solved!';
        } else {
            resultMessage.style.backgroundColor = '#c0392b';
            resultMessage.textContent = message || 'Incorrect sequence! Try again.';
        }
        
        // Add message to container
        document.getElementById('model-container').appendChild(resultMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (document.getElementById('sequence-result')) {
                document.getElementById('sequence-result').remove();
            }
        }, 3000);
    }
}

// Helper function to get intersects from mouse event
function getIntersects(event) {
    // Get mouse position
    const modelContainer = document.getElementById('model-container');
    const rect = modelContainer.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / modelContainer.offsetWidth) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / modelContainer.offsetHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    return raycaster.intersectObjects(scene.children, true);
}

// Puzzle pieces interactions setup
function setupPuzzleInteractions(model) {
    console.log("Setting up directional pad puzzle interactions");
    
    // Store references to all interactive parts
    let arrowButtons = [];
    let buttonBases = [];
    let centerGold = null;
    let centerBase = null;
    
    // Find all buttons in the model
    model.traverse((child) => {
        if (child.isMesh) {
            console.log(`Found mesh in puzzle: ${child.name}`);
            
            // Store arrow buttons
            if (child.name.startsWith('arrow_')) {
                arrowButtons.push(child);
                child.userData.isArrow = true;
                child.userData.direction = child.name.substring(6); // Extract "N", "NE", etc.
                console.log(`Found arrow button: ${child.name}, direction: ${child.userData.direction}`);
            }
            
            // Store button bases
            if (child.name.startsWith('button_')) {
                buttonBases.push(child);
                child.userData.isButtonBase = true;
                child.userData.direction = child.name.substring(7); // Extract "N", "NE", etc.
                console.log(`Found button base: ${child.name}, direction: ${child.userData.direction}`);
                
                // Make the base clickable as well so the user doesn't have to click the small arrow only
                child.userData.clickable = true;
            }
            
            // Store center gold button
            if (child.name === 'center_gold') {
                centerGold = child;
                centerGoldSphere = child; // Store globally for breathing effect
                centerGold.userData.isCenterGold = true;
                console.log('Found center gold button');
                
                // Save original emissive color for breathing effect
                if (child.material) {
                    centerGoldOriginalEmissive = child.material.emissive.clone();
                }
            }
            
            // Store center base
            if (child.name === 'center_base') {
                centerBase = child;
                centerBase.userData.isCenterBase = true;
                console.log('Found center base');
            }
            
            // Make all buttons clickable
            if (child.name.startsWith('arrow_') || child.name === 'center_gold') {
                child.userData.clickable = true;
            }
        }
    });
    
    // Store original positions for animation
    arrowButtons.forEach(button => {
        button.userData.originalPosition = button.position.clone();
    });
    
    if (centerGold) {
        centerGold.userData.originalPosition = centerGold.position.clone();
    }
    
    // Store button state
    const buttonState = {};
    arrowButtons.forEach(button => {
        const direction = button.userData.direction;
        buttonState[direction] = {
            pressed: false,
            highlightMaterial: null,
            originalMaterial: button.material ? button.material.clone() : null
        };
    });
    
    // Create center button state
    if (centerGold) {
        buttonState['center'] = {
            pressed: false,
            highlightMaterial: null,
            originalMaterial: centerGold.material ? centerGold.material.clone() : null
        };
    }
    
    // Create highlight materials for buttons
    arrowButtons.forEach(button => {
        const direction = button.userData.direction;
        if (button.material) {
            // Clone original material
            buttonState[direction].originalMaterial = button.material.clone();
            
            // Create highlighted version (brighter, with emissive glow)
            const highlightMaterial = button.material.clone();
            highlightMaterial.emissive = new THREE.Color(0x333333);
            highlightMaterial.emissiveIntensity = 0.5;
            buttonState[direction].highlightMaterial = highlightMaterial;
        }
    });
    
    if (centerGold && centerGold.material) {
        // Clone original material for center gold
        buttonState['center'].originalMaterial = centerGold.material.clone();
        
        // Create highlighted version (brighter, with emissive glow)
        const highlightMaterial = centerGold.material.clone();
        highlightMaterial.emissive = new THREE.Color(0xffaa00);
        highlightMaterial.emissiveIntensity = 0.5;
        buttonState['center'].highlightMaterial = highlightMaterial;
    }
    
    // Track sequence of pressed buttons
    const pressedSequence = [];
    
    // The correct sequence (clockwise from North)
    const correctSequence = ['N', 'E', 'S', 'W', 'NE', 'SE', 'SW', 'NW', 'center'];
    
    // Create the click handler function
    window.puzzleClickHandler = (event) => {
        const intersects = getIntersects(event);
        
        for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            
            // Check if clicked object is an arrow button or center gold
            if (object.userData.clickable) {
                console.log(`Clicked on puzzle button: ${object.name}`);
                
                if (object.userData.isArrow || object.userData.isButtonBase) {
                    const direction = object.userData.direction;
                    
                    // Play a sound based on the direction
                    // We'll map directions to notes in the scale
                    const soundMap = {
                        'N': 'note_C',     // Do
                        'NE': 'note_D',    // Re
                        'E': 'note_E',     // Mi
                        'SE': 'note_F',    // Fa
                        'S': 'note_G',     // Sol
                        'SW': 'note_A',    // La
                        'W': 'note_B',     // Ti
                        'NW': 'note_C2'    // High Do
                    };
                    const sound = soundMap[direction] || 'keypadClick';
                    playSound(sound);
                    
                    // Animate button press on the arrow mesh itself if we clicked the base
                    const targetObject = object.userData.isArrow ? object : arrowButtons.find(btn => btn.userData.direction === direction);
                    if (targetObject) {
                        animateButtonPress(targetObject);
                    }
                    
                    // Record in sequence
                    pressedSequence.push(direction);
                    
                } else if (object.userData.isCenterGold) {
                    // Center gold button acts as submit/check button
                    playSound('panelClick');
                    animateButtonPress(object);
                    
                    // Add center to sequence
                    pressedSequence.push('center');
                    
                    // Check if the sequence is correct
                    setTimeout(() => {
                        checkPuzzleSequence(pressedSequence, correctSequence);
                    }, 500);
                }
                
                break;
            }
        }
    };
    
    // Function to animate button press
    function animateButtonPress(button) {
        // Store original position if not already stored
        if (!button.userData.originalPosition) {
            button.userData.originalPosition = button.position.clone();
        }
        
        // Move button down based on camera angle
        let direction;
        if (currentModelName === 'puzzle') {
            // In top-down view, button should move down (model has been rotated 90 degrees)
            direction = new THREE.Vector3(0, -1, 0);
        } else {
            // Default direction (z-axis)
            direction = new THREE.Vector3(0, 0, -1);
        }
        
        // Move button down
        const downPosition = button.position.clone().add(direction.multiplyScalar(0.05));
        
        // Use GSAP for smooth animation
        gsap.to(button.position, {
            x: downPosition.x,
            y: downPosition.y,
            z: downPosition.z,
            duration: 0.1,
            ease: "power1.inOut",
            onComplete: function() {
                // Move button back up
                gsap.to(button.position, {
                    x: button.userData.originalPosition.x,
                    y: button.userData.originalPosition.y,
                    z: button.userData.originalPosition.z,
                    duration: 0.1,
                    ease: "power1.out"
                });
            }
        });
        
        // Apply highlight material
        const buttonName = button.userData.isArrow ? button.userData.direction : 'center';
        if (buttonState[buttonName] && buttonState[buttonName].highlightMaterial) {
            const originalMaterial = button.material;
            button.material = buttonState[buttonName].highlightMaterial;
            
            // Restore original material after a delay
            setTimeout(() => {
                button.material = originalMaterial;
            }, 300);
        }
    }
    
    // Function to check if the sequence is correct
    function checkPuzzleSequence(pressed, correct) {
        console.log("Checking sequence:", pressed);
        console.log("Correct sequence:", correct);
        
        // Check if the pressed sequence matches the correct sequence
        let isCorrect = true;
        if (pressed.length !== correct.length) {
            isCorrect = false;
        } else {
            for (let i = 0; i < pressed.length; i++) {
                if (pressed[i] !== correct[i]) {
                    isCorrect = false;
                    break;
                }
            }
        }
        
        if (isCorrect) {
            console.log("Puzzle solved! Correct sequence!");
            puzzleSolved.puzzle = true;
            
            // First show the success message
            showSuccessMessage();
            
            // Play success sounds and animation
            playSuccessfulSequence();
            
            // Show the third level congratulations popup with a longer delay to ensure the success message is seen first
            setTimeout(() => {
                showThirdLevelSuccess();
            }, 2000);
            
            // Trigger any additional success effects or rewards
            setTimeout(() => {
                // If all puzzles are solved, you could trigger a final success event
                if (puzzleSolved.treasurechest && puzzleSolved.switches && puzzleSolved.puzzle) {
                    console.log("All puzzles solved! Game complete!");
                    setTimeout(() => {
                        showFinalSuccess();
                    }, 2000); // Delay the final success to give time to see the third level success
                }
            }, 4000);
        } else {
            console.log("Incorrect sequence! Try again.");
            playSound('passwordError');
            showErrorMessage();
            
            // Reset the sequence
            pressedSequence.length = 0;
        }
    }
    
    // Function to show success message
    function showSuccessMessage() {
        // Remove any existing message
        const existingMessage = document.getElementById('puzzle-result');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create result message
        const resultMessage = document.createElement('div');
        resultMessage.id = 'puzzle-result';
        resultMessage.style.position = 'absolute';
        resultMessage.style.top = '50%';
        resultMessage.style.left = '50%';
        resultMessage.style.transform = 'translate(-50%, -50%)';
        resultMessage.style.padding = '25px 40px';
        resultMessage.style.borderRadius = '8px';
        resultMessage.style.color = 'white';
        resultMessage.style.fontWeight = 'bold';
        resultMessage.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        resultMessage.style.zIndex = '5000';
        resultMessage.style.backgroundColor = '#27ae60';
        resultMessage.style.fontSize = '28px';
        resultMessage.style.textAlign = 'center';
        resultMessage.style.opacity = '0';
        resultMessage.style.transition = 'opacity 0.5s ease';
        resultMessage.textContent = 'Congratulations — you’ve escaped the room!';
        
        // Add message to container
        document.getElementById('model-container').appendChild(resultMessage);
        
        // Fade in the message
        setTimeout(() => {
            resultMessage.style.opacity = '1';
        }, 50);
        
        // Show success message for longer (5 seconds)
        setTimeout(() => {
            if (document.getElementById('puzzle-result')) {
                const message = document.getElementById('puzzle-result');
                message.style.opacity = '0';
                message.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (message) message.remove();
                }, 500);
            }
        }, 5000);

        // Also play a success sound
        playSound('passwordSuccess');
    }
    
    // Function to show error message
    function showErrorMessage() {
        // Remove any existing message
        const existingMessage = document.getElementById('puzzle-result');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create result message
        const resultMessage = document.createElement('div');
        resultMessage.id = 'puzzle-result';
        resultMessage.style.position = 'absolute';
        resultMessage.style.top = '20px';
        resultMessage.style.left = '50%';
        resultMessage.style.transform = 'translateX(-50%)';
        resultMessage.style.padding = '10px 20px';
        resultMessage.style.borderRadius = '5px';
        resultMessage.style.color = 'white';
        resultMessage.style.fontWeight = 'bold';
        resultMessage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        resultMessage.style.zIndex = '1000';
        resultMessage.style.backgroundColor = '#c0392b';
        resultMessage.textContent = 'Incorrect sequence! Try again.';
        
        // Add message to container
        document.getElementById('model-container').appendChild(resultMessage);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            if (document.getElementById('puzzle-result')) {
                document.getElementById('puzzle-result').remove();
            }
        }, 3000);
    }
    
    // Function to show final success when all puzzles are solved
    function showFinalSuccess() {
        // Create a full-screen overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.transition = 'opacity 1s ease-in-out';
        overlay.style.opacity = '0';
        
        // Add success message
        const message = document.createElement('h1');
        message.textContent = 'CONGRATULATIONS!';
        message.style.color = '#ffd700';
        message.style.fontSize = '48px';
        message.style.marginBottom = '20px';
        message.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.7)';
        overlay.appendChild(message);
        
        // Add sub-message
        const subMessage = document.createElement('h2');
        subMessage.textContent = 'You\'ve successfully escaped the room!';
        subMessage.style.color = 'white';
        subMessage.style.fontSize = '24px';
        subMessage.style.marginBottom = '40px';
        overlay.appendChild(subMessage);
        
        // Add replay button
        const replayButton = document.createElement('button');
        replayButton.textContent = 'PLAY AGAIN';
        replayButton.style.padding = '15px 30px';
        replayButton.style.fontSize = '18px';
        replayButton.style.backgroundColor = '#3498db';
        replayButton.style.color = 'white';
        replayButton.style.border = 'none';
        replayButton.style.borderRadius = '5px';
        replayButton.style.cursor = 'pointer';
        replayButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        replayButton.style.transition = 'all 0.3s ease';
        replayButton.addEventListener('mouseover', () => {
            replayButton.style.backgroundColor = '#2980b9';
            replayButton.style.transform = 'scale(1.05)';
        });
        replayButton.addEventListener('mouseout', () => {
            replayButton.style.backgroundColor = '#3498db';
            replayButton.style.transform = 'scale(1)';
        });
        replayButton.addEventListener('click', () => {
            window.location.reload();
        });
        overlay.appendChild(replayButton);
        
        // Add to page
        document.body.appendChild(overlay);
        
        // Fade in
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 100);
    }
    
    console.log("Directional pad puzzle interactions setup complete");
}

// Handle 3D object click
function onModelClick(event) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const modelContainer = document.getElementById('model-container');
    const rect = modelContainer.getBoundingClientRect();
    const mouse = {
        x: ((event.clientX - rect.left) / modelContainer.offsetWidth) * 2 - 1,
        y: -((event.clientY - rect.top) / modelContainer.offsetHeight) * 2 + 1
    };

    // Update the picking ray with the camera and mouse position
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log('Clicked on:', object.name);

        // Handle interactions based on the current model
        switch (currentModelName) {
            case 'treasurechest':
                handleTreasureChestClick(object, mouse);
                break;
            case 'switches':
                if (window.switchesClickHandler) {
                    window.switchesClickHandler(event);
                } else {
                    console.log('Switches click handler not initialized');
                }
                break;
            case 'puzzle':
                if (window.puzzleClickHandler) {
                    window.puzzleClickHandler(event);
                } else {
                    console.log('Puzzle click handler not initialized');
                }
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
    // This function is now handled through the switchesClickHandler
    console.log('Using switchesClickHandler for button interactions');
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
    
    // Update breathing light effect on center gold sphere
    if (breathingLightActive && centerGoldSphere && centerGoldSphere.material) {
        // Use a sine wave for smooth breathing effect
        const pulseValue = Math.sin(Date.now() * 0.003) * 0.5 + 0.5; // Value between 0 and 1
        const pulseColor = new THREE.Color(0xffaa00); // Golden orange glow
        
        // Update the emissive color and intensity
        centerGoldSphere.material.emissive.copy(pulseColor);
        centerGoldSphere.material.emissiveIntensity = pulseValue * 0.7 + 0.3; // Value between 0.3 and 1.0
    } else if (!breathingLightActive && centerGoldSphere && centerGoldSphere.material && centerGoldOriginalEmissive) {
        // Reset to original emissive when not active
        centerGoldSphere.material.emissive.copy(centerGoldOriginalEmissive);
        centerGoldSphere.material.emissiveIntensity = 0.4; // Reset to original
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Initialize when page is loaded
window.addEventListener('load', init);

// Add a function to display the clue for the next puzzle
function showClueForNextPuzzle() {
    // Create clue container
    const clueContainer = document.createElement('div');
    clueContainer.id = 'puzzle-clue';
    clueContainer.className = 'puzzle-clue';
    clueContainer.style.position = 'absolute';
    clueContainer.style.top = '50%';
    clueContainer.style.left = '50%';
    clueContainer.style.transform = 'translate(-50%, -50%)';
    clueContainer.style.padding = '20px';
    clueContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    clueContainer.style.borderRadius = '10px';
    clueContainer.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
    clueContainer.style.color = 'white';
    clueContainer.style.fontFamily = 'monospace';
    clueContainer.style.fontSize = '18px';
    clueContainer.style.textAlign = 'center';
    clueContainer.style.zIndex = '2000';
    clueContainer.style.opacity = '0';
    clueContainer.style.transition = 'opacity 1s ease-in-out';
    

    clueContainer.innerHTML = `
        <h3 style="color: #ffcc00; margin-bottom: 15px;">Puzzle 3 Pattern Revealed</h3>
        <div style="margin: 10px auto; width: 200px; display: grid; grid-template-columns: repeat(3, 1fr); grid-gap: 10px;">
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(0deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(90deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(180deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(270deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(45deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(135deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(225deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: #444; transform: rotate(315deg);">↑</div>
            <div style="width: 50px; height: 50px; background-color: gold; border-radius: 50%;">&nbsp;</div>
        </div>
        <p style="margin-top: 15px; color: #aaa;">Remember this pattern for the final puzzle!</p>
        <button id="close-clue" style="margin-top: 15px; padding: 8px 15px; background: #444; border: none; color: white; border-radius: 5px; cursor: pointer;">Close</button>
    `;
    
    // Add to DOM
    document.getElementById('model-container').appendChild(clueContainer);
    
    // Add close button event
    setTimeout(() => {
        document.getElementById('close-clue').addEventListener('click', function() {
            clueContainer.style.opacity = '0';
            setTimeout(() => {
                clueContainer.remove();
            }, 1000);
        });
    }, 100);
    
    // Display clue
    setTimeout(() => {
        clueContainer.style.opacity = '1';
    }, 100);
    
    // Record that the player has received the clue
    localStorage.setItem('puzzle2_clue_revealed', 'true');
}

// Add function to show third level success popup specifically for the directional pad puzzle
function showThirdLevelSuccess() {
    console.log("Showing third level success popup");
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'third-level-success';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000'; // Ensure this is higher than other elements
    overlay.style.transition = 'opacity 0.5s ease-in-out';
    overlay.style.opacity = '0';
    
    // Create success message container
    const messageContainer = document.createElement('div');
    messageContainer.style.backgroundColor = '#1a1a1a';
    messageContainer.style.borderRadius = '10px';
    messageContainer.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
    messageContainer.style.padding = '30px';
    messageContainer.style.maxWidth = '500px';
    messageContainer.style.textAlign = 'center';
    
    // Create congratulations title
    const title = document.createElement('h2');
    title.textContent = 'Congratulations!';
    title.style.color = '#ffd700';
    title.style.fontSize = '36px';
    title.style.marginBottom = '20px';
    title.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
    messageContainer.appendChild(title);
    
    // Create success message
    const message = document.createElement('p');
    message.textContent = 'You have successfully solved the third puzzle and escaped from the chamber!';
    message.style.color = 'white';
    message.style.fontSize = '18px';
    message.style.lineHeight = '1.5';
    message.style.marginBottom = '25px';
    messageContainer.appendChild(message);
    
    // Create continue button
    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue';
    continueButton.style.padding = '12px 30px';
    continueButton.style.fontSize = '16px';
    continueButton.style.backgroundColor = '#ffd700';
    continueButton.style.color = '#1a1a1a';
    continueButton.style.border = 'none';
    continueButton.style.borderRadius = '5px';
    continueButton.style.cursor = 'pointer';
    continueButton.style.fontWeight = 'bold';
    continueButton.style.transition = 'all 0.2s ease';
    continueButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    // Add hover effects
    continueButton.addEventListener('mouseover', () => {
        continueButton.style.backgroundColor = '#ffeb3b';
        continueButton.style.transform = 'scale(1.05)';
    });
    continueButton.addEventListener('mouseout', () => {
        continueButton.style.backgroundColor = '#ffd700';
        continueButton.style.transform = 'scale(1)';
    });
    
    // Add click handler to close the popup
    continueButton.addEventListener('click', () => {
        gsap.to(overlay, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                overlay.remove();
            }
        });
    });
    
    messageContainer.appendChild(continueButton);
    overlay.appendChild(messageContainer);
    document.body.appendChild(overlay);
    
    // Show the overlay with animation (with a slight delay to ensure it renders properly)
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 100);
    
    // Add particles/confetti effect for celebration
    createConfetti(overlay);
}

// Function to create confetti effect for the success popup
function createConfetti(parent) {
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '-1';
    parent.appendChild(confettiContainer);
    
    // Create multiple confetti particles
    const colors = ['#ffd700', '#ff5722', '#2196f3', '#4caf50', '#9c27b0', '#e91e63'];
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 10 + 5;
        
        particle.style.position = 'absolute';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        particle.style.top = '-20px';
        particle.style.left = `${Math.random() * 100}%`;
        confettiContainer.appendChild(particle);
        
        // Random rotation and floating animation using GSAP
        gsap.to(particle, {
            y: `${window.innerHeight + 20}px`,
            x: `+=${(Math.random() * 200) - 100}px`,
            rotation: Math.random() * 360,
            duration: Math.random() * 3 + 2,
            ease: 'power1.out',
            delay: Math.random() * 2,
            onComplete: () => {
                particle.remove();
            }
        });
    }
} 