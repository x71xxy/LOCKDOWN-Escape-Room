# 3D Models Guide

This folder is for storing the project's 3D model files. You need to create and add the following models:

## Required Model Files

1. **lockbox.glb** - Lockbox Code Model
   - Should include clickable number buttons
   - Should have lid opening animation
   - Recommended to create in Blender and export as glTF/GLB format

2. **switches.glb** - Sequence Switches Model
   - Should include multiple clickable colored buttons
   - Should have light effects
   - Recommended to create in Blender and export as glTF/GLB format

3. **puzzle.glb** - Puzzle Pieces Model
   - Should include rotatable puzzle parts
   - Should have a puzzle completion effect
   - Recommended to create in Blender and export as glTF/GLB format

## Model Creation Guidelines

1. Models should have appropriate complexity to ensure visual appeal without performance issues
2. Use unique names for all interactive parts for easy reference in code
3. Materials and textures should fit the escape room theme
4. Ensure models have correct origin and scale settings before export
5. Use reasonable polygon counts for all models, avoiding excessive complexity
6. Save Blender source files (.blend) in this folder for future editing

## Interaction Structure Suggestions

### Lockbox Code
- Main body part: "lockbox_body"
- Lid part: "lockbox_lid"
- Number buttons: "button_1", "button_2", etc.

### Sequence Switches
- Main panel: "switch_panel"
- Colored buttons: "switch_red", "switch_green", "switch_blue", etc.
- Indicator lights: "light_1", "light_2", etc.

### Puzzle Pieces
- Main frame: "puzzle_frame"
- Puzzle pieces: "piece_1", "piece_2", etc. 