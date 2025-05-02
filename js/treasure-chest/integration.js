// Treasure Chest Model Integration
import { TreasureChestController } from './chest-controller.js';

// Integrate the treasure chest into the existing Lockbox Code section
(function() {
    // Make sure we can access the scene variables
    let isInitialized = false;
    let treasureChestController = null;
    
    // Execute when page is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Ensure chest CSS styles are loaded
        loadCSS();
        
        // Make sure the init function is called first
        if (typeof init === 'function' && !isInitialized) {
            // This ensures the 3D scene exists before we try to use it
            init();
            isInitialized = true;
        }
        
        // Listen for Lockbox option click events
        const lockboxPuzzleItem = document.querySelector('.puzzle-item[data-model="lockbox"]');
        if (lockboxPuzzleItem) {
            // Replace default lockbox loading logic
            const originalClick = lockboxPuzzleItem.onclick;
            lockboxPuzzleItem.onclick = function(e) {
                // Call original click handler if it exists
                if (originalClick) originalClick.call(this, e);
                
                // When Lockbox is clicked, replace with treasure chest model
                setTimeout(replaceWithTreasureChest, 200);
            };
            
            // If Lockbox is active by default, also replace immediately
            if (lockboxPuzzleItem.classList.contains('active')) {
                // Wait a short time to ensure scene is fully initialized
                setTimeout(replaceWithTreasureChest, 500);
            }
        }
    });
    
    // Load CSS styles
    function loadCSS() {
        // Check if already loaded
        if (document.querySelector('link[href="js/treasure-chest/chest-styles.css"]')) {
            return;
        }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'js/treasure-chest/chest-styles.css';
        document.head.appendChild(link);
    }
    
    // Replace with treasure chest model
    function replaceWithTreasureChest() {
        console.log("Replacing with treasure chest...");
        
        // Check if the scene variables are available in window/global scope
        if (!window.scene) {
            console.error("Scene variable not found in global scope");
            return;
        }
        
        // Get necessary elements
        const modelContainer = document.getElementById('model-container');
        if (!modelContainer) {
            console.error("Model container not found");
            return;
        }
        
        console.log("Model container found:", modelContainer);
        
        // Check if we already have a treasure chest controller
        if (treasureChestController) {
            console.log("Treasure chest controller already exists");
            return;
        }
        
        // Clear existing content
        const existingPasswordUI = document.getElementById('password-display');
        if (existingPasswordUI) existingPasswordUI.remove();
        
        const existingNumberPad = document.getElementById('number-pad');
        if (existingNumberPad) existingNumberPad.remove();
        
        // Create chest content container
        let lockboxContent = document.querySelector('.lockbox-code-content');
        if (!lockboxContent) {
            lockboxContent = document.createElement('div');
            lockboxContent.className = 'lockbox-code-content';
            modelContainer.appendChild(lockboxContent);
        }
        
        // Log current scene state for debugging
        console.log("Scene available:", typeof scene !== 'undefined');
        console.log("Renderer available:", typeof renderer !== 'undefined');
        console.log("Camera available:", typeof camera !== 'undefined');
        console.log("Controls available:", typeof controls !== 'undefined');
        
        // Check if variables exist
        if (typeof scene !== 'undefined' && 
            typeof renderer !== 'undefined' && 
            typeof camera !== 'undefined' && 
            typeof controls !== 'undefined') {
            
            console.log("All required variables found, initializing controller");
            
            try {
                // Save existing references first
                const originalCurrentModel = window.currentModel;
                const originalModelName = window.currentModelName;
                
                // Clear existing model if it exists to avoid conflicts
                if (typeof originalCurrentModel !== 'undefined' && originalCurrentModel) {
                    scene.remove(originalCurrentModel);
                }
                
                // Initialize chest controller
                treasureChestController = new TreasureChestController(scene, renderer, camera, controls);
                
                // Add to animation loop
                if (typeof animate === 'function') {
                    // Save original animate function
                    const originalAnimate = animate;
                    
                    // Rewrite animate function to include chest updates
                    window.animate = function() {
                        // Call original animation
                        originalAnimate();
                        
                        // Update chest animations
                        if (treasureChestController) {
                            treasureChestController.update();
                        }
                    };
                    
                    // If animation isn't running already, start it
                    if (typeof window.animationId === 'undefined' || !window.animationId) {
                        animate();
                    }
                } else {
                    console.warn('Could not find animate function, chest animations may not update correctly');
                    
                    // Create a minimal animation loop just for the chest
                    const chestAnimate = function() {
                        if (treasureChestController) {
                            treasureChestController.update();
                        }
                        requestAnimationFrame(chestAnimate);
                    };
                    
                    chestAnimate();
                }
                
                // Set global variables
                window.treasureChestController = treasureChestController;
                
                // Update current model
                if (typeof currentModelName !== 'undefined') {
                    currentModelName = 'treasurechest_new';
                }
                
                // Reset puzzle solved state
                if (typeof puzzleSolved !== 'undefined') {
                    puzzleSolved.treasurechest = false;
                }
                
                // Patch raycaster to avoid errors
                patchModelClickHandler();
            } catch (error) {
                console.error('Error initializing chest controller:', error);
                lockboxContent.innerHTML = `
                    <div class="error-message">
                        <p>Error initializing treasure chest: ${error.message}</p>
                    </div>
                `;
            }
        } else {
            console.error('Could not find 3D scene variables, unable to initialize chest');
            
            // Show error message with more detail
            lockboxContent.innerHTML = `
                <div class="error-message">
                    <p>Unable to load treasure chest model: 3D scene not found</p>
                    <p>scene: ${typeof scene !== 'undefined'}, 
                       renderer: ${typeof renderer !== 'undefined'}, 
                       camera: ${typeof camera !== 'undefined'}, 
                       controls: ${typeof controls !== 'undefined'}</p>
                </div>
            `;
        }
    }
    
    // Patch the model click handler to prevent errors with non-existent currentModel.children
    function patchModelClickHandler() {
        // Check if onModelClick exists in original code
        if (typeof onModelClick === 'function') {
            console.log("Patching onModelClick function to prevent errors");
            
            // Save original function
            const originalOnModelClick = onModelClick;
            
            // Create safe version
            window.onModelClick = function(event) {
                // Check if currentModel exists and has children before proceeding
                if (typeof currentModel === 'undefined' || !currentModel || !currentModel.children) {
                    console.log("Skipping raycasting - currentModel not available");
                    return;
                }
                
                // Call original function
                originalOnModelClick(event);
            };
        }
    }
    
    // Initialize whenever the window loads
    window.addEventListener('load', function() {
        // Additional safety measure to ensure scene is initialized
        if (typeof init === 'function' && !isInitialized) {
            init();
            isInitialized = true;
            console.log("Initialized 3D scene on window load");
            
            // Try to load the treasure chest after a short delay
            setTimeout(replaceWithTreasureChest, 1000);
        }
    });
})(); 