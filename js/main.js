// Global variables
let scene, camera, renderer, controls;
let currentModel = null;
let currentModelName = 'treasurechest';
let light1, light2, light3, directionalLight;
let isWireframe = false;
let loadingManager;
let treasurechestModel, switchesModel, puzzleModel;
let treasureChestInteractions;
let puzzleSolved = {
    treasurechest: false,
    switches: false,
    puzzle: false
};

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
        
        // Setup interactive parts
        setupTreasureChestInteractions(treasurechestModel);
    });
    
    // Load sequence switches model - placeholder for now
    loader.load('models/treasurechest/treasure_chest.glb', function(gltf) {
        switchesModel = gltf.scene;
        switchesModel.scale.set(2, 2, 2);
        switchesModel.rotation.y = Math.PI / 4;
        
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
    // 创建交互控制器实例
    treasureChestInteractions = new TreasureChestInteractions(model, scene, camera);
    console.log("Treasure chest interactions setup complete");
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
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(currentModel.children, true);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Handle click based on current model type
        switch(currentModelName) {
            case 'treasurechest':
                if (treasureChestInteractions) {
                    treasureChestInteractions.handleClick(object);
                } else {
                    handleTreasureChestClick(object);
                }
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
function handleTreasureChestClick(object) {
    // Check if clicked object is an interactive button
    if (object.userData.clickable) {
        console.log("Clicked treasure chest part: " + object.name);
        // Add chest opening logic here
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
    
    // 3D model click
    const modelContainer = document.getElementById('model-container');
    modelContainer.addEventListener('click', onModelClick);
    
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
    controls.update();
    
    // 更新宝箱交互状态
    if (treasureChestInteractions && currentModelName === 'treasurechest') {
        treasureChestInteractions.update();
    }
    
    renderer.render(scene, camera);
}

// Initialize when page is loaded
window.addEventListener('load', init); 