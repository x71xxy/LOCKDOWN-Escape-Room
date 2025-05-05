# LOCKDOWN - Escape Room 3D Experience

This is a web-based escape room 3D interactive application built with Three.js. Players need to solve three different puzzles (Treasure Chest, Sequence Switches, and Directional Puzzle) to complete the escape.

## Project Structure

```
LOCKDOWN/
│
├── index.html              # Main HTML file
├── submission.html         # Project submission information
├── css/
│   ├── style.css           # Main stylesheet
│   └── password-dialog.css # Password dialog styles
├── js/
│   ├── main.js             # Main JavaScript file
│   ├── treasure-chest/     # Treasure chest module
│   └── sequence-buttons/   # Sequence buttons module
├── models/                 # 3D models folder
│   ├── treasurechest/      # Treasure chest model files
│   │   └── treasure_chest.glb
│   ├── switches/           # Switches model files
│   │   └── switches.glb
│   └── puzzle/             # Puzzle model files
│       └── directional_pad_larger_base.glb
├── sounds/                 # Sound effects
│   ├── chest-open.mp3
│   ├── chest-close.mp3
│   └── success.mp3
└──                  
```

## Features

- Three detailed 3D puzzle models, each with unique interactions
- Wireframe mode to view model structures
- Lighting control functionality with intensity adjustment
- Model rotation and zoom functionality
- Responsive design, adapting to different screen sizes
- Game progress tracking and animation effects
- Interactive puzzle elements with sound effects

## Puzzle Descriptions

1. **Treasure Chest**: Find and enter the hidden code to unlock the chest and reveal what's inside
2. **Sequence Switches**: Click multiple colored buttons in the correct sequence to activate light mechanisms
3. **Directional Puzzle**: Click to rotate model pieces, triggers a hint when correct pattern is formed

## Technology Stack

- HTML5
- CSS3
- JavaScript
- Three.js (3D rendering)
- GSAP (animations)
- Font Awesome (icons)
- Web Audio API (sound effects)

## How to Run

1. Clone this repository
2. Open the project folder in a local development server
   - Due to CORS restrictions, opening the HTML file directly may not load 3D models
   - You can use tools like Live Server extension in VS Code or Python's `http.server` module
3. Navigate to index.html in your browser

## About This Project

This project was developed as part of a Web 3D Technologies assignment, showcasing the application of 3D models in a web environment. The complete source code and project description are available in the GitHub repository.


## License

MIT 