# LOCKDOWN - Escape Room 3D Experience

This is a web-based escape room 3D interactive application built with Three.js. Players need to solve three different puzzles (Lockbox Code, Sequence Switches, and Puzzle Pieces) to complete the escape.

## Project Structure

```
LOCKDOWN/
│
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Stylesheet
├── js/
│   └── main.js             # Main JavaScript file
├── models/                 # 3D models folder
│   ├── lockbox.glb         # Lockbox code model
│   ├── switches.glb        # Sequence switches model
│   └── puzzle.glb          # Puzzle pieces model
└── images/                 # Image resources folder
    ├── escape-room-bg.jpg  # Background image
    ├── lockbox-thumb.jpg   # Lockbox thumbnail
    ├── switches-thumb.jpg  # Switches thumbnail
    └── puzzle-thumb.jpg    # Puzzle thumbnail
```

## Features

- Three detailed 3D puzzle models, each with unique interactions
- Wireframe mode to view model structures
- Lighting control functionality
- Model rotation and zoom functionality
- Responsive design, adapting to different screen sizes
- Game progress tracking

## Puzzle Descriptions

1. **Treasure Chest**: Find and enter the hidden code to unlock the chest and reveal what's inside
2. **Sequence Switches**: Click multiple colored buttons in the correct sequence to activate light mechanisms
3. **Puzzle Pieces**: Click to rotate model pieces, triggers a hint when correct pattern is formed

## Technology Stack

- HTML5
- CSS3
- JavaScript
- Three.js (3D rendering)
- GSAP (animations)
- Font Awesome (icons)

## How to Run

1. Ensure all 3D model files are placed in the `models/` folder
2. Ensure all image resources are placed in the `images/` folder
3. Use a local server to run the project (due to CORS restrictions, opening the HTML file directly may not load 3D models)

## Future Development

- Add more puzzles and 3D models
- Implement timer functionality
- Add hint system
- Implement multiple levels
- Add sound effects and background music

## License

MIT 