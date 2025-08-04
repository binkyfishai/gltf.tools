# 🖥️ Three.js glTF Shader Studio - Windows XP Style

A comprehensive retro-styled 3D development environment that combines real-time GLSL shader editing with powerful glTF model tools, all wrapped in a nostalgic Windows XP/Internet Explorer interface.

## ✨ Features

### 🎨 Shader Development
- **Live Shader Preview**: Edit vertex and fragment shaders with instant visual feedback
- **Real-time Uniforms**: Automatic time, resolution, and mouse position uniforms
- **Built-in Examples**: Pre-loaded shader examples (Rainbow, Pulsing Circle, Matrix Rain)
- **Error Handling**: Visual feedback for shader compilation errors
- **Material Application**: Apply custom shaders to glTF model materials

### 📦 glTF Model Tools
- **File Loading**: Support for .gltf and .glb files with drag & drop
- **Model Inspection**: Detailed information about meshes, materials, and animations
- **Animation Control**: Play, pause, stop, and speed control for model animations
- **Transform Tools**: Scale, rotation, and positioning controls
- **Material Editor**: View and modify materials, wireframe and debug modes
- **Camera Controls**: Multiple preset views (Front, Back, Left, Right, Top, Bottom, Isometric)
- **Export Features**: Export modified models and take screenshots

### 🖥️ Interface
- **Windows XP Aesthetic**: Authentic retro UI with classic Windows styling
- **Collapsible Panels**: Organized sections that can be expanded/collapsed
- **Tabbed Shader Editor**: Switch between vertex, fragment, and examples tabs
- **Drag & Drop Loading**: Drop glTF files directly onto the interface
- **Resizable Panels**: Adjust panel widths to your preference
- **Smart Controls**: Grouped controls with visual feedback
- **Loading Progress**: Visual feedback during model loading
- **Dual Panel Layout**: Separate shader editor and glTF tools panels
- **Orbit Controls**: 3D navigation with mouse controls
- **Keyboard Shortcuts**: Quick access to common functions
- **Status Indicators**: Real-time feedback in classic status bars

## 🚀 Getting Started

1. **Open the Application**
   ```powershell
   # Simply open index.html in any modern web browser
   Start-Process "index.html"
   ```

2. **Start Coding**
   - Edit shaders in the text areas
   - See live preview as you type
   - Use the buttons to load examples or reset

## 🎮 Controls

### Keyboard Shortcuts
- `Ctrl + Enter`: Update shaders manually
- `Ctrl + R`: Reset to default shaders
- `Ctrl + E`: Load a random shader example
- `Ctrl + O`: Open glTF file dialog

### Mouse Interaction
- **Left Click + Drag**: Orbit around the scene
- **Right Click + Drag**: Pan the camera
- **Mouse Wheel**: Zoom in/out
- **Move mouse**: Update the `mouse` uniform for shaders
- **Click materials**: Select material to apply custom shaders
- **Click animations**: Play specific animations

### UI Controls
- **Transform Sliders**: Adjust model scale and rotation
- **Animation Controls**: Play/pause/stop/next animation buttons
- **Speed Slider**: Control animation playback speed
- **Camera Buttons**: Quick preset camera positions
- **Export Buttons**: Save models and screenshots

## 📝 Available Uniforms

Your fragment shaders automatically have access to:

```glsl
uniform float time;        // Elapsed time since start
uniform vec2 resolution;   // Screen resolution
uniform vec2 mouse;        // Mouse position (normalized 0-1)
```

## 🎨 Example Shaders

### Basic Animated Gradient
```glsl
// Fragment Shader
uniform float time;
uniform vec2 resolution;

void main() {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    float t = time * 0.5;
    
    vec3 color = vec3(
        0.5 + 0.5 * sin(t + st.x * 3.14159),
        0.5 + 0.5 * cos(t + st.y * 3.14159),
        0.5 + 0.5 * sin(t + st.x + st.y)
    );
    
    gl_FragColor = vec4(color, 1.0);
}
```

### Pulsing Circle
```glsl
// Fragment Shader
uniform float time;
uniform vec2 resolution;

void main() {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    vec2 center = vec2(0.5, 0.5);
    
    float dist = distance(st, center);
    float pulse = 0.3 + 0.2 * sin(time * 3.0);
    
    float circle = smoothstep(pulse, pulse + 0.05, dist);
    vec3 color = mix(vec3(1.0, 0.2, 0.5), vec3(0.1, 0.1, 0.8), circle);
    
    gl_FragColor = vec4(color, 1.0);
}
```

## 🔧 Technical Details

- **Three.js Version**: r128
- **Shader Language**: GLSL ES
- **Model Formats**: glTF 2.0 (.gltf, .glb)
- **Compression**: Draco geometry compression support
- **Lighting**: PBR lighting with ambient and directional lights
- **Controls**: Orbit controls for 3D navigation
- **Rendering**: sRGB color space with ACES tone mapping

## 🎯 UI Elements

- **Blue Title Bar**: Classic Windows XP window chrome
- **Minimize/Maximize/Close**: Functional window buttons
- **Inset Panels**: Authentic Windows form styling
- **Status Bar**: Real-time status updates
- **Error Display**: Visual shader compilation error feedback

## 📋 glTF Workflow

### Loading Models
1. Click "📂 Load Model" or press `Ctrl+O`
2. Select a .gltf or .glb file from your computer
3. Model will automatically center and fit to view
4. Check the "📊 Model Info" panel for details

### Applying Custom Shaders
1. Edit shaders in the left panel
2. In the right panel, click on a material in the "🎨 Materials" list
3. Your custom shader will be applied to that material
4. Adjust the shader code to see real-time changes

### Working with Animations
1. Load a model with animations
2. Click on animation names in the "🎬 Animations" list
3. Use play/pause/stop controls
4. Adjust speed with the speed slider

### Exporting
1. Use "📤 Export glTF" to save your modified model
2. Use "📸 Screenshot" to capture the current view

## 🐛 Troubleshooting

### Shader Issues
- **Shader Won't Compile**: Check the error messages below each text area
- **No Animation**: Make sure you're using the `time` uniform in your fragment shader
- **Performance Issues**: Complex shaders may slow down rendering

### glTF Issues
- **Model Won't Load**: Ensure file is valid glTF 2.0 format
- **Missing Textures**: Some texture paths may not resolve correctly
- **Animation Problems**: Check that animations exist in the model
- **Export Errors**: Browser may block downloads - check popup blockers

## 💡 Tips for Development

### Shader Development
1. Start with simple color outputs
2. Use `gl_FragCoord.xy / resolution.xy` for normalized coordinates
3. Animate using the `time` uniform
4. Use `smoothstep()` for smooth transitions
5. Experiment with trigonometric functions for patterns
6. Make shaders semi-transparent to see glTF models underneath

### glTF Model Tips
1. Use models with PBR materials for best results
2. Ensure animations are baked properly in your 3D software
3. Keep file sizes reasonable for web loading
4. Test with different lighting setups
5. Use the sample model to test shader effects quickly

## 📄 Files Structure

```
gltf.tools/
├── index.html      # Main HTML with Windows XP styling and dual panels
├── app.js          # Enhanced Three.js app with glTF and shader tools
└── README.md       # This comprehensive documentation
```

## 🎯 Supported File Formats

- **Import**: .gltf, .glb (glTF 2.0 specification)
- **Export**: .gltf (JSON format)
- **Screenshots**: .png (canvas capture)
- **Compression**: Draco geometry compression (auto-detected)

## 🎉 Happy 3D Development!

Enjoy creating beautiful 3D scenes and shader effects with this comprehensive retro-styled development environment. The interface brings back the nostalgia of Windows XP while providing modern 3D development capabilities for both shaders and glTF models.

---
*Made with ❤️ for shader enthusiasts and retro computing fans* 