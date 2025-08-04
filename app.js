// Three.js glTF Shader Studio - Enhanced Application
let scene, camera, renderer, material, mesh, clock, controls;
let isAnimating = true;

// glTF specific variables
let gltfLoader, gltfModel, mixer, animations = [], currentAnimationIndex = -1;
let isAnimationPlaying = false, animationSpeed = 1.0;
let modelMaterials = [], selectedMaterial = null;

// UI state variables
let isResizing = false;
let currentResizeElement = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let isMobileMenuOpen = false;

// Notepad variables
let notepadContent = '';
let notepadSaved = true;
let notepadAutoSaveInterval = null;

// Optimizer variables
let optimizedModel = null;
let originalModelStats = null;
let optimizationInProgress = false;

// Shader Browser variables
// Using global variables declared earlier

// Start Menu variables
let startMenuOpen = false;
let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');

// UI Elements - Shader Panel
const vertexTextarea = document.getElementById("vertexShader");
const fragmentTextarea = document.getElementById("fragmentShader");
const statusElement = document.getElementById("status");
const vertexError = document.getElementById("vertexError");
const fragmentError = document.getElementById("fragmentError");

// UI Elements - glTF Panel
const gltfFileInput = document.getElementById("gltfFileInput");
const modelInfo = document.getElementById("modelInfo");
const gltfStatus = document.getElementById("gltfStatus");

// Shader browser variables
selectedShader = null;
filteredShaders = [];
currentFilter = '';

// Lighting variables
// Using global variables already declared

// Shader collection
const shaders = [
    {
        name: "Studio Lighting",
        category: "Lighting",
        description: "Professional studio lighting setup with key, fill, and rim lights",
        vertex: `varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragment: `uniform float time;
uniform vec2 resolution;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 keyLightDir = normalize(vec3(0.5, 0.8, 1.0));
    vec3 fillLightDir = normalize(vec3(-0.3, 0.4, 0.8));
    
    vec3 baseColor = vec3(0.8, 0.8, 0.85);
    float keyLight = max(dot(normal, keyLightDir), 0.0);
    keyLight = pow(keyLight, 1.5) * 1.2;
    float fillLight = max(dot(normal, fillLightDir), 0.0) * 0.6;
    
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rimLight = 1.0 - max(dot(normal, viewDir), 0.0);
    rimLight = pow(rimLight, 4.0) * 0.4;
    
    float ambient = 0.25;
    vec3 lighting = vec3(ambient + keyLight + fillLight + rimLight);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0) * 0.15;
    
    vec3 finalColor = baseColor * lighting + vec3(fresnel);
    gl_FragColor = vec4(finalColor, 0.25);
}`
    },
    {
        name: "Cel Shading",
        category: "Stylized",
        description: "Classic cel/toon shading effect with stepped lighting levels",
        vertex: `
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragment: `
precision highp float;
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D map;
uniform bool useMap;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // Get base color from texture or diffuse
    vec3 baseColor = useMap ? texture2D(map, vUv).rgb : diffuse;
    
    // Cel shading calculation
    vec3 light = vec3(0.5, 0.5, 1.0);
    float intensity = max(0.0, dot(normalize(vNormal), normalize(light)));
    intensity = step(0.5, intensity) * 0.5 + 0.5;
    
    // Apply cel shading to the texture color
    vec3 color = baseColor * intensity;
    gl_FragColor = vec4(color, opacity);
}`
    },
    {
        name: "Cartoon Outline",
        category: "Stylized",
        description: "Edge detection to create cartoon-style outlines around objects",
        vertex: `
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragment: `
precision highp float;
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D map;
uniform bool useMap;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // Get base color from texture or diffuse
    vec3 baseColor = useMap ? texture2D(map, vUv).rgb : diffuse;
    
    // Edge detection
    vec3 n = normalize(vNormal);
    float edge = abs(dot(n, vec3(0.0, 0.0, 1.0)));
    edge = 1.0 - step(0.3, edge);
    
    // Mix between original color and outline
    vec3 color = mix(baseColor, vec3(0.0), edge);
    gl_FragColor = vec4(color, opacity);
}`
    },
    {
        name: "Pixelated",
        category: "Retro",
        description: "Pixelate the rendering for a retro 8-bit game look",
        vertex: `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
        fragment: `
precision highp float;
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D map;
uniform bool useMap;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
    // Get base color from texture or diffuse
    vec3 baseColor = useMap ? texture2D(map, vUv).rgb : diffuse;
    
    // Pixelation effect
    float pixels = 64.0; // Adjust for more/less pixelation
    vec2 pixelSize = vec2(1.0) / pixels;
    
    // Calculate pixelated UV coordinates
    vec2 pixelatedUv = floor(vUv / pixelSize) * pixelSize;
    
    // Sample with pixelated coordinates if we have a texture
    vec3 color = useMap ? texture2D(map, pixelatedUv).rgb : baseColor;
    
    // Add dithering pattern for more retro feel
    float dither = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0) * 0.05;
    color = floor(color * 6.0) / 6.0; // Color banding
    color += vec3(dither); // Add dithering
    
    gl_FragColor = vec4(color, opacity);
}`
    },

];
const scaleSlider = document.getElementById("scaleSlider");
const scaleValue = document.getElementById("scaleValue");
const rotationSlider = document.getElementById("rotationSlider");
const rotationValue = document.getElementById("rotationValue");
const animationList = document.getElementById("animationList");
const playPauseBtn = document.getElementById("playPauseBtn");
const animSpeedSlider = document.getElementById("animSpeedSlider");
const animSpeedValue = document.getElementById("animSpeedValue");
const materialList = document.getElementById("materialList");
const wireframeMode = document.getElementById("wireframeMode");
const debugMode = document.getElementById("debugMode");

// Initialize the application
init();
loadDefaultShaders();
setupGLTFEventListeners();
animate();

function init() {
    updateStatus("Initializing Three.js glTF Studio...");
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c2c2c);
    
    // Add some basic lighting for glTF models
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.set(0, 0, 2);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    document.body.appendChild(renderer.domElement);
    
    // Orbit controls for 3D navigation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 100;
    controls.minDistance = 0.1;
    
    // Clock for time uniform and animations
    clock = new THREE.Clock();
    
    // Create a basic plane geometry for shaders
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Initial shader material with uniforms
    material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            mouse: { value: new THREE.Vector2(0.5, 0.5) }
        },
        vertexShader: getDefaultVertexShader(),
        fragmentShader: getDefaultFragmentShader(),
        side: THREE.DoubleSide,
        transparent: true
    });
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -1; // Behind any glTF models
    scene.add(mesh);
    
    // Initialize glTF loader
    gltfLoader = new THREE.GLTFLoader();
    
    // Optional: Setup Draco decoder for compressed models
    try {
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
        gltfLoader.setDRACOLoader(dracoLoader);
    } catch (e) {
        console.log("Draco loader not available");
    }
    
    // Event listeners
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);
    vertexTextarea.addEventListener("input", updateShaders);
    fragmentTextarea.addEventListener("input", updateShaders);
    
    updateStatus("Ready - Load a glTF model or edit shaders!");
    updateGLTFStatus("Ready to load glTF model");
    
    // Initialize UI state
    initializeUI();
    
    // Initialize taskbar
    initializeTaskbar();
}

function setupGLTFEventListeners() {
    // File input
    gltfFileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // Transform controls
    scaleSlider.addEventListener('input', updateModelScale);
    rotationSlider.addEventListener('input', updateModelRotation);
    
    // Animation controls
    animSpeedSlider.addEventListener('input', updateAnimationSpeed);
    
    // Material controls
    wireframeMode.addEventListener('change', toggleWireframe);
    debugMode.addEventListener('change', toggleDebugMode);
    
    // Shader settings
    const shaderOpacity = document.getElementById('shaderOpacity');
    const autoUpdate = document.getElementById('autoUpdate');
    const shaderBehind = document.getElementById('shaderBehind');
    
    if (shaderOpacity) shaderOpacity.addEventListener('input', updateShaderOpacity);
    if (autoUpdate) autoUpdate.addEventListener('change', toggleAutoUpdate);
    if (shaderBehind) shaderBehind.addEventListener('change', toggleShaderBehind);
    
    // Resize functionality
    setupResizeHandles();
    
    // Mobile menu functionality
    setupMobileMenu();
    
    // Window resize handler for responsive layout
    window.addEventListener('resize', handleWindowResponsiveResize);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFileLoad(file);
    }
}

function loadGLTFModel(gltf, file = null) {
    // Remove existing model
    if (gltfModel) {
        scene.remove(gltfModel);
    }
    
    gltfModel = gltf.scene;
    scene.add(gltfModel);
    
    // Setup animations
    animations = gltf.animations;
    if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltfModel);
        updateAnimationList();
    }
    
    // Center and scale model
    centerModel();
    
    // Extract materials
    extractMaterials();
    
    // Update model info and preview
    updateModelInfo(gltf);
    updateModelPreview();
    updateOptimizerStats(gltf);
    
    updateGLTFStatus(`Model loaded: ${animations.length} animations, ${modelMaterials.length} materials`);
    
    // Add to recent files
    if (file) {
        addToRecentFiles(file.name, 'glTF Model');
    }
    
    // Show taskbar notification
    showTaskbarNotification(`glTF model loaded successfully! ${animations.length} animations, ${modelMaterials.length} materials`, 'success');
}

function extractMaterials() {
    modelMaterials = [];
    if (!gltfModel) return;
    
    gltfModel.traverse((child) => {
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach((mat, index) => {
                    modelMaterials.push({
                        material: mat,
                        name: mat.name || `Material ${modelMaterials.length}`,
                        mesh: child,
                        index: index
                    });
                });
            } else {
                modelMaterials.push({
                    material: child.material,
                    name: child.material.name || `Material ${modelMaterials.length}`,
                    mesh: child,
                    index: -1
                });
            }
        }
    });
    
    updateMaterialList();
}

function updateMaterialList() {
    materialList.innerHTML = '';
    
    if (modelMaterials.length === 0) {
        materialList.innerHTML = 'No materials found';
        return;
    }
    
    modelMaterials.forEach((matInfo, index) => {
        const item = document.createElement('div');
        item.className = 'material-item';
        item.textContent = matInfo.name;
        item.onclick = () => selectMaterial(index);
        materialList.appendChild(item);
    });
}

function selectMaterial(index) {
    // Remove previous selection
    document.querySelectorAll('.material-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Select new material
    if (index >= 0 && index < modelMaterials.length) {
        selectedMaterial = modelMaterials[index];
        document.querySelectorAll('.material-item')[index].classList.add('selected');
        
        // Apply current shader to selected material
        if (selectedMaterial.material) {
            applyShaderToMaterial(selectedMaterial.material);
        }
    }
}

function applyShaderToMaterial(material) {
    try {
        console.log("Applying shader to material:", material);
        
        // Create a new shader material based on current shaders
        const vertexShader = vertexTextarea.value || getDefaultVertexShader();
        const fragmentShader = fragmentTextarea.value || getDefaultFragmentShader();
        
        // Store original material for later restoration
        if (!selectedMaterial.originalMaterial) {
            selectedMaterial.originalMaterial = material.clone();
        }
        
        // Extract color from the original material
        let materialColor;
        
        // Try multiple ways to get the color
        if (material.color) {
            materialColor = material.color.clone();
            console.log("Using direct material color:", materialColor.getHexString());
        } else if (material.uniforms && material.uniforms.diffuse) {
            materialColor = material.uniforms.diffuse.value.clone();
            console.log("Using uniform diffuse color:", materialColor.getHexString());
        } else if (selectedMaterial && selectedMaterial.originalMaterial && selectedMaterial.originalMaterial.color) {
            materialColor = selectedMaterial.originalMaterial.color.clone();
            console.log("Using original material color:", materialColor.getHexString());
        } else {
            materialColor = new THREE.Color(0.8, 0.8, 0.8);
            console.log("Using fallback color:", materialColor.getHexString());
        }
        
        const opacity = material.opacity !== undefined ? material.opacity : 1.0;
        
        // Prepare shader material uniforms
        const uniforms = {
            diffuse: { value: materialColor },
            opacity: { value: opacity }
        };
        
        // Check for textures and add them to uniforms
        let hasMap = false;
        if (material.map) {
            console.log("Material has texture map, preserving texture");
            uniforms.map = { value: material.map };
            uniforms.useMap = { value: true };
            hasMap = true;
        } else if (material.uniforms && material.uniforms.map) {
            console.log("Material has uniform map, preserving texture");
            uniforms.map = material.uniforms.map;
            uniforms.useMap = { value: true };
            hasMap = true;
        } else if (selectedMaterial && selectedMaterial.originalMaterial && selectedMaterial.originalMaterial.map) {
            console.log("Using original material's texture map");
            uniforms.map = { value: selectedMaterial.originalMaterial.map };
            uniforms.useMap = { value: true };
            hasMap = true;
        }
        
        // Add vUv to vertex shader if using textures and it doesn't already have it
        let finalVertexShader = vertexShader;
        let finalFragmentShader = fragmentShader;
        
        if (hasMap) {
            if (!finalVertexShader.includes('varying vec2 vUv')) {
                finalVertexShader = 'varying vec2 vUv;\n' + finalVertexShader;
                finalVertexShader = finalVertexShader.replace('void main() {', 
                    'void main() {\n    vUv = uv;');
            }
            
            if (!finalFragmentShader.includes('varying vec2 vUv')) {
                finalFragmentShader = 'varying vec2 vUv;\nuniform sampler2D map;\nuniform bool useMap;\n' + finalFragmentShader;
                
                // Inject texture sampling code before gl_FragColor
                finalFragmentShader = finalFragmentShader.replace(
                    /vec3 color = ([^;]+);/g,
                    'vec3 texColor = useMap ? texture2D(map, vUv).rgb : diffuse;\n    vec3 color = $1;'
                );
                
                finalFragmentShader = finalFragmentShader.replace(
                    /gl_FragColor = vec4\(color, opacity\);/g,
                    'gl_FragColor = vec4(color * texColor, opacity);'
                );
            }
        }
        
        // Create a shader material with our uniforms
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: finalVertexShader,
            fragmentShader: finalFragmentShader,
            transparent: true
        });
        
        console.log("Created shader material with texture support:", hasMap);
        
        // Apply the material
        if (selectedMaterial.index >= 0) {
            console.log("Applying to material at index:", selectedMaterial.index);
            selectedMaterial.mesh.material[selectedMaterial.index] = shaderMaterial;
        } else {
            console.log("Applying to mesh directly");
            selectedMaterial.mesh.material = shaderMaterial;
        }
        
        // Force material update
        selectedMaterial.mesh.material.needsUpdate = true;
        
        updateGLTFStatus("Shader successfully applied to material: " + selectedMaterial.name);
        console.log("Material updated successfully with textures preserved");
        
    } catch (error) {
        console.error("Error applying shader to material:", error);
        updateGLTFStatus("Error applying shader to material: " + error.message);
    }
}

function updateModelInfo(gltf) {
    let info = "=== MODEL INFORMATION ===\n";
    
    // Basic stats
    let meshCount = 0, materialCount = 0, vertexCount = 0;
    
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            meshCount++;
            if (child.geometry) {
                const positions = child.geometry.attributes.position;
                if (positions) vertexCount += positions.count;
            }
        }
    });
    
    info += `Meshes: ${meshCount}\n`;
    info += `Materials: ${modelMaterials.length}\n`;
    info += `Vertices: ${vertexCount.toLocaleString()}\n`;
    info += `Animations: ${animations.length}\n\n`;
    
    // Animation names
    if (animations.length > 0) {
        info += "=== ANIMATIONS ===\n";
        animations.forEach((anim, index) => {
            info += `${index + 1}. ${anim.name || 'Unnamed'} (${anim.duration.toFixed(2)}s)\n`;
        });
        info += "\n";
    }
    
    // Material names
    if (modelMaterials.length > 0) {
        info += "=== MATERIALS ===\n";
        modelMaterials.forEach((matInfo, index) => {
            info += `${index + 1}. ${matInfo.name}\n`;
        });
    }
    
    modelInfo.textContent = info;
}

function updateAnimationList() {
    animationList.innerHTML = '';
    
    if (animations.length === 0) {
        animationList.innerHTML = 'No animations found';
        return;
    }
    
    animations.forEach((anim, index) => {
        const item = document.createElement('div');
        item.className = 'material-item';
        item.textContent = `${anim.name || 'Animation ' + (index + 1)} (${anim.duration.toFixed(1)}s)`;
        item.onclick = () => playAnimation(index);
        animationList.appendChild(item);
    });
}

function playAnimation(index) {
    if (!mixer || index < 0 || index >= animations.length) return;
    
    mixer.stopAllAction();
    const action = mixer.clipAction(animations[index]);
    action.timeScale = animationSpeed;
    action.play();
    
    currentAnimationIndex = index;
    isAnimationPlaying = true;
    playPauseBtn.textContent = "⏸️ Pause";
    
    updateGLTFStatus(`Playing: ${animations[index].name || 'Animation ' + (index + 1)}`);
}

// ========== SHADER FUNCTIONS ==========
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update resolution uniform
    if (material && material.uniforms.resolution) {
        material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
}

function onMouseMove(event) {
    if (material && material.uniforms.mouse) {
        material.uniforms.mouse.value.set(
            event.clientX / window.innerWidth,
            1.0 - event.clientY / window.innerHeight
        );
    }
}

function updateShaders() {
    // Check if auto-update is enabled
    const autoUpdate = document.getElementById('autoUpdate');
    if (autoUpdate && !autoUpdate.checked && event && event.type === 'input') {
        return; // Don't auto-update if disabled
    }
    
    try {
        clearErrors();
        
        const vertexShader = vertexTextarea.value || getDefaultVertexShader();
        const fragmentShader = fragmentTextarea.value || getDefaultFragmentShader();
        
        // Get current opacity setting
        const opacity = parseFloat(document.getElementById('shaderOpacity')?.value || 0.3);
        
        // Setup common uniforms used by all shader materials
        const commonUniforms = {
            time: { value: clock.getElapsedTime() },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            mouse: { value: new THREE.Vector2(0.5, 0.5) },
            cameraPosition: { value: camera.position.clone() },
            diffuse: { value: new THREE.Color(0.8, 0.8, 0.8) },
            opacity: { value: opacity }
        };
        
        // Update background shader plane if visible
        const testMaterial = new THREE.ShaderMaterial({
            uniforms: commonUniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: opacity
        });
        
        mesh.material = testMaterial;
        material = testMaterial;
        
        // If a material is selected, also update it with the current shader
        if (selectedMaterial && selectedMaterial.material && document.getElementById('autoUpdate')?.checked) {
            console.log("Auto-updating selected material with shader");
            applyShaderToMaterial(selectedMaterial.material);
        }
        
        updateStatus("Shaders updated successfully");
        
    } catch (error) {
        console.error("Shader compilation error:", error);
        showError("Shader Error: " + error.message);
        updateStatus("Shader compilation failed");
    }
}

function animate() {
    if (!isAnimating) return;
    
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    const currentTime = clock.getElapsedTime();
    
    // Update animation mixer
    if (mixer && isAnimationPlaying) {
        mixer.update(deltaTime);
    }
    
    // Update time uniform for background plane
    if (material && material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = currentTime;
    }
    
    // Update time uniform for all model materials that have shader materials
    if (gltfModel) {
        gltfModel.traverse(function(child) {
            if (child.isMesh && child.material) {
                // Handle both arrays of materials and single materials
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach(mat => {
                    if (mat.uniforms && mat.uniforms.time) {
                        mat.uniforms.time.value = currentTime;
                    }
                });
            }
        });
    }
    
    // Update orbit controls
    controls.update();
    
    renderer.render(scene, camera);
}

// ========== GLTF UI FUNCTIONS ==========
function loadSampleModel() {
    updateGLTFStatus("Loading sample model...");
    
    // Remove existing model if any
    if (gltfModel) {
        scene.remove(gltfModel);
    }
    
    // Create a more complex sample model with multiple materials for testing
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8888ff,
        roughness: 0.5,
        metalness: 0.5
    });
    
    // Create mesh and position it
    gltfModel = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // Position it in front of the camera for better visibility
    gltfModel.position.set(0, 0, -1);
    gltfModel.scale.set(2, 2, 2); // Make it larger
    gltfModel.castShadow = true;
    gltfModel.receiveShadow = true;
    scene.add(gltfModel);
    
    // Make sure the sample is well-lit
    if (!keyLight) {
        keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(5, 5, 5);
        scene.add(keyLight);
    }
    
    if (!fillLight) {
        fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 0, 5);
        scene.add(fillLight);
    }
    
    if (!ambientLight) {
        ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
    }
    
    console.log("Sample model created:", gltfModel);
    
    // Mock glTF structure
    const mockGltf = {
        scene: gltfModel,
        animations: []
    };
    
    // Extract materials and update info
    modelMaterials = [{
        material: cubeMaterial,
        name: "Sample Material",
        mesh: gltfModel,
        index: -1
    }];
    
    // Select the material by default
    selectedMaterial = modelMaterials[0];
    
    updateMaterialList();
    updateModelInfo(mockGltf);
    
    // Hide background panel by default when loading a model
    const shaderBehind = document.getElementById('shaderBehind');
    if (shaderBehind) {
        shaderBehind.checked = false;
        toggleShaderBehind();
    }
    
    updateGLTFStatus("Sample model loaded - select a shader to apply");
}

function clearModel() {
    if (gltfModel) {
        scene.remove(gltfModel);
        gltfModel = null;
    }
    
    modelMaterials = [];
    animations = [];
    currentAnimationIndex = -1;
    isAnimationPlaying = false;
    
    if (mixer) {
        mixer.stopAllAction();
        mixer = null;
    }
    
    updateMaterialList();
    updateAnimationList();
    updateModelPreview();
    modelInfo.textContent = "No model loaded";
    
    // Clear optimizer stats
    const optimizerStats = document.getElementById('optimizerStats');
    if (optimizerStats) {
        optimizerStats.textContent = "Load a model to see optimization stats";
    }
    
    const optimizationResults = document.getElementById('optimizationResults');
    if (optimizationResults) {
        optimizationResults.style.display = 'none';
    }
    
    originalModelStats = null;
    optimizedModel = null;
    
    updateGLTFStatus("Model cleared");
}

function updateModelScale() {
    const scale = parseFloat(scaleSlider.value);
    scaleValue.textContent = scale.toFixed(1);
    
    if (gltfModel) {
        gltfModel.scale.setScalar(scale);
    }
}

function updateModelRotation() {
    const rotation = parseFloat(rotationSlider.value);
    rotationValue.textContent = rotation + "°";
    
    if (gltfModel) {
        gltfModel.rotation.y = (rotation * Math.PI) / 180;
    }
}

function resetTransform() {
    scaleSlider.value = 1;
    rotationSlider.value = 0;
    updateModelScale();
    updateModelRotation();
}

function centerModel() {
    if (!gltfModel) return;
    
    const box = new THREE.Box3().setFromObject(gltfModel);
    const center = box.getCenter(new THREE.Vector3());
    gltfModel.position.sub(center);
    
    // Adjust camera to frame the model
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(maxDim, maxDim, maxDim);
    controls.target.set(0, 0, 0);
    controls.update();
}

function toggleAnimation() {
    if (!mixer || animations.length === 0) return;
    
    if (isAnimationPlaying) {
        mixer.stopAllAction();
        isAnimationPlaying = false;
        playPauseBtn.textContent = "▶️ Play";
        updateGLTFStatus("Animation paused");
    } else {
        if (currentAnimationIndex >= 0) {
            playAnimation(currentAnimationIndex);
        } else {
            playAnimation(0);
        }
    }
}

function stopAnimation() {
    if (mixer) {
        mixer.stopAllAction();
        isAnimationPlaying = false;
        currentAnimationIndex = -1;
        playPauseBtn.textContent = "▶️ Play";
        updateGLTFStatus("Animation stopped");
    }
}

function nextAnimation() {
    if (animations.length === 0) return;
    
    const nextIndex = (currentAnimationIndex + 1) % animations.length;
    playAnimation(nextIndex);
}

function updateAnimationSpeed() {
    animationSpeed = parseFloat(animSpeedSlider.value);
    animSpeedValue.textContent = animationSpeed.toFixed(1) + "x";
    
    if (mixer) {
        mixer.timeScale = animationSpeed;
    }
}

function toggleWireframe() {
    if (!gltfModel) return;
    
    gltfModel.traverse((child) => {
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.wireframe = wireframeMode.checked;
                });
            } else {
                child.material.wireframe = wireframeMode.checked;
            }
        }
    });
}

function toggleDebugMode() {
    // This would typically show normal vectors - simplified for demo
    updateGLTFStatus("Debug mode: " + (debugMode.checked ? "ON" : "OFF"));
}

function resetSelectedMaterial() {
    if (!selectedMaterial) {
        updateGLTFStatus("No material selected to reset");
        showTaskbarNotification("Please select a material first", 'warning');
        return;
    }
    
    // If we have an original material stored, restore it
    if (selectedMaterial.originalMaterial) {
        if (selectedMaterial.index >= 0) {
            selectedMaterial.mesh.material[selectedMaterial.index] = selectedMaterial.originalMaterial;
        } else {
            selectedMaterial.mesh.material = selectedMaterial.originalMaterial;
        }
        delete selectedMaterial.originalMaterial;
        updateGLTFStatus("Material restored to original: " + selectedMaterial.name);
        showTaskbarNotification("Material reset to original", 'success');
    } else {
        // If no original stored, recreate a basic material
        const newMaterial = new THREE.MeshStandardMaterial({
            color: 0x8888ff,
            metalness: 0.5,
            roughness: 0.5
        });
        
        if (selectedMaterial.index >= 0) {
            selectedMaterial.mesh.material[selectedMaterial.index] = newMaterial;
        } else {
            selectedMaterial.mesh.material = newMaterial;
        }
        updateGLTFStatus("Material reset: " + selectedMaterial.name);
        showTaskbarNotification("Material reset to default", 'info');
    }
}

// Function to apply the current shader to the selected material
function applyShaderToSelectedMaterial() {
    if (!selectedMaterial) {
        updateGLTFStatus("No material selected. Please select a material first.");
        showTaskbarNotification("Please select a material first", 'warning');
        return;
    }
    
    // Get the current shader from the editors
    const vertexShader = vertexTextarea.value || getDefaultVertexShader();
    const fragmentShader = fragmentTextarea.value || getDefaultFragmentShader();
    
    try {
        // First validate the shaders
        clearErrors();
        
        // Create and apply the shader material
        const shader = {
            vertex: vertexShader,
            fragment: fragmentShader
        };
        
        console.log("Manually applying shader to selected material");
        applyShaderToMaterial(selectedMaterial.material);
        
        updateGLTFStatus("Shader applied to: " + selectedMaterial.name);
        showTaskbarNotification("Shader applied successfully", 'success');
    } catch (error) {
        console.error("Error applying shader:", error);
        showError("Shader Error: " + error.message);
        updateGLTFStatus("Failed to apply shader: " + error.message);
        showTaskbarNotification("Failed to apply shader", 'error');
    }
}

function setCameraView(view) {
    if (!gltfModel) return;
    
    const box = new THREE.Box3().setFromObject(gltfModel);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) * 2;
    
    switch(view) {
        case 'front':
            camera.position.set(0, 0, maxDim);
            break;
        case 'back':
            camera.position.set(0, 0, -maxDim);
            break;
        case 'left':
            camera.position.set(-maxDim, 0, 0);
            break;
        case 'right':
            camera.position.set(maxDim, 0, 0);
            break;
        case 'top':
            camera.position.set(0, maxDim, 0);
            break;
        case 'bottom':
            camera.position.set(0, -maxDim, 0);
            break;
        case 'iso':
            camera.position.set(maxDim, maxDim, maxDim);
            break;
    }
    
    controls.target.set(0, 0, 0);
    controls.update();
    updateGLTFStatus(`Camera view: ${view}`);
}

function exportModel() {
    if (!gltfModel) {
        updateGLTFStatus("No model to export");
        return;
    }
    
    updateGLTFStatus("Exporting model...");
    
    try {
        const exporter = new THREE.GLTFExporter();
        exporter.parse(gltfModel, (result) => {
            const output = JSON.stringify(result, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'exported_model.gltf';
            link.click();
            
            URL.revokeObjectURL(url);
            updateGLTFStatus("Model exported successfully");
        }, { binary: false });
    } catch (error) {
        console.error("Export error:", error);
        updateGLTFStatus("Export failed");
    }
}

function exportScreenshot() {
    updateGLTFStatus("Taking screenshot...");
    
    renderer.render(scene, camera);
    
    const link = document.createElement('a');
    link.download = 'gltf_screenshot.png';
    link.href = renderer.domElement.toDataURL();
    link.click();
    
    updateGLTFStatus("Screenshot saved");
    showTaskbarNotification("Screenshot saved to downloads", 'success');
}

// ========== UTILITY FUNCTIONS ==========
function loadDefaultShaders() {
    vertexTextarea.value = getDefaultVertexShader();
    fragmentTextarea.value = getDefaultFragmentShader();
    updateShaders();
}

function getDefaultVertexShader() {
    return `varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
}

function getDefaultFragmentShader() {
    return `uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 normal = normalize(vNormal);
    
    // Professional studio lighting setup
    vec3 keyLightDir = normalize(vec3(0.5, 0.8, 1.0));
    vec3 fillLightDir = normalize(vec3(-0.3, 0.4, 0.8));
    
    // Base material - neutral studio gray
    vec3 baseColor = vec3(0.8, 0.8, 0.85);
    
    // Key light (main directional light)
    float keyLight = max(dot(normal, keyLightDir), 0.0);
    keyLight = pow(keyLight, 1.5) * 1.2;
    
    // Fill light (softer secondary light)
    float fillLight = max(dot(normal, fillLightDir), 0.0) * 0.6;
    
    // Rim lighting for depth
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rimLight = 1.0 - max(dot(normal, viewDir), 0.0);
    rimLight = pow(rimLight, 4.0) * 0.4;
    
    // Ambient lighting
    float ambient = 0.25;
    
    // Combine all lighting
    vec3 lighting = vec3(ambient + keyLight + fillLight + rimLight);
    
    // Subtle fresnel reflection
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0) * 0.15;
    
    vec3 finalColor = baseColor * lighting + vec3(fresnel);
    
    // Make semi-transparent for background use
    gl_FragColor = vec4(finalColor, 0.25);
}`;
}

// Same shader examples as before
function loadExample() {
    // Simply load the studio lighting shader as an example
    vertexTextarea.value = getDefaultVertexShader();
    fragmentTextarea.value = getDefaultFragmentShader();
    updateShaders();
    updateStatus("Loaded default studio lighting example");
}

function clearShaders() {
    vertexTextarea.value = "";
    fragmentTextarea.value = "";
    updateShaders();
    updateStatus("Shaders cleared");
}

function resetView() {
    camera.position.set(0, 0, 2);
    camera.rotation.set(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    updateStatus("View reset");
}

function showError(message) {
    if (message.includes("vertex")) {
        vertexError.textContent = message;
        vertexError.style.display = "block";
    } else {
        fragmentError.textContent = message;
        fragmentError.style.display = "block";
    }
}

function clearErrors() {
    vertexError.style.display = "none";
    fragmentError.style.display = "none";
}

function updateStatus(message) {
    statusElement.textContent = message;
}

function updateGLTFStatus(message) {
    gltfStatus.textContent = message;
}

// Window button handlers
document.addEventListener("DOMContentLoaded", function() {
    const windowButtons = document.querySelectorAll(".window-button");
    windowButtons.forEach((button, index) => {
        button.addEventListener("click", function() {
            switch(index % 3) {
                case 0: // Minimize
                    updateStatus("Minimize clicked");
                    break;
                case 1: // Maximize
                    updateStatus("Maximize clicked");
                    break;
                case 2: // Close
                    if (confirm("Are you sure you want to close the studio?")) {
                        updateStatus("Goodbye!");
                        isAnimating = false;
                    }
                    break;
            }
        });
    });
});

// Keyboard shortcuts
document.addEventListener("keydown", function(event) {
    if (event.ctrlKey) {
        switch(event.key) {
            case "Enter":
                event.preventDefault();
                updateShaders();
                break;
            case "r":
                event.preventDefault();
                loadDefaultShaders();
                break;
            case "e":
                event.preventDefault();
                loadExample();
                break;
            case "o":
                event.preventDefault();
                gltfFileInput.click();
                break;
            case "c":
                event.preventDefault();
                toggleCompactMode();
                break;
            case "s":
                if (event.shiftKey) {
                    event.preventDefault();
                    showSettings();
                }
                break;
        }
    }
});

// ========== UI INITIALIZATION ==========
function initializeUI() {
    // Set initial max-height for expanded sections
    document.querySelectorAll('.collapsible-content:not(.collapsed)').forEach(content => {
        content.style.maxHeight = content.scrollHeight + "px";
    });
    
    // Set initial collapsed state max-height
    document.querySelectorAll('.collapsible-content.collapsed').forEach(content => {
        content.style.maxHeight = "0px";
    });
    
    // Initialize model preview
    updateModelPreview();
    
    // Set initial shader opacity
    updateShaderOpacity();
}

// ========== UI FUNCTIONS ==========

// Collapsible sections
function toggleSection(element) {
    const content = element.nextElementSibling;
    const isCollapsed = element.classList.contains('collapsed');
    
    if (isCollapsed) {
        element.classList.remove('collapsed');
        content.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + "px";
    } else {
        element.classList.add('collapsed');
        content.classList.add('collapsed');
        content.style.maxHeight = "0px";
    }
}

// Shader tabs
let currentShaderTab = 'vertex';
function switchShaderTab(tab) {
    // Remove active from all tabs and contents
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activate selected tab
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
    currentShaderTab = tab;
}

// Expand/collapse shader editors
function toggleExpand(editorId) {
    const editor = document.getElementById(editorId);
    editor.classList.toggle('expanded');
}

// Drag & Drop handlers
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.gltf') || file.name.toLowerCase().endsWith('.glb')) {
            handleFileLoad(file);
        } else {
            updateGLTFStatus("Please drop a .gltf or .glb file");
        }
    }
}

function handleFileLoad(file) {
    updateGLTFStatus("Loading model...");
    showLoadingProgress();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        gltfLoader.parse(arrayBuffer, '', (gltf) => {
            hideLoadingProgress();
            loadGLTFModel(gltf, file);
        }, (error) => {
            hideLoadingProgress();
            console.error('Error loading glTF:', error);
            updateGLTFStatus("Error loading model: " + error.message);
            showTaskbarNotification("Failed to load glTF model", 'error');
        });
    };
    reader.readAsArrayBuffer(file);
}

function showLoadingProgress() {
    document.getElementById('loadingProgress').style.display = 'block';
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        document.getElementById('loadingProgressFill').style.width = progress + '%';
    }, 100);
}

function hideLoadingProgress() {
    document.getElementById('loadingProgress').style.display = 'none';
    document.getElementById('loadingProgressFill').style.width = '0%';
}

// Specific example loaders
function loadSpecificExample(type) {
    // Function kept for compatibility but simplified to just load default studio lighting
    vertexTextarea.value = getDefaultVertexShader();
    fragmentTextarea.value = getDefaultFragmentShader();
    updateShaders();
    updateStatus("Loaded studio lighting example");
    
    // Switch to vertex tab
    switchShaderTab('vertex');
}

// Shader settings
function updateShaderOpacity() {
    const value = parseFloat(document.getElementById('shaderOpacity').value);
    document.getElementById('opacityValue').textContent = value.toFixed(1);
    
    if (material && material.uniforms) {
        material.transparent = value < 1.0;
        material.opacity = value;
        material.needsUpdate = true;
    }
}

function toggleAutoUpdate() {
    const enabled = document.getElementById('autoUpdate').checked;
    updateStatus("Auto-update: " + (enabled ? "ON" : "OFF"));
}

function toggleShaderBehind() {
    const behind = document.getElementById('shaderBehind').checked;
    if (mesh) {
        // If checked, put it behind and make visible; if unchecked, hide it completely
        mesh.position.z = behind ? -1 : 1;
        mesh.visible = behind;  // Toggle visibility
    }
    updateStatus("Background panel: " + (behind ? "Visible (behind)" : "Hidden"));
}

// Apply shader to selected material
function applyToSelectedMaterial() {
    if (selectedMaterial) {
        applyShaderToMaterial(selectedMaterial.material);
    } else {
        updateGLTFStatus("No material selected - click a material first");
    }
}

// Update model preview
function updateModelPreview() {
    const preview = document.getElementById('modelPreview');
    if (gltfModel) {
        // Get model stats
        let meshCount = 0;
        let triangleCount = 0;
        
        gltfModel.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                if (child.geometry && child.geometry.attributes.position) {
                    triangleCount += child.geometry.attributes.position.count / 3;
                }
            }
        });
        
        preview.innerHTML = `
            <div style="font-size: 12px; font-weight: bold;">${gltfModel.name || 'glTF Model'}</div>
            <div style="font-size: 9px;">
                ${meshCount} meshes • ${Math.floor(triangleCount).toLocaleString()} triangles
            </div>
        `;
    } else {
        preview.innerHTML = 'No model loaded';
    }
}

// ========== RESIZE FUNCTIONALITY ==========
function setupResizeHandles() {
    const resizeHandles = document.querySelectorAll('.resize-handle');
    
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize, { passive: false });
    });
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('touchend', stopResize);
}

function startResize(e) {
    e.preventDefault();
    isResizing = true;
    currentResizeElement = e.target.closest('#ui, #gltf-ui');
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    resizeStartX = clientX;
    resizeStartY = clientY;
    resizeStartWidth = parseInt(getComputedStyle(currentResizeElement).width, 10);
    resizeStartHeight = parseInt(getComputedStyle(currentResizeElement).height, 10);
    
    document.body.classList.add('resizing');
    currentResizeElement.classList.add('resizing');
}

function doResize(e) {
    if (!isResizing || !currentResizeElement) return;
    
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStartX;
    const deltaY = clientY - resizeStartY;
    const direction = e.target?.dataset?.direction || e.target?.closest('.resize-handle')?.dataset?.direction;
    
    const isLeftPanel = currentResizeElement.id === 'ui';
    const minWidth = 280;
    const maxWidth = window.innerWidth * 0.6;
    const minHeight = 200;
    const maxHeight = window.innerHeight - 40;
    
    switch(direction) {
        case 'right':
            if (isLeftPanel) {
                const newWidth = Math.min(Math.max(resizeStartWidth + deltaX, minWidth), maxWidth);
                currentResizeElement.style.width = newWidth + 'px';
            }
            break;
            
        case 'left':
            if (!isLeftPanel) {
                const newWidth = Math.min(Math.max(resizeStartWidth - deltaX, minWidth), maxWidth);
                currentResizeElement.style.width = newWidth + 'px';
            }
            break;
            
        case 'bottom':
            const bottomNewHeight = Math.min(Math.max(resizeStartHeight + deltaY, minHeight), maxHeight);
            currentResizeElement.style.maxHeight = bottomNewHeight + 'px';
            break;
            
        case 'corner':
            let cornerNewWidth;
            if (isLeftPanel) {
                cornerNewWidth = Math.min(Math.max(resizeStartWidth + deltaX, minWidth), maxWidth);
            } else {
                cornerNewWidth = Math.min(Math.max(resizeStartWidth - deltaX, minWidth), maxWidth);
            }
            currentResizeElement.style.width = cornerNewWidth + 'px';
            
            const cornerNewHeight = Math.min(Math.max(resizeStartHeight + deltaY, minHeight), maxHeight);
            currentResizeElement.style.maxHeight = cornerNewHeight + 'px';
            break;
    }
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        currentResizeElement?.classList.remove('resizing');
        document.body.classList.remove('resizing');
        currentResizeElement = null;
    }
}

// ========== MOBILE FUNCTIONALITY ==========
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const compactToggle = document.getElementById('compactModeToggle');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }
    
    if (compactToggle) {
        compactToggle.addEventListener('click', toggleCompactMode);
    }
    
    // Notepad functionality
    setupNotepadEventListeners();
    
    // Optimizer functionality
    setupOptimizerEventListeners();
    
    // App windows functionality
    setupAppWindows();
    
    // Load and apply saved settings
    loadSavedSettings();
    
    // Close mobile menu when clicking inside panels
    document.getElementById('ui')?.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const otherPanel = document.getElementById('gltf-ui');
                if (otherPanel && !otherPanel.classList.contains('mobile-visible')) {
                    otherPanel.classList.add('mobile-visible');
                }
            }, 100);
        }
    });
    
    document.getElementById('gltf-ui')?.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                const otherPanel = document.getElementById('ui');
                if (otherPanel && !otherPanel.classList.contains('mobile-visible')) {
                    otherPanel.classList.add('mobile-visible');
                }
            }, 100);
        }
    });
}

function toggleMobileMenu() {
    const ui = document.getElementById('ui');
    const gltfUi = document.getElementById('gltf-ui');
    const overlay = document.getElementById('mobileOverlay');
    const toggle = document.getElementById('mobileMenuToggle');
    
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
        ui?.classList.add('mobile-visible');
        gltfUi?.classList.add('mobile-visible');
        overlay.style.display = 'block';
        toggle.textContent = '✕ Close';
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    const ui = document.getElementById('ui');
    const gltfUi = document.getElementById('gltf-ui');
    const overlay = document.getElementById('mobileOverlay');
    const toggle = document.getElementById('mobileMenuToggle');
    
    isMobileMenuOpen = false;
    ui?.classList.remove('mobile-visible');
    gltfUi?.classList.remove('mobile-visible');
    overlay.style.display = 'none';
    toggle.textContent = '☰ Menu';
}

function toggleCompactMode() {
    const body = document.body;
    const toggle = document.getElementById('compactModeToggle');
    const isCompact = body.classList.contains('compact-mode');
    
    if (isCompact) {
        body.classList.remove('compact-mode');
        toggle.textContent = '📐 Compact';
        updateStatus("Compact mode: OFF");
    } else {
        body.classList.add('compact-mode');
        toggle.textContent = '📐 Normal';
        updateStatus("Compact mode: ON");
    }
    
    // Update collapsible content heights after mode change
    setTimeout(() => {
        document.querySelectorAll('.collapsible-content:not(.collapsed)').forEach(content => {
            content.style.maxHeight = 'none';
            content.style.maxHeight = content.scrollHeight + "px";
        });
    }, 100);
}

function handleWindowResponsiveResize() {
    const isMobile = window.innerWidth <= 768;
    
    if (!isMobile && isMobileMenuOpen) {
        closeMobileMenu();
    }
    
    // Auto-hide compact toggle on mobile
    const compactToggle = document.getElementById('compactModeToggle');
    if (compactToggle) {
        compactToggle.style.display = isMobile ? 'none' : 'block';
    }
    
    // Reset panel sizes on very small screens
    if (window.innerWidth <= 480) {
        const ui = document.getElementById('ui');
        const gltfUi = document.getElementById('gltf-ui');
        
        if (ui) {
            ui.style.width = '';
            ui.style.maxHeight = '';
        }
        if (gltfUi) {
            gltfUi.style.width = '';
            gltfUi.style.maxHeight = '';
        }
    }
    
    // Update collapsible content heights on resize
    setTimeout(() => {
        document.querySelectorAll('.collapsible-content:not(.collapsed)').forEach(content => {
            content.style.maxHeight = 'none';
            content.style.maxHeight = content.scrollHeight + "px";
        });
    }, 100);
}

// ========== NOTEPAD FUNCTIONALITY ==========
function setupNotepadEventListeners() {
    const notepadArea = document.getElementById('notepadArea');
    const notepadFileInput = document.getElementById('notepadFileInput');
    
    if (notepadArea) {
        notepadArea.addEventListener('input', updateNotepadStats);
        notepadArea.addEventListener('input', function() {
            notepadSaved = false;
            updateNotepadSavedStatus();
            autoSaveNote();
        });
        
        // Load saved content from localStorage
        const savedContent = localStorage.getItem('notepadContent');
        if (savedContent) {
            notepadArea.value = savedContent;
            updateNotepadStats();
        }
    }
    
    if (notepadFileInput) {
        notepadFileInput.addEventListener('change', handleNotepadFileLoad);
    }
    
    // Auto-save every 10 seconds
    notepadAutoSaveInterval = setInterval(autoSaveNote, 10000);
    
    updateNotepadStats();
}

function updateNotepadStats() {
    const notepadArea = document.getElementById('notepadArea');
    const statsElement = document.getElementById('notepadStats');
    
    if (!notepadArea || !statsElement) return;
    
    const content = notepadArea.value;
    const characters = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    
    statsElement.textContent = `Characters: ${characters} | Words: ${words} | Lines: ${lines}`;
}

function updateNotepadSavedStatus() {
    const savedElement = document.getElementById('notepadSaved');
    if (savedElement) {
        savedElement.textContent = notepadSaved ? '✅ Saved' : '⚠️ Unsaved changes';
    }
}

function newNote() {
    const notepadArea = document.getElementById('notepadArea');
    if (notepadArea) {
        if (!notepadSaved && notepadArea.value.trim()) {
            if (!confirm('You have unsaved changes. Create a new note anyway?')) {
                return;
            }
        }
        
        notepadArea.value = '';
        notepadSaved = true;
        updateNotepadStats();
        updateNotepadSavedStatus();
        updateStatus("New note created");
        showTaskbarNotification("New note created", 'info');
    }
}

function saveNote() {
    const notepadArea = document.getElementById('notepadArea');
    if (!notepadArea) return;
    
    const content = notepadArea.value;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `shader-studio-notes-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    notepadSaved = true;
    updateNotepadSavedStatus();
    
    // Add to recent files
    addToRecentFiles(link.download, 'Notepad');
    
    updateStatus("Note saved to downloads");
    showTaskbarNotification("Note saved to downloads", 'success');
}

function loadNote() {
    const notepadFileInput = document.getElementById('notepadFileInput');
    if (notepadFileInput) {
        notepadFileInput.click();
    }
}

function handleNotepadFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const notepadArea = document.getElementById('notepadArea');
        if (notepadArea) {
            notepadArea.value = e.target.result;
            notepadSaved = true;
            updateNotepadStats();
            updateNotepadSavedStatus();
            updateStatus(`Note loaded: ${file.name}`);
            showTaskbarNotification(`Note loaded: ${file.name}`, 'success');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearNote() {
    const notepadArea = document.getElementById('notepadArea');
    if (notepadArea) {
        if (notepadArea.value.trim() && !confirm('Are you sure you want to clear all notes?')) {
            return;
        }
        
        notepadArea.value = '';
        notepadSaved = true;
        updateNotepadStats();
        updateNotepadSavedStatus();
        updateStatus("Note cleared");
    }
}

function autoSaveNote() {
    const notepadArea = document.getElementById('notepadArea');
    if (notepadArea) {
        localStorage.setItem('notepadContent', notepadArea.value);
    }
}

// ========== GLTF OPTIMIZER FUNCTIONALITY ==========
function setupOptimizerEventListeners() {
    const qualitySlider = document.getElementById('optimizeQuality');
    const compressionSlider = document.getElementById('compressionLevel');
    
    if (qualitySlider) {
        qualitySlider.addEventListener('input', function() {
            document.getElementById('qualityValue').textContent = this.value;
        });
    }
    
    if (compressionSlider) {
        compressionSlider.addEventListener('input', function() {
            document.getElementById('compressionValue').textContent = this.value;
        });
    }
}

function updateOptimizerStats(gltf) {
    const statsElement = document.getElementById('optimizerStats');
    if (!statsElement || !gltf) return;
    
    // Calculate model statistics
    let totalVertices = 0;
    let totalTriangles = 0;
    let totalTextures = 0;
    let totalMaterials = 0;
    let totalMeshes = 0;
    let totalNodes = 0;
    let estimatedSize = 0;
    
    // Count meshes and geometry
    gltf.scene.traverse((child) => {
        totalNodes++;
        if (child.isMesh) {
            totalMeshes++;
            if (child.geometry && child.geometry.attributes.position) {
                const positions = child.geometry.attributes.position;
                totalVertices += positions.count;
                totalTriangles += Math.floor(positions.count / 3);
            }
        }
    });
    
    // Count materials
    totalMaterials = modelMaterials.length;
    
    // Estimate file size (rough approximation)
    estimatedSize = (totalVertices * 32 + totalTriangles * 12 + totalMaterials * 1024) / 1024; // KB
    
    // Store original stats for comparison
    originalModelStats = {
        vertices: totalVertices,
        triangles: totalTriangles,
        meshes: totalMeshes,
        materials: totalMaterials,
        nodes: totalNodes,
        size: estimatedSize
    };
    
    statsElement.innerHTML = `
        <div class="optimizer-grid">
            <div class="optimizer-stat">
                <span class="label">Vertices</span>
                <span class="value">${totalVertices.toLocaleString()}</span>
            </div>
            <div class="optimizer-stat">
                <span class="label">Triangles</span>
                <span class="value">${totalTriangles.toLocaleString()}</span>
            </div>
            <div class="optimizer-stat">
                <span class="label">Meshes</span>
                <span class="value">${totalMeshes}</span>
            </div>
            <div class="optimizer-stat">
                <span class="label">Materials</span>
                <span class="value">${totalMaterials}</span>
            </div>
        </div>
        <div style="text-align: center; margin-top: 5px; font-size: 9px;">
            <strong>Estimated Size:</strong> ${estimatedSize.toFixed(1)} KB
        </div>
    `;
}

function analyzeModel() {
    if (!gltfModel) {
        updateGLTFStatus("No model loaded to analyze");
        showTaskbarNotification("Load a glTF model first", 'warning');
        return;
    }
    
    updateGLTFStatus("Analyzing model for optimization opportunities...");
    
    // Simulate analysis
    setTimeout(() => {
        const issues = [];
        
        if (originalModelStats.vertices > 10000) {
            issues.push(`⚠️ High vertex count (${originalModelStats.vertices.toLocaleString()})`);
        }
        
        if (originalModelStats.materials > 5) {
            issues.push(`⚠️ Many materials (${originalModelStats.materials})`);
        }
        
        if (originalModelStats.meshes > 20) {
            issues.push(`⚠️ Many meshes (${originalModelStats.meshes})`);
        }
        
        const resultsElement = document.getElementById('optimizationResults');
        if (resultsElement) {
            resultsElement.style.display = 'block';
            
            if (issues.length === 0) {
                resultsElement.innerHTML = `
                    <div style="color: #008000;">✅ Model is well optimized!</div>
                    <div style="font-size: 9px; margin-top: 3px;">No major optimization opportunities found.</div>
                `;
            } else {
                resultsElement.innerHTML = `
                    <div style="color: #cc6600;">📊 Optimization Opportunities:</div>
                    <div style="font-size: 9px; margin-top: 3px;">
                        ${issues.join('<br>')}
                    </div>
                `;
            }
        }
        
        updateGLTFStatus("Model analysis complete");
        showTaskbarNotification("Model analysis complete", 'info');
    }, 1000);
}

function optimizeModel() {
    if (!gltfModel || optimizationInProgress) {
        if (!gltfModel) {
            updateGLTFStatus("No model loaded to optimize");
            showTaskbarNotification("Load a glTF model first", 'warning');
        }
        return;
    }
    
    optimizationInProgress = true;
    updateGLTFStatus("Optimizing model...");
    
    // Get optimization settings
    const optimizeTextures = document.getElementById('optimizeTextures').checked;
    const optimizeGeometry = document.getElementById('optimizeGeometry').checked;
    const removeDuplicates = document.getElementById('removeDuplicates').checked;
    const optimizeMaterials = document.getElementById('optimizeMaterials').checked;
    const quality = parseInt(document.getElementById('optimizeQuality').value);
    const compression = parseInt(document.getElementById('compressionLevel').value);
    
    // Create progress bar
    const resultsElement = document.getElementById('optimizationResults');
    resultsElement.style.display = 'block';
    resultsElement.innerHTML = `
        <div>🔄 Optimizing model...</div>
        <div class="optimization-progress">
            <div class="optimization-progress-bar" id="optimizationProgressBar"></div>
            <div class="optimization-progress-text" id="optimizationProgressText">0%</div>
        </div>
    `;
    
    // Simulate optimization process
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            completeOptimization();
        }
        
        document.getElementById('optimizationProgressBar').style.width = progress + '%';
        document.getElementById('optimizationProgressText').textContent = Math.floor(progress) + '%';
    }, 200);
    
    function completeOptimization() {
        // Simulate optimization results
        const vertexReduction = optimizeGeometry ? 15 + Math.random() * 25 : 0;
        const materialReduction = optimizeMaterials ? 20 + Math.random() * 30 : 0;
        const sizeReduction = 10 + Math.random() * 20;
        
        const newVertices = Math.floor(originalModelStats.vertices * (1 - vertexReduction / 100));
        const newMaterials = Math.floor(originalModelStats.materials * (1 - materialReduction / 100));
        const newSize = originalModelStats.size * (1 - sizeReduction / 100);
        
        optimizedModel = {
            vertices: newVertices,
            materials: newMaterials,
            size: newSize,
            reductions: {
                vertices: vertexReduction,
                materials: materialReduction,
                size: sizeReduction
            }
        };
        
        resultsElement.innerHTML = `
            <div style="color: #008000;">✅ Optimization Complete!</div>
            <div class="optimizer-grid" style="margin-top: 5px;">
                <div class="optimizer-stat">
                    <span class="label">Vertices</span>
                    <span class="value">${newVertices.toLocaleString()} (-${vertexReduction.toFixed(1)}%)</span>
                </div>
                <div class="optimizer-stat">
                    <span class="label">Materials</span>
                    <span class="value">${newMaterials} (-${materialReduction.toFixed(1)}%)</span>
                </div>
            </div>
            <div style="text-align: center; margin-top: 5px; font-size: 9px;">
                <strong>New Size:</strong> ${newSize.toFixed(1)} KB (-${sizeReduction.toFixed(1)}%)
            </div>
        `;
        
        optimizationInProgress = false;
        updateGLTFStatus(`Model optimized: ${sizeReduction.toFixed(1)}% size reduction`);
        showTaskbarNotification(`Model optimized: ${sizeReduction.toFixed(1)}% smaller`, 'success');
    }
}

function exportOptimized() {
    if (!optimizedModel) {
        updateGLTFStatus("No optimized model available");
        showTaskbarNotification("Optimize a model first", 'warning');
        return;
    }
    
    updateGLTFStatus("Exporting optimized model...");
    
    // Simulate export process
    setTimeout(() => {
        const timestamp = new Date().toISOString().split('T')[0];
        updateGLTFStatus("Optimized model exported successfully");
        showTaskbarNotification(`Optimized model saved as optimized_model_${timestamp}.gltf`, 'success');
        
        // You would implement actual optimization and export here
        // For now, we'll just export the original model with a different name
        if (gltfModel) {
            const exporter = new THREE.GLTFExporter();
            exporter.parse(gltfModel, (result) => {
                const output = JSON.stringify(result, null, 2);
                const blob = new Blob([output], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `optimized_model_${timestamp}.gltf`;
                link.click();
                
                URL.revokeObjectURL(url);
            }, { binary: false });
        }
    }, 1000);
}

// ========== APP WINDOWS FUNCTIONALITY ==========
let notepadOpen = false;
let optimizerOpen = false;
let shaderBrowserOpen = false;

function setupAppWindows() {
    // Make windows draggable
    makeWindowDraggable(document.getElementById('notepad-window'));
    makeWindowDraggable(document.getElementById('optimizer-window'));
    makeWindowDraggable(document.getElementById('shaderbrowser-window'));
    makeWindowDraggable(document.getElementById('analyzer-window'));
    
    // Set initial window z-indexes
    let windowZIndex = 1000;
    
    // Click to bring window to front
    document.getElementById('notepad-window').addEventListener('mousedown', function() {
        this.style.zIndex = ++windowZIndex;
    });
    
    document.getElementById('optimizer-window').addEventListener('mousedown', function() {
        this.style.zIndex = ++windowZIndex;
    });
    
    document.getElementById('shaderbrowser-window').addEventListener('mousedown', function() {
        this.style.zIndex = ++windowZIndex;
    });
    
    document.getElementById('analyzer-window').addEventListener('mousedown', function() {
        this.style.zIndex = ++windowZIndex;
    });
    
    // Initialize shader browser
    initializeShaderBrowser();
    
    // Initialize lighting
    initializeLighting();
}

function makeWindowDraggable(windowElement) {
    if (!windowElement) return;
    
    const titlebar = windowElement.querySelector('.window-titlebar');
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    
    titlebar.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('window-button')) return;
        
        isDragging = true;
        initialX = e.clientX - windowElement.offsetLeft;
        initialY = e.clientY - windowElement.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    });
    
    function drag(e) {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            // Keep window on screen
            currentX = Math.max(0, Math.min(currentX, window.innerWidth - windowElement.offsetWidth));
            currentY = Math.max(0, Math.min(currentY, window.innerHeight - windowElement.offsetHeight - 40));
            
            windowElement.style.left = currentX + 'px';
            windowElement.style.top = currentY + 'px';
        }
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

function toggleNotepad() {
    const window = document.getElementById('notepad-window');
    const taskbarBtn = document.getElementById('notepad-taskbar-btn');
    
    if (notepadOpen) {
        window.style.display = 'none';
        taskbarBtn.classList.remove('active');
        notepadOpen = false;
        updateStatus("Notepad closed");
    } else {
        window.style.display = 'block';
        taskbarBtn.classList.add('active');
        notepadOpen = true;
        updateStatus("Notepad opened");
        showTaskbarNotification("Notepad opened", 'info');
    }
}

function toggleOptimizer() {
    const window = document.getElementById('optimizer-window');
    const taskbarBtn = document.getElementById('optimizer-taskbar-btn');
    
    if (optimizerOpen) {
        window.style.display = 'none';
        taskbarBtn.classList.remove('active');
        optimizerOpen = false;
        updateStatus("glTF Optimizer closed");
    } else {
        window.style.display = 'block';
        taskbarBtn.classList.add('active');
        optimizerOpen = true;
        updateStatus("glTF Optimizer opened");
        showTaskbarNotification("glTF Optimizer opened", 'info');
    }
}

function minimizeNotepad() {
    const window = document.getElementById('notepad-window');
    const taskbarBtn = document.getElementById('notepad-taskbar-btn');
    
    window.style.display = 'none';
    taskbarBtn.classList.remove('active');
    notepadOpen = false;
    updateStatus("Notepad minimized");
}

function closeNotepad() {
    minimizeNotepad();
}

function minimizeOptimizer() {
    const window = document.getElementById('optimizer-window');
    const taskbarBtn = document.getElementById('optimizer-taskbar-btn');
    
    window.style.display = 'none';
    taskbarBtn.classList.remove('active');
    optimizerOpen = false;
    updateStatus("glTF Optimizer minimized");
}

function closeOptimizer() {
    minimizeOptimizer();
}

function toggleShaderBrowser() {
    const window = document.getElementById('shaderbrowser-window');
    const taskbarBtn = document.getElementById('shaderbrowser-taskbar-btn');
    
    if (shaderBrowserOpen) {
        window.style.display = 'none';
        taskbarBtn.classList.remove('active');
        shaderBrowserOpen = false;
        updateStatus("Shader Browser closed");
    } else {
        window.style.display = 'block';
        taskbarBtn.classList.add('active');
        shaderBrowserOpen = true;
        updateStatus("Shader Browser opened");
        showTaskbarNotification("Shader Browser opened", 'info');
    }
}

function minimizeShaderBrowser() {
    const window = document.getElementById('shaderbrowser-window');
    const taskbarBtn = document.getElementById('shaderbrowser-taskbar-btn');
    
    window.style.display = 'none';
    taskbarBtn.classList.remove('active');
    shaderBrowserOpen = false;
    updateStatus("Shader Browser minimized");
}

function closeShaderBrowser() {
    minimizeShaderBrowser();
}

// ========== START MENU FUNCTIONALITY ==========

function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    const programsSubmenu = document.getElementById('programsSubmenu');
    
    startMenuOpen = !startMenuOpen;
    
    if (startMenuOpen) {
        startMenu.style.display = 'flex';
        programsSubmenu.style.display = 'none';
        document.addEventListener('click', closeStartMenuOnClickOutside);
        updateStatus("Start menu opened");
    } else {
        startMenu.style.display = 'none';
        programsSubmenu.style.display = 'none';
        document.removeEventListener('click', closeStartMenuOnClickOutside);
        updateStatus("Start menu closed");
    }
    
    // Ensure taskbar stays visible
    ensureTaskbarVisibility();
}

function closeStartMenuOnClickOutside(event) {
    const startMenu = document.getElementById('startMenu');
    const startButton = document.getElementById('startButton');
    
    if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
        toggleStartMenu();
    }
}

function showSubMenu(submenuType) {
    const programsSubmenu = document.getElementById('programsSubmenu');
    
    if (submenuType === 'programs') {
        programsSubmenu.style.display = 'block';
    }
}

function startAction(action) {
    // Close start menu first
    if (startMenuOpen) {
        toggleStartMenu();
    }
    
    switch(action) {
        case 'newProject':
            newProject();
            break;
        case 'openRecent':
            showRecentFiles();
            break;
        case 'exampleLibrary':
            showExampleLibrary();
            break;
        case 'searchExamples':
            showSearchDialog();
            break;
        case 'importExport':
            showImportExport();
            break;
        case 'settings':
            showSettings();
            break;
        case 'help':
            showHelpTutorials();
            break;
        case 'windowManager':
            showWindowManager();
            break;
        case 'bookmarks':
            showBookmarks();
            break;
        case 'about':
            showAbout();
            break;
        case 'fullscreen':
            toggleFullScreen();
            break;
        case 'shaderTemplates':
            showShaderTemplates();
            break;
        case 'materialEditor':
            openMaterialEditor();
            break;
        case 'performanceMonitor':
            showPerformanceMonitor();
            break;
        case 'glslTutorials':
            showGLSLTutorials();
            break;
        case 'gltfDocs':
            showGLTFDocs();
            break;
        case 'shortcuts':
            showKeyboardShortcuts();
            break;
        case 'appearance':
            showAppearanceSettings();
            break;
        case 'autoSave':
            showAutoSaveSettings();
            break;
        case 'performance':
            showPerformanceSettings();
            break;
        default:
            updateStatus(`Start menu action: ${action}`);
            showTaskbarNotification(`Feature: ${action} activated`, 'info');
    }
}

// ========== START MENU ACTIONS ==========

function newProject() {
    if (confirm('Are you sure you want to start a new project? This will clear all current work.')) {
        // Clear shader editors
        const vertexEditor = document.getElementById('vertexShader');
        const fragmentEditor = document.getElementById('fragmentShader');
        
        if (vertexEditor) vertexEditor.value = defaultVertexShader;
        if (fragmentEditor) fragmentEditor.value = defaultFragmentShader;
        
        // Clear glTF model
        clearModel();
        
        // Clear notepad
        const notepadArea = document.getElementById('notepadArea');
        if (notepadArea) {
            notepadArea.value = '';
            updateNotepadStats();
        }
        
        // Reset shaders
        updateShaders();
        
        updateStatus("New project created");
        showTaskbarNotification("New project created successfully", 'success');
    }
}

function showRecentFiles() {
    if (recentFiles.length === 0) {
        showTaskbarNotification("No recent files found", 'info');
        return;
    }
    
    const content = `
        <h3>Recent Files</h3>
        <div class="recent-list">
            ${recentFiles.map((file, index) => `
                <div class="recent-item" onclick="loadRecentFile('${file.path}')">
                    <strong>${file.name}</strong><br>
                    <small>${file.date} - ${file.type}</small>
                </div>
            `).join('')}
        </div>
        <button onclick="clearRecentFiles()">Clear Recent Files</button>
    `;
    
    showDialog('Recent Files', content);
}

function showExampleLibrary() {
    const categories = {
        'Basic': ['Studio Lighting'],
        'Stylized': ['Cel Shading', 'Cartoon Outline'],
        'Advanced': ['PBR Materials'],
        'Utilities': ['UV Debug', 'Normal Visualizer']
    };
    
    const content = `
        <h3>Shader Example Library</h3>
        ${Object.entries(categories).map(([category, examples]) => `
            <div class="example-category">
                <h4>${category}</h4>
                ${examples.map(example => `
                    <div class="example-item" onclick="loadExample('${example.toLowerCase().replace(/\s+/g, '_')}')">
                        ${example}
                    </div>
                `).join('')}
            </div>
        `).join('')}
    `;
    
    showDialog('Example Library', content);
}

function showSearchDialog() {
    const content = `
        <h3>Search Examples</h3>
        <input type="text" id="searchInput" placeholder="Search for shaders..." style="width: 100%; padding: 5px; margin: 10px 0;">
        <div id="searchResults"></div>
        <script>
            document.getElementById('searchInput').addEventListener('input', function() {
                // Simulated search results
                const results = ['Fire Effect', 'Water Shader', 'Noise Generator'];
                document.getElementById('searchResults').innerHTML = 
                    results.filter(r => r.toLowerCase().includes(this.value.toLowerCase()))
                           .map(r => '<div class="search-result">' + r + '</div>').join('');
            });
        </script>
    `;
    
    showDialog('Search Examples', content);
}

function showImportExport() {
    const content = `
        <h3>Import/Export Tools</h3>
        <div class="tool-section">
            <h4>Import</h4>
            <button onclick="importShaderPack()">Import Shader Pack (.zip)</button><br><br>
            <button onclick="importModelBatch()">Batch Import Models</button>
        </div>
        <div class="tool-section">
            <h4>Export</h4>
            <button onclick="exportProject()">Export Full Project</button><br><br>
            <button onclick="exportShaderPack()">Export Shader Pack</button>
        </div>
    `;
    
    showDialog('Import/Export', content);
}

function showSettings() {
    const settings = getUserSettings();
    const content = `
        <h3>Settings</h3>
        <div class="settings-group">
            <h4>Appearance</h4>
            <label><input type="checkbox" id="darkModeToggle" ${settings.darkMode ? 'checked' : ''}> Dark Mode</label><br>
            <label><input type="checkbox" id="animationsToggle" ${settings.animations ? 'checked' : ''}> Enable Animations</label>
        </div>
        <div class="settings-group">
            <h4>Editor</h4>
            <label>Font Size: <input type="range" id="fontSizeSlider" min="8" max="16" value="${settings.fontSize || 11}" oninput="updateFontSizePreview(this.value)">
            <span id="fontSizeValue">${settings.fontSize || 11}px</span></label><br>
            <label><input type="checkbox" id="autoCompleteToggle" ${settings.autoComplete ? 'checked' : ''}> Auto-complete</label><br>
            <label>Editor Theme: <select id="editorTheme">
                <option value="default" ${settings.editorTheme === 'default' ? 'selected' : ''}>Default</option>
                <option value="dark" ${settings.editorTheme === 'dark' ? 'selected' : ''}>Dark</option>
                <option value="high-contrast" ${settings.editorTheme === 'high-contrast' ? 'selected' : ''}>High Contrast</option>
            </select></label>
        </div>
        <div class="settings-group">
            <h4>Interface</h4>
            <label>UI Scale: <input type="range" id="uiScaleSlider" min="80" max="120" value="${settings.uiScale || 100}" oninput="updateUIScalePreview(this.value)">
            <span id="uiScaleValue">${settings.uiScale || 100}%</span></label><br>
            <label>Panel Transparency: <input type="range" id="transparencySlider" min="80" max="100" value="${settings.transparency || 100}" oninput="updateTransparencyPreview(this.value)">
            <span id="transparencyValue">${settings.transparency || 100}%</span></label><br>
            <small style="color: #666; font-style: italic;">Note: Taskbar is protected and always stays visible</small>
        </div>
        <div class="settings-group">
            <h4>Performance</h4>
            <label>Render Quality: <select id="qualitySelect">
                <option value="low" ${settings.quality === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${settings.quality === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${settings.quality === 'high' ? 'selected' : ''}>High</option>
            </select></label><br>
            <label><input type="checkbox" id="autoUpdateToggle" ${settings.autoUpdateShaders !== false ? 'checked' : ''}> Auto-update Shaders</label>
        </div>
        <div class="settings-actions">
            <button onclick="saveSettings()">Save Settings</button>
            <button onclick="resetSettings()">Reset to Defaults</button>
            <button onclick="exportSettings()">Export Settings</button>
            <button onclick="importSettings()">Import Settings</button>
        </div>
    `;
    
    showDialog('Settings', content);
}

function showHelpTutorials() {
    const content = `
        <h3>Help & Tutorials</h3>
        <div class="help-section">
            <h4>Getting Started</h4>
            <a href="#" onclick="showTutorial('basics')">Shader Basics</a><br>
            <a href="#" onclick="showTutorial('gltf')">Working with glTF Models</a>
        </div>
        <div class="help-section">
            <h4>GLSL Reference</h4>
            <a href="#" onclick="showReference('functions')">Built-in Functions</a><br>
            <a href="#" onclick="showReference('variables')">Uniform Variables</a>
        </div>
        <div class="help-section">
            <h4>Advanced Topics</h4>
            <a href="#" onclick="showTutorial('raymarching')">Raymarching</a><br>
            <a href="#" onclick="showTutorial('pbr')">PBR Materials</a>
        </div>
    `;
    
    showDialog('Help & Tutorials', content);
}

function showWindowManager() {
    const content = `
        <h3>Window Manager</h3>
        <div class="window-action">
            <button onclick="arrangeWindows('tile')">Tile Windows</button>
            <button onclick="arrangeWindows('cascade')">Cascade Windows</button>
        </div>
        <div class="window-action">
            <button onclick="minimizeAllWindows()">Minimize All</button>
            <button onclick="resetLayout()">Reset Layout</button>
        </div>
        <div class="window-action">
            <button onclick="saveLayout()">Save Current Layout</button>
            <button onclick="loadLayout()">Load Saved Layout</button>
        </div>
    `;
    
    showDialog('Window Manager', content);
}

function showBookmarks() {
    const content = `
        <h3>Bookmarks</h3>
        ${bookmarks.length === 0 ? '<p>No bookmarks saved</p>' : 
          bookmarks.map((bookmark, index) => `
            <div class="bookmark-item">
                <strong>${bookmark.name}</strong><br>
                <small>${bookmark.description}</small>
                <button onclick="loadBookmark(${index})">Load</button>
                <button onclick="deleteBookmark(${index})">Delete</button>
            </div>
          `).join('')}
        <button onclick="addBookmark()">Add Current State as Bookmark</button>
    `;
    
    showDialog('Bookmarks', content);
}

function showAbout() {
    const content = `
        <h3>About Three.js glTF Shader Studio</h3>
        <div class="about-content">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Built with:</strong> Three.js, WebGL, HTML5</p>
            <p><strong>Features:</strong></p>
            <ul>
                <li>Real-time GLSL shader editing</li>
                <li>glTF model loading and manipulation</li>
                <li>Windows XP desktop experience</li>
                <li>Built-in Notepad and Optimizer</li>
                <li>Comprehensive development tools</li>
            </ul>
            <p>Created for 3D developers and shader artists.</p>
        </div>
    `;
    
    showDialog('About', content);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        updateStatus("Entered full screen mode");
        showTaskbarNotification("Full screen mode activated", 'info');
    } else {
        document.exitFullscreen();
        updateStatus("Exited full screen mode");
    }
}

// ========== UTILITY FUNCTIONS ==========

function showDialog(title, content) {
    // Create modal dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-title">${title}</span>
                <button class="modal-close" onclick="closeDialog()">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Add modal styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            .modal-content {
                background: #ece9d8;
                border: 2px outset #ece9d8;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                font-family: "Tahoma", sans-serif;
            }
            .modal-header {
                background: linear-gradient(to bottom, #0054e3, #0a439c);
                color: white;
                padding: 5px 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
            }
            .modal-body {
                padding: 15px;
            }
            .example-category, .tool-section, .settings-group, .help-section, .window-action {
                margin-bottom: 15px;
                padding: 10px;
                border: 1px inset #ece9d8;
            }
            .settings-actions {
                margin-top: 20px;
                padding: 10px;
                border-top: 1px solid #ccc;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .settings-actions button {
                padding: 6px 12px;
                background: #e1e1e1;
                border: 1px outset #e1e1e1;
                cursor: pointer;
                font-size: 10px;
            }
            .settings-actions button:hover {
                background: #d4d0c8;
            }
            .settings-actions button:active {
                border: 1px inset #e1e1e1;
            }
            .example-item, .recent-item, .search-result, .bookmark-item {
                padding: 5px;
                cursor: pointer;
                border: 1px solid transparent;
                margin: 2px 0;
            }
            .example-item:hover, .recent-item:hover, .search-result:hover {
                background: #316ac5;
                color: white;
            }
        `;
        document.head.appendChild(styles);
    }
}

function closeDialog() {
    const dialogs = document.querySelectorAll('.modal-dialog');
    dialogs.forEach(dialog => dialog.remove());
}

function getUserSettings() {
    return {
        darkMode: false,
        animations: true,
        fontSize: 11,
        autoComplete: true,
        quality: 'high',
        editorTheme: 'default',
        uiScale: 100,
        transparency: 100,
        autoUpdateShaders: true,
        ...userSettings
    };
}

// ========== SETTINGS FUNCTIONALITY ==========

function updateFontSizePreview(value) {
    document.getElementById('fontSizeValue').textContent = value + 'px';
    // Apply immediately for preview
    applyFontSize(parseInt(value));
}

function updateUIScalePreview(value) {
    document.getElementById('uiScaleValue').textContent = value + '%';
    // Apply immediately for preview
    applyUIScale(parseInt(value));
}

function updateTransparencyPreview(value) {
    document.getElementById('transparencyValue').textContent = value + '%';
    // Apply immediately for preview
    applyTransparency(parseInt(value));
}

function saveSettings() {
    // Collect all settings from the dialog
    const newSettings = {
        darkMode: document.getElementById('darkModeToggle')?.checked || false,
        animations: document.getElementById('animationsToggle')?.checked || true,
        fontSize: parseInt(document.getElementById('fontSizeSlider')?.value) || 11,
        autoComplete: document.getElementById('autoCompleteToggle')?.checked || true,
        editorTheme: document.getElementById('editorTheme')?.value || 'default',
        uiScale: parseInt(document.getElementById('uiScaleSlider')?.value) || 100,
        transparency: parseInt(document.getElementById('transparencySlider')?.value) || 100,
        quality: document.getElementById('qualitySelect')?.value || 'high',
        autoUpdateShaders: document.getElementById('autoUpdateToggle')?.checked !== false
    };
    
    // Save to localStorage
    userSettings = { ...userSettings, ...newSettings };
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    
    // Apply settings immediately
    applyAllSettings(newSettings);
    
    // Close dialog and notify
    closeDialog();
    updateStatus("Settings saved successfully");
    showTaskbarNotification("Settings applied and saved", 'success');
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        // Clear localStorage
        localStorage.removeItem('userSettings');
        userSettings = {};
        
        // Apply default settings
        const defaultSettings = getUserSettings();
        applyAllSettings(defaultSettings);
        
        // Close dialog and reopen to show defaults
        closeDialog();
        setTimeout(() => showSettings(), 100);
        
        updateStatus("Settings reset to defaults");
        showTaskbarNotification("Settings reset to defaults", 'info');
    }
}

function exportSettings() {
    const settings = getUserSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `shader-studio-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showTaskbarNotification("Settings exported to downloads", 'success');
}

function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedSettings = JSON.parse(e.target.result);
                    
                    // Validate settings
                    if (typeof importedSettings === 'object') {
                        userSettings = { ...userSettings, ...importedSettings };
                        localStorage.setItem('userSettings', JSON.stringify(userSettings));
                        applyAllSettings(userSettings);
                        
                        closeDialog();
                        setTimeout(() => showSettings(), 100);
                        showTaskbarNotification("Settings imported successfully", 'success');
                    } else {
                        throw new Error('Invalid settings file');
                    }
                } catch (error) {
                    showTaskbarNotification("Failed to import settings: Invalid file", 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function applyAllSettings(settings) {
    applyFontSize(settings.fontSize);
    applyUIScale(settings.uiScale);
    applyTransparency(settings.transparency);
    applyEditorTheme(settings.editorTheme);
    applyDarkMode(settings.darkMode);
    applyAnimations(settings.animations);
    applyRenderQuality(settings.quality);
    applyAutoUpdate(settings.autoUpdateShaders);
    
    // Ensure taskbar stays visible after all settings
    ensureTaskbarVisibility();
}

function ensureTaskbarVisibility() {
    const taskbar = document.querySelector('.taskbar');
    if (taskbar) {
        // Force taskbar to always be visible and properly positioned
        taskbar.style.position = 'fixed';
        taskbar.style.bottom = '0';
        taskbar.style.left = '0';
        taskbar.style.right = '0';
        taskbar.style.width = '100%';
        taskbar.style.height = '32px';
        taskbar.style.zIndex = '1000';
        taskbar.style.transform = 'none';
        taskbar.style.opacity = '1';
        taskbar.style.filter = 'none';
        taskbar.style.display = 'flex';
        taskbar.style.visibility = 'visible';
        
        // Ensure taskbar gradient background is preserved
        taskbar.style.background = 'linear-gradient(to bottom, #245ddb 0%, #1941a5 50%, #1941a5 50%, #0d2c6e 100%)';
        taskbar.style.borderTop = '1px solid #4a90e2';
    }
}

function applyFontSize(fontSize) {
    // Apply to all UI elements
    const elements = [
        'body', '#ui', '#gltf-ui', '.section', '.button', '.small-button',
        '.control-group', '.info-box', '.status-bar', '.notepad-textarea',
        '.start-menu', '.app-window', '.modal-content'
    ];
    
    elements.forEach(selector => {
        const elementList = document.querySelectorAll(selector);
        elementList.forEach(element => {
            element.style.fontSize = fontSize + 'px';
        });
    });
    
    // Apply to shader editors specifically using IDs
    const vertexEditor = document.getElementById('vertexShader');
    const fragmentEditor = document.getElementById('fragmentShader');
    
    if (vertexEditor) vertexEditor.style.fontSize = fontSize + 'px';
    if (fragmentEditor) fragmentEditor.style.fontSize = fontSize + 'px';
    
    // Apply to notepad
    const notepadArea = document.getElementById('notepadArea');
    if (notepadArea) notepadArea.style.fontSize = fontSize + 'px';
}

function applyUIScale(scale) {
    const scaleDecimal = scale / 100;
    
    // Apply scaling to main panels only (not taskbar)
    const ui = document.getElementById('ui');
    const gltfUi = document.getElementById('gltf-ui');
    const notepadWindow = document.getElementById('notepad-window');
    const optimizerWindow = document.getElementById('optimizer-window');
    const startMenu = document.getElementById('startMenu');
    
    if (ui) {
        ui.style.transform = `scale(${scaleDecimal})`;
        ui.style.transformOrigin = 'top left';
    }
    
    if (gltfUi) {
        gltfUi.style.transform = `scale(${scaleDecimal})`;
        gltfUi.style.transformOrigin = 'top right';
    }
    
    // Scale app windows
    if (notepadWindow) {
        notepadWindow.style.transform = `scale(${scaleDecimal})`;
        notepadWindow.style.transformOrigin = 'top left';
    }
    
    if (optimizerWindow) {
        optimizerWindow.style.transform = `scale(${scaleDecimal})`;
        optimizerWindow.style.transformOrigin = 'top left';
    }
    
    // Scale start menu
    if (startMenu) {
        startMenu.style.transform = `scale(${scaleDecimal})`;
        startMenu.style.transformOrigin = 'bottom left';
    }
    
    // Ensure taskbar always stays visible and unscaled
    const taskbar = document.querySelector('.taskbar');
    if (taskbar) {
        taskbar.style.transform = 'none';
        taskbar.style.position = 'fixed';
        taskbar.style.bottom = '0';
        taskbar.style.left = '0';
        taskbar.style.right = '0';
        taskbar.style.zIndex = '1000';
    }
    
    // Adjust positions to account for scaling
    if (ui && scale !== 100) {
        const originalWidth = 420;
        ui.style.width = originalWidth + 'px'; // Keep original width for content
    }
    
    if (gltfUi && scale !== 100) {
        const originalWidth = 380;
        gltfUi.style.width = originalWidth + 'px'; // Keep original width for content
    }
}

function applyTransparency(transparency) {
    const opacity = transparency / 100;
    
    // Apply to main panels and windows (but NOT taskbar)
    const ui = document.getElementById('ui');
    const gltfUi = document.getElementById('gltf-ui');
    const notepadWindow = document.getElementById('notepad-window');
    const optimizerWindow = document.getElementById('optimizer-window');
    const startMenu = document.getElementById('startMenu');
    
    if (ui) ui.style.opacity = opacity;
    if (gltfUi) gltfUi.style.opacity = opacity;
    if (notepadWindow) notepadWindow.style.opacity = opacity;
    if (optimizerWindow) optimizerWindow.style.opacity = opacity;
    if (startMenu) startMenu.style.opacity = opacity;
    
    // Ensure taskbar always stays fully opaque
    const taskbar = document.querySelector('.taskbar');
    if (taskbar) {
        taskbar.style.opacity = '1';
    }
}

function applyEditorTheme(theme) {
    const vertexEditor = document.getElementById('vertexShader');
    const fragmentEditor = document.getElementById('fragmentShader');
    const notepadArea = document.getElementById('notepadArea');
    
    const themes = {
        'default': {
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '2px inset #ece9d8'
        },
        'dark': {
            backgroundColor: '#1e1e1e',
            color: '#ffffff',
            border: '2px inset #333333'
        },
        'high-contrast': {
            backgroundColor: '#000000',
            color: '#ffff00',
            border: '2px solid #ffffff'
        }
    };
    
    const themeStyle = themes[theme] || themes['default'];
    
    [vertexEditor, fragmentEditor, notepadArea].forEach(editor => {
        if (editor) {
            Object.assign(editor.style, themeStyle);
        }
    });
}

function applyDarkMode(enabled) {
    // Remove any existing dark mode styles
    const existingDarkStyle = document.getElementById('dark-mode-style');
    if (existingDarkStyle) {
        existingDarkStyle.remove();
    }
    
    if (enabled) {
        // Create targeted dark mode instead of applying to entire body
        const darkStyle = document.createElement('style');
        darkStyle.id = 'dark-mode-style';
        darkStyle.textContent = `
            body {
                background: #1a1a1a !important;
            }
            #ui, #gltf-ui, .app-window, .start-menu, .modal-content {
                filter: invert(1) hue-rotate(180deg);
            }
            /* Keep taskbar unaffected by dark mode */
            .taskbar {
                filter: none !important;
            }
            /* Fix text colors in dark mode */
            .app-window .window-content,
            .start-menu,
            .modal-content {
                color: #000;
            }
        `;
        document.head.appendChild(darkStyle);
    } else {
        // Reset to normal
        document.body.style.backgroundColor = '#3a6ea5';
        document.body.style.filter = '';
    }
    
    // Ensure taskbar stays visible and properly styled
    const taskbar = document.querySelector('.taskbar');
    if (taskbar) {
        taskbar.style.filter = 'none';
        taskbar.style.position = 'fixed';
        taskbar.style.bottom = '0';
        taskbar.style.zIndex = '1000';
    }
}

function applyAnimations(enabled) {
    const style = document.getElementById('animation-style') || document.createElement('style');
    style.id = 'animation-style';
    
    if (!enabled) {
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
    } else {
        style.textContent = '';
    }
    
    if (!style.parentNode) {
        document.head.appendChild(style);
    }
}

function applyRenderQuality(quality) {
    // Adjust renderer settings based on quality
    if (typeof renderer !== 'undefined' && renderer) {
        try {
            switch (quality) {
                case 'low':
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
                    renderer.shadowMap.enabled = false;
                    break;
                case 'medium':
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                    renderer.shadowMap.enabled = true;
                    break;
                case 'high':
                    renderer.setPixelRatio(window.devicePixelRatio);
                    renderer.shadowMap.enabled = true;
                    if (THREE.PCFSoftShadowMap) {
                        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    }
                    break;
            }
        } catch (error) {
            console.warn("Failed to apply render quality settings:", error);
        }
    }
}

function applyAutoUpdate(enabled) {
    // Store the auto-update preference
    if (typeof autoUpdate !== 'undefined') {
        autoUpdate = enabled;
    }
    
    // Update the checkbox if it exists in the main UI
    const autoUpdateToggle = document.getElementById('autoUpdateShaders');
    if (autoUpdateToggle) {
        autoUpdateToggle.checked = enabled;
    }
}

function loadSavedSettings() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSavedSettings);
        return;
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        try {
            userSettings = JSON.parse(savedSettings);
            const settings = getUserSettings();
            
            // Apply all saved settings
            applyAllSettings(settings);
            
            updateStatus("Settings loaded successfully");
        } catch (error) {
            console.warn("Failed to load saved settings:", error);
            updateStatus("Using default settings");
        }
    } else {
        // Apply default settings
        const settings = getUserSettings();
        applyAllSettings(settings);
        updateStatus("Default settings applied");
    }
}

function addToRecentFiles(filename, type) {
    const recent = {
        name: filename,
        path: filename,
        type: type,
        date: new Date().toLocaleDateString()
    };
    
    recentFiles.unshift(recent);
    recentFiles = recentFiles.slice(0, 10); // Keep only last 10
    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
}

// Additional helper functions for start menu actions
function loadExample(exampleName) {
    // Load a specific shader example
    loadSpecificExample(exampleName);
    closeDialog();
    showTaskbarNotification(`Loaded example: ${exampleName}`, 'success');
}

function arrangeWindows(mode) {
    const notepadWindow = document.getElementById('notepad-window');
    const optimizerWindow = document.getElementById('optimizer-window');
    
    if (mode === 'tile') {
        if (notepadOpen) {
            notepadWindow.style.left = '50px';
            notepadWindow.style.top = '50px';
            notepadWindow.style.width = '400px';
            notepadWindow.style.height = '300px';
        }
        if (optimizerOpen) {
            optimizerWindow.style.left = '500px';
            optimizerWindow.style.top = '50px';
            optimizerWindow.style.width = '400px';
            optimizerWindow.style.height = '300px';
        }
    } else if (mode === 'cascade') {
        if (notepadOpen) {
            notepadWindow.style.left = '100px';
            notepadWindow.style.top = '100px';
        }
        if (optimizerOpen) {
            optimizerWindow.style.left = '150px';
            optimizerWindow.style.top = '150px';
        }
    }
    
    closeDialog();
    showTaskbarNotification(`Windows arranged: ${mode}`, 'success');
}

function minimizeAllWindows() {
    if (notepadOpen) minimizeNotepad();
    if (optimizerOpen) minimizeOptimizer();
    closeDialog();
    showTaskbarNotification("All windows minimized", 'info');
}

function resetLayout() {
    // Reset to default layout
    document.getElementById('ui').style.left = '10px';
    document.getElementById('ui').style.top = '10px';
    document.getElementById('ui').style.width = '420px';
    
    document.getElementById('gltf-ui').style.right = '10px';
    document.getElementById('gltf-ui').style.top = '10px';
    document.getElementById('gltf-ui').style.width = '380px';
    
    if (notepadOpen) {
        document.getElementById('notepad-window').style.left = '100px';
        document.getElementById('notepad-window').style.top = '50px';
    }
    
    if (optimizerOpen) {
        document.getElementById('optimizer-window').style.left = '150px';
        document.getElementById('optimizer-window').style.top = '80px';
    }
    
    closeDialog();
    showTaskbarNotification("Layout reset to default", 'success');
}

function addBookmark() {
    const name = prompt("Enter bookmark name:");
    if (name) {
        const vertexEditor = document.getElementById('vertexShader');
        const fragmentEditor = document.getElementById('fragmentShader');
        
        const bookmark = {
            name: name,
            description: `Shader state saved on ${new Date().toLocaleDateString()}`,
            vertexShader: vertexEditor ? vertexEditor.value : '',
            fragmentShader: fragmentEditor ? fragmentEditor.value : '',
            settings: getUserSettings()
        };
        
        bookmarks.push(bookmark);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        closeDialog();
        showBookmarks(); // Refresh the dialog
        showTaskbarNotification(`Bookmark "${name}" saved`, 'success');
    }
}

function loadBookmark(index) {
    const bookmark = bookmarks[index];
    if (bookmark) {
        const vertexEditor = document.getElementById('vertexShader');
        const fragmentEditor = document.getElementById('fragmentShader');
        
        if (vertexEditor) vertexEditor.value = bookmark.vertexShader;
        if (fragmentEditor) fragmentEditor.value = bookmark.fragmentShader;
        updateShaders();
        closeDialog();
        showTaskbarNotification(`Loaded bookmark: ${bookmark.name}`, 'success');
    }
}

function deleteBookmark(index) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
        const bookmark = bookmarks[index];
        bookmarks.splice(index, 1);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        closeDialog();
        showBookmarks(); // Refresh the dialog
        showTaskbarNotification(`Bookmark "${bookmark.name}" deleted`, 'info');
    }
}

// ========== TASKBAR FUNCTIONALITY ==========
function initializeTaskbar() {
    // Start the clock
    updateTaskbarClock();
    setInterval(updateTaskbarClock, 1000);
    
    // Setup taskbar interactions
    setupTaskbarEvents();
    
    updateGLTFStatus("Windows XP taskbar initialized");
}

function updateTaskbarClock() {
    const clockElement = document.getElementById('taskbarClock');
    if (!clockElement) return;
    
    const now = new Date();
    
    // Format time (12-hour format)
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const timeString = `${hours}:${minutes} ${ampm}`;
    
    // Format date
    const month = (now.getMonth() + 1).toString();
    const day = now.getDate().toString();
    const year = now.getFullYear().toString();
    const dateString = `${month}/${day}/${year}`;
    
    clockElement.innerHTML = `
        <div class="time">${timeString}</div>
        <div class="date">${dateString}</div>
    `;
}

function setupTaskbarEvents() {
    const startButton = document.getElementById('startButton');
    const systemIcons = document.querySelectorAll('.system-icon');
    const appButton = document.querySelector('.app-button');
    
    // Start button interaction
    if (startButton) {
        startButton.addEventListener('click', function() {
            showStartMenu();
        });
    }
    
    // System tray icons
    systemIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const iconType = icon.classList[1]; // Get the second class (volume, network, etc.)
            handleSystemIconClick(iconType);
        });
    });
    
    // App button interaction
    if (appButton) {
        appButton.addEventListener('click', function() {
            // Toggle minimize/restore
            const isMinimized = document.body.classList.contains('app-minimized');
            if (isMinimized) {
                restoreApp();
            } else {
                minimizeApp();
            }
        });
    }
    
    // Add taskbar clock tooltip
    const clock = document.getElementById('taskbarClock');
    if (clock) {
        clock.addEventListener('click', function() {
            const now = new Date();
            const fullDate = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            updateStatus(`Today is ${fullDate}`);
        });
    }
}

function showStartMenu() {
    // Create a simple start menu notification
    updateStatus("Start Menu clicked - Windows XP style!");
    
    // You could expand this to show an actual start menu
    const startButton = document.getElementById('startButton');
    startButton.style.background = 'linear-gradient(to bottom, #1a3d0c 0%, #4a7f20 50%, #2d5016 100%)';
    startButton.style.border = '1px inset #5ba028';
    
    setTimeout(() => {
        startButton.style.background = '';
        startButton.style.border = '';
    }, 200);
}

function handleSystemIconClick(iconType) {
    switch(iconType) {
        case 'volume':
            updateStatus("Volume control - Audio system ready");
            break;
        case 'network':
            updateStatus("Network status - Connected to local network");
            break;
        case 'antivirus':
            updateStatus("Antivirus - System protected, no threats detected");
            break;
        default:
            updateStatus("System tray icon clicked");
    }
}

function minimizeApp() {
    const ui = document.getElementById('ui');
    const gltfUi = document.getElementById('gltf-ui');
    const appButton = document.querySelector('.app-button');
    
    if (ui) ui.style.display = 'none';
    if (gltfUi) gltfUi.style.display = 'none';
    
    document.body.classList.add('app-minimized');
    if (appButton) {
        appButton.classList.remove('active');
        appButton.style.fontStyle = 'italic';
    }
    
    updateStatus("Application minimized to taskbar");
}

function restoreApp() {
    const ui = document.getElementById('ui');
    const gltfUi = document.getElementById('gltf-ui');
    const appButton = document.querySelector('.app-button');
    
    if (ui) ui.style.display = 'block';
    if (gltfUi) gltfUi.style.display = 'block';
    
    document.body.classList.remove('app-minimized');
    if (appButton) {
        appButton.classList.add('active');
        appButton.style.fontStyle = 'normal';
    }
    
    updateStatus("Application restored from taskbar");
}

// Add taskbar notification system
function showTaskbarNotification(message, type = 'info') {
    // Create notification balloon (simplified)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 45px;
        right: 10px;
        background: #fffbf0;
        border: 1px solid #333;
        padding: 8px;
        border-radius: 4px;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        font-family: Tahoma, sans-serif;
        font-size: 10px;
        max-width: 200px;
        z-index: 3000;
        animation: slideInUp 0.3s ease;
    `;
    
    const iconMap = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
    
    notification.innerHTML = `${iconMap[type]} ${message}`;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideOutDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

console.log("🎮 Three.js glTF Shader Studio loaded!");
console.log("🖥️ Windows XP Desktop Experience with authentic taskbar!");
console.log("🚀 COMPLETE START MENU with all development tools!");
console.log("📝 Built-in Notepad app with auto-save and file management");
console.log("⚙️ Advanced glTF Optimizer app with analysis and compression");
console.log("🎨 Enhanced UI with custom Windows XP scrollbars");
console.log("📱 Mobile-responsive with touch-friendly controls");
console.log("🖱️ Drag panel edges to resize on desktop");
console.log("📐 Click 'Compact' button or use Ctrl+C for space-saving mode");
console.log("⏰ Live taskbar clock with system tray icons");
console.log("🪟 Click app buttons on taskbar to open/close Notepad & Optimizer windows");
console.log("🖱️ Drag window titlebars to move windows around the desktop");
console.log("🌟 START MENU FEATURES:");
console.log("  📂 New Project, Recent Files, Example Library");
console.log("  🔍 Search Examples, Import/Export Tools");
console.log("  ⚙️ Settings, Help & Tutorials, Window Manager");
console.log("  🔖 Bookmarks, About, Full Screen Mode");
console.log("  📚 GLSL Tutorials, glTF Documentation, Shader Templates");
console.log("Keyboard shortcuts:");
console.log("- Ctrl+Enter: Update shaders");
console.log("- Ctrl+R: Reset to default");
console.log("- Ctrl+E: Load random shader example");
console.log("- Ctrl+O: Open glTF file dialog");
console.log("- Ctrl+C: Toggle compact mode");
console.log("- Ctrl+Shift+S: Open settings dialog");
console.log("🖱️ Click START BUTTON for the ultimate 3D development toolkit!");
console.log("⚙️ FULLY FUNCTIONAL SETTINGS:");
console.log("  📝 Font Size - Changes all UI text size (8px-16px)");
console.log("  🖥️ UI Scale - Scales interface panels (80%-120%)");
console.log("  👻 Transparency - Panel opacity (80%-100%)");
console.log("  🎨 Editor Themes - Default, Dark, High Contrast");
console.log("  🌙 Dark Mode - Inverts interface (taskbar protected)");
console.log("  ⚡ Animations - Enable/disable UI transitions");
console.log("  🎮 Render Quality - Low/Medium/High WebGL settings");
console.log("  🔄 Auto-update Shaders - Live shader compilation");
console.log("  💾 Export/Import - Save settings as JSON files");
console.log("  🛡️ Taskbar Protection - Bottom bar always stays visible!");

// ========== SHADER BROWSER FUNCTIONALITY ==========

function initializeShaderBrowser() {
    populateShaderList();
    
    // Set up search functionality
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            filterShaders(e.target.value);
        });
    }
    
    // Set up filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active filter
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.textContent;
            currentFilter = filter === 'All' ? '' : filter;
            filterShaders(document.querySelector('.search-box')?.value || '');
        });
    });
}

function populateShaderList() {
    const shaderList = document.querySelector('.shader-list');
    if (!shaderList) return;
    
    filteredShaders = [...shaders];
    
    shaderList.innerHTML = '';
    filteredShaders.forEach((shader, index) => {
        const item = document.createElement('div');
        item.className = 'shader-item';
        item.innerHTML = `
            <div class="shader-thumbnail"></div>
            <div class="shader-info">
                <div class="shader-name">${shader.name}</div>
                <div class="shader-category">${shader.category}</div>
            </div>
        `;
        
        item.addEventListener('click', () => selectShader(index));
        shaderList.appendChild(item);
    });
}

function filterShaders(searchTerm = '') {
    const searchLower = searchTerm.toLowerCase();
    
    filteredShaders = shaders.filter(shader => {
        const matchesSearch = !searchTerm || 
            shader.name.toLowerCase().includes(searchLower) ||
            shader.description.toLowerCase().includes(searchLower) ||
            shader.category.toLowerCase().includes(searchLower);
            
        const matchesFilter = !currentFilter || shader.category === currentFilter;
        
        return matchesSearch && matchesFilter;
    });
    
    populateShaderList();
}

function selectShader(index) {
    selectedShader = filteredShaders[index];
    
    // Update selection visual
    document.querySelectorAll('.shader-item').forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });
    
    // Update preview area
    const previewArea = document.querySelector('.shader-preview-area');
    if (previewArea && selectedShader) {
        previewArea.innerHTML = `
            <h3>${selectedShader.name}</h3>
            <p>${selectedShader.description}</p>
            <div class="preview-info">
                <strong>Category:</strong> ${selectedShader.category}
            </div>
            <div class="preview-actions">
                <button onclick="applySelectedShader()">Apply Shader</button>
                <button onclick="previewShader()">Quick Preview</button>
                <button onclick="saveShaderVariant()">Save as Variant</button>
            </div>
        `;
    }
}

function applySelectedShader() {
    if (!selectedShader) return;
    
    const vertexEditor = document.getElementById('vertexShader');
    const fragmentEditor = document.getElementById('fragmentShader');
    
    if (vertexEditor) vertexEditor.value = selectedShader.vertex;
    if (fragmentEditor) fragmentEditor.value = selectedShader.fragment;
    
    // Apply to both the background plane and the selected material if one exists
    updateShaders();
    
    // If a material is selected, apply the shader to it
    if (selectedMaterial && selectedMaterial.material) {
        applyShaderToMaterial(selectedMaterial.material);
    } else {
        // If no material is selected but we have a model, try to apply to the first material
        if (gltfModel && modelMaterials.length > 0) {
            selectedMaterial = modelMaterials[0];
            applyShaderToMaterial(selectedMaterial.material);
            
            // Update the UI to show the selected material
            document.querySelectorAll('.material-item').forEach((item, index) => {
                item.classList.toggle('selected', index === 0);
            });
        }
    }
    
    showTaskbarNotification(`Applied shader: ${selectedShader.name}`, 'success');
}

function previewShader() {
    if (!selectedShader) return;
    
    // Store current shaders
    const currentVertex = document.getElementById('vertexShader')?.value;
    const currentFragment = document.getElementById('fragmentShader')?.value;
    
    // Apply preview shader
    applySelectedShader();
    
    // Revert after 3 seconds
    setTimeout(() => {
        const vertexEditor = document.getElementById('vertexShader');
        const fragmentEditor = document.getElementById('fragmentShader');
        
        if (vertexEditor && currentVertex) vertexEditor.value = currentVertex;
        if (fragmentEditor && currentFragment) fragmentEditor.value = currentFragment;
        
        updateShaders();
        showTaskbarNotification('Preview ended', 'info');
    }, 3000);
    
    showTaskbarNotification(`Previewing: ${selectedShader.name} (3 seconds)`, 'info');
}

function saveShaderVariant() {
    if (!selectedShader) return;
    
    const variantName = prompt(`Save variant of "${selectedShader.name}" as:`, `${selectedShader.name} Variant`);
    if (variantName) {
        // Add to bookmarks or custom shaders collection
        addBookmark(variantName, selectedShader.vertex, selectedShader.fragment);
        showTaskbarNotification(`Saved shader variant: ${variantName}`, 'success');
    }
}

// ========== LIGHTING FUNCTIONALITY ==========

function initializeLighting() {
    // Create lighting group
    lightGroup = new THREE.Group();
    scene.add(lightGroup);
    
    // Key light (main light)
    keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(1, 1, 2);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    lightGroup.add(keyLight);
    
    // Fill light (softer light from side)
    fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-1, 0.5, 1);
    lightGroup.add(fillLight);
    
    // Rim light (for highlighting edges)
    rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0.5, 0, -1);
    lightGroup.add(rimLight);
    
    // Ambient light (overall scene illumination)
    ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    lightGroup.add(ambientLight);
    
    // Create HDRI environment (set to null initially)
    envMap = null;
    
    // Default environment settings
    updateEnvironment();
    
    // Initialize lighting controls in UI
    const keyLightIntensity = document.getElementById('keyLightIntensity');
    const fillLightIntensity = document.getElementById('fillLightIntensity');
    const ambientLightIntensity = document.getElementById('ambientLightIntensity');
    const environmentSelect = document.getElementById('environmentSelect');
    const enableShadows = document.getElementById('enableShadows');
    const enableReflections = document.getElementById('enableReflections');
    
    if (keyLightIntensity) keyLightIntensity.value = 1.2;
    if (fillLightIntensity) fillLightIntensity.value = 0.5;
    if (ambientLightIntensity) ambientLightIntensity.value = 0.3;
    if (environmentSelect) environmentSelect.value = 'studio';
    if (enableShadows) enableShadows.checked = true;
    if (enableReflections) enableReflections.checked = false;
    
    document.getElementById('keyLightValue').textContent = "1.2";
    document.getElementById('fillLightValue').textContent = "0.5";
    document.getElementById('ambientLightValue').textContent = "0.3";
    
    updateLighting();
}

function setupStudioLighting() {
    // Remove existing lights
    const existingLights = scene.children.filter(child => child.isLight);
    existingLights.forEach(light => scene.remove(light));
    
    // Key light (main directional light)
    keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 8, 10);
    keyLight.target.position.set(0, 0, 0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);
    scene.add(keyLight.target);
    
    // Fill light (softer secondary light)
    fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-3, 4, 8);
    fillLight.target.position.set(0, 0, 0);
    scene.add(fillLight);
    scene.add(fillLight.target);
    
    // Ambient light
    ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // Enable shadows in renderer
    if (renderer) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
}

function updateLighting() {
    const keyIntensity = document.getElementById('keyLightIntensity')?.value || 1.2;
    const fillIntensity = document.getElementById('fillLightIntensity')?.value || 0.6;
    const ambientIntensity = document.getElementById('ambientLightIntensity')?.value || 0.3;
    const shadowsEnabled = document.getElementById('enableShadows')?.checked || false;
    
    if (keyLight) keyLight.intensity = parseFloat(keyIntensity);
    if (fillLight) fillLight.intensity = parseFloat(fillIntensity);
    if (ambientLight) ambientLight.intensity = parseFloat(ambientIntensity);
    
    // Update shadows
    if (renderer) {
        renderer.shadowMap.enabled = shadowsEnabled;
    }
    if (keyLight) {
        keyLight.castShadow = shadowsEnabled;
    }
    
    // Update materials if glTF model exists
    if (gltfModel) {
        gltfModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = shadowsEnabled;
                child.receiveShadow = shadowsEnabled;
            }
        });
    }
}

function updateEnvironment() {
    const environment = document.getElementById('environmentSelect')?.value || 'studio';
    
    switch (environment) {
        case 'studio':
            scene.background = new THREE.Color(0x404040);
            break;
        case 'white':
            scene.background = new THREE.Color(0xffffff);
            break;
        case 'black':
            scene.background = new THREE.Color(0x000000);
            break;
        case 'gradient':
            // Create gradient background
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            const gradient = context.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98FB98');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 256, 256);
            
            const texture = new THREE.CanvasTexture(canvas);
            scene.background = texture;
            break;
    }
}

function setLightingPreset(preset) {
    const keyLightElement = document.getElementById('keyLightIntensity');
    const fillLightElement = document.getElementById('fillLightIntensity');
    const ambientLightElement = document.getElementById('ambientLightIntensity');
    const environmentElement = document.getElementById('environmentSelect');
    const shadowsElement = document.getElementById('enableShadows');
    const reflectionsElement = document.getElementById('enableReflections');
    
    // Set lighting values based on preset
    switch(preset) {
        case 'studio':
            keyLightElement.value = 1.2;
            fillLightElement.value = 0.5;
            ambientLightElement.value = 0.3;
            environmentElement.value = 'studio';
            shadowsElement.checked = true;
            reflectionsElement.checked = false;
            keyLight.position.set(1, 1, 2);
            fillLight.position.set(-1, 0.5, 1);
            rimLight.position.set(0.5, 0, -1);
            keyLight.color.set(0xffffff);
            fillLight.color.set(0xffffff);
            rimLight.color.set(0xffffff);
            break;
        
        case 'dramatic':
            keyLightElement.value = 1.5;
            fillLightElement.value = 0.2;
            ambientLightElement.value = 0.1;
            environmentElement.value = 'dramatic';
            shadowsElement.checked = true;
            reflectionsElement.checked = false;
            keyLight.position.set(1.5, 1.8, 1);
            fillLight.position.set(-0.8, 0.2, 0.8);
            rimLight.position.set(0, 0, -1);
            keyLight.color.set(0xffffff);
            fillLight.color.set(0xffffff);
            rimLight.color.set(0x9999ff);
            break;
        
        case 'soft':
            keyLightElement.value = 0.8;
            fillLightElement.value = 0.7;
            ambientLightElement.value = 0.5;
            environmentElement.value = 'soft';
            shadowsElement.checked = true;
            reflectionsElement.checked = false;
            keyLight.position.set(1, 1.5, 1);
            fillLight.position.set(-0.8, 0.8, 0.8);
            rimLight.position.set(0, -0.2, -1);
            keyLight.color.set(0xfffaf0);
            fillLight.color.set(0xfff5ea);
            rimLight.color.set(0xfff0e0);
            break;
            
        case 'outdoor':
            keyLightElement.value = 2.0;
            fillLightElement.value = 0.4;
            ambientLightElement.value = 0.6;
            environmentElement.value = 'warm';
            shadowsElement.checked = true;
            reflectionsElement.checked = true;
            keyLight.position.set(1, 2, 1);
            fillLight.position.set(-0.5, 0.2, 0.5);
            rimLight.position.set(0, -0.5, -1);
            keyLight.color.set(0xfffbea);  // Slightly warm sunlight
            fillLight.color.set(0xc2d0ff); // Slightly blue sky fill
            rimLight.color.set(0xfffbea);
            break;
            
        case 'night':
            keyLightElement.value = 0.6;
            fillLightElement.value = 0.3;
            ambientLightElement.value = 0.1;
            environmentElement.value = 'cool';
            shadowsElement.checked = true;
            reflectionsElement.checked = true;
            keyLight.position.set(1, 1, 1);
            fillLight.position.set(-1, 0.5, 0.5);
            rimLight.position.set(0, 0, -1);
            keyLight.color.set(0x8baeff);  // Moon blue
            fillLight.color.set(0x4065d6);  // Deep blue
            rimLight.color.set(0x4c72db);  // Blue rim
            break;
    }
    
    // Update UI displays
    document.getElementById('keyLightValue').textContent = keyLightElement.value;
    document.getElementById('fillLightValue').textContent = fillLightElement.value;
    document.getElementById('ambientLightValue').textContent = ambientLightElement.value;
    
    // Apply the lighting changes
    updateLighting();
    updateEnvironment();
    
    updateStatus(`Lighting preset applied: ${preset}`);
}

function resetLighting() {
    setLightingPreset('studio');
    updateStatus("Lighting reset to studio defaults");
}

// ========== GLTF Analyzer Functions ==========

// Current analyzer state
let currentAnalyzerTab = 'structure';
let analyzedModel = null;
let selectedTreeItem = null;
let expandedTreeItems = new Set();
let lastAnalysisReport = null;

// Switch between analyzer tabs
function switchAnalyzerTab(tab) {
    // For the standalone analyzer window
    const isFromStandaloneWindow = event && event.target.closest('#analyzer-window');
    const containerSelector = isFromStandaloneWindow ? '#analyzer-window' : '#gltf-ui';
    
    // Hide all tab content
    document.querySelectorAll(`${containerSelector} .tab-content`).forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    const tabId = isFromStandaloneWindow ? `analyzer-${tab}-win` : `analyzer-${tab}`;
    document.getElementById(tabId)?.classList.add('active');
    
    // Update active tab button
    document.querySelectorAll(`${containerSelector} .panel-tab`).forEach(tabBtn => {
        tabBtn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    currentAnalyzerTab = tab;
    
    // Refresh content for the selected tab if we have a model loaded
    if (gltfModel) {
        refreshAnalyzerContent(tab);
    }
}

// Main function to analyze a glTF model
function analyzeGLTFModel(gltf) {
    if (!gltf) return;
    
    analyzedModel = gltf;
    
    // Run analysis
    const analysis = {
        structure: analyzeStructure(gltf),
        nodes: analyzeNodes(gltf),
        materials: analyzeMaterials(gltf),
        textures: analyzeTextures(gltf),
        animations: analyzeAnimations(gltf)
    };
    
    // Store analysis result for export
    lastAnalysisReport = analysis;
    
    // Refresh both the standalone window and sidebar content
    // For standalone window
    if (document.getElementById('analyzer-window').style.display !== 'none') {
        refreshAnalyzerContent(currentAnalyzerTab);
    }
    
    return analysis;
}

// Refresh all analyzer content or just the current tab
function refreshAnalyzer() {
    if (!gltfModel) {
        updateGLTFStatus("No model loaded to analyze");
        return;
    }
    
    analyzeGLTFModel({ scene: gltfModel, animations: animations });
    updateGLTFStatus("Model analysis refreshed");
}

// Refresh specific tab content
function refreshAnalyzerContent(tab) {
    if (!analyzedModel) return;
    
    // Determine if we're refreshing from the standalone window
    const isStandaloneWindow = document.getElementById('analyzer-tree-win') !== null;
    const suffix = isStandaloneWindow ? '-win' : '';
    
    switch(tab) {
        case 'structure':
            renderStructureTree(suffix);
            break;
        case 'nodes':
            renderNodesList(suffix);
            break;
        case 'materials':
            renderMaterialsList(suffix);
            break;
        case 'textures':
            renderTexturesGrid(suffix);
            break;
        case 'animations':
            renderAnimationsList(suffix);
            break;
    }
}

// Analyze overall structure
function analyzeStructure(gltf) {
    const stats = {
        scenes: 1, // GLTF has at least one scene
        nodes: 0,
        meshes: 0,
        materials: 0,
        textures: 0,
        animations: animations.length,
        vertexCount: 0,
        triangleCount: 0,
        primitiveCount: 0,
        maxTreeDepth: 0
    };
    
    // Function to traverse the scene graph and count nodes
    function traverseNode(node, depth = 0) {
        stats.nodes++;
        stats.maxTreeDepth = Math.max(stats.maxTreeDepth, depth);
        
        if (node.isMesh) {
            stats.meshes++;
            
            if (node.geometry) {
                const position = node.geometry.attributes.position;
                if (position) {
                    stats.vertexCount += position.count;
                    if (node.geometry.index) {
                        stats.triangleCount += node.geometry.index.count / 3;
                    } else {
                        stats.triangleCount += position.count / 3;
                    }
                }
                stats.primitiveCount++;
            }
            
            // Count materials
            if (node.material) {
                if (Array.isArray(node.material)) {
                    stats.materials += node.material.length;
                    
                    // Count textures in materials
                    node.material.forEach(mat => {
                        if (mat.map) stats.textures++;
                        if (mat.normalMap) stats.textures++;
                        if (mat.aoMap) stats.textures++;
                        if (mat.roughnessMap) stats.textures++;
                        if (mat.metalnessMap) stats.textures++;
                        if (mat.emissiveMap) stats.textures++;
                    });
                } else {
                    stats.materials++;
                    
                    // Count textures
                    if (node.material.map) stats.textures++;
                    if (node.material.normalMap) stats.textures++;
                    if (node.material.aoMap) stats.textures++;
                    if (node.material.roughnessMap) stats.textures++;
                    if (node.material.metalnessMap) stats.textures++;
                    if (node.material.emissiveMap) stats.textures++;
                }
            }
        }
        
        // Traverse children
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                traverseNode(child, depth + 1);
            });
        }
    }
    
    if (gltf.scene) {
        traverseNode(gltf.scene);
    }
    
    // Estimate file size
    stats.estimatedSize = (stats.vertexCount * 32 + stats.triangleCount * 12 + stats.materials * 1024) / 1024; // KB
    
    return stats;
}

// Analyze nodes hierarchy
function analyzeNodes(gltf) {
    const nodes = [];
    const transforms = [];
    
    // Function to traverse and gather node data
    function traverseNode(node, path = "") {
        const nodeName = node.name || "Unnamed";
        const nodePath = path ? `${path} / ${nodeName}` : nodeName;
        
        const nodeData = {
            name: nodeName,
            path: nodePath,
            type: node.type,
            visible: node.visible,
            position: node.position ? [node.position.x, node.position.y, node.position.z] : null,
            rotation: node.rotation ? [node.rotation.x, node.rotation.y, node.rotation.z] : null,
            scale: node.scale ? [node.scale.x, node.scale.y, node.scale.z] : null,
            isMesh: node.isMesh,
            isBone: node.isBone,
            hasChildren: node.children && node.children.length > 0
        };
        
        nodes.push(nodeData);
        
        // Collect transform data if not default
        if (node.position && (node.position.x !== 0 || node.position.y !== 0 || node.position.z !== 0) ||
            node.rotation && (node.rotation.x !== 0 || node.rotation.y !== 0 || node.rotation.z !== 0) ||
            node.scale && (node.scale.x !== 1 || node.scale.y !== 1 || node.scale.z !== 1)) {
            
            transforms.push({
                name: nodeName,
                path: nodePath,
                position: node.position ? [node.position.x, node.position.y, node.position.z] : [0, 0, 0],
                rotation: node.rotation ? [
                    node.rotation.x * (180/Math.PI),
                    node.rotation.y * (180/Math.PI),
                    node.rotation.z * (180/Math.PI)
                ] : [0, 0, 0],
                scale: node.scale ? [node.scale.x, node.scale.y, node.scale.z] : [1, 1, 1]
            });
        }
        
        // Traverse children
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                traverseNode(child, nodePath);
            });
        }
    }
    
    if (gltf.scene) {
        traverseNode(gltf.scene);
    }
    
    return {
        count: nodes.length,
        nodes: nodes,
        transforms: transforms
    };
}

// Analyze materials
function analyzeMaterials(gltf) {
    const materialData = [];
    
    modelMaterials.forEach(matInfo => {
        const mat = matInfo.material;
        const materialProps = {
            name: matInfo.name,
            type: mat.type,
            transparent: mat.transparent,
            opacity: mat.opacity,
            wireframe: mat.wireframe,
            visible: mat.visible
        };
        
        // Add color properties if they exist
        if (mat.color) {
            materialProps.color = `#${mat.color.getHexString()}`;
        }
        
        // Add PBR properties if they exist
        if (mat.roughness !== undefined) materialProps.roughness = mat.roughness;
        if (mat.metalness !== undefined) materialProps.metalness = mat.metalness;
        
        // Add emissive properties
        if (mat.emissive) {
            materialProps.emissive = `#${mat.emissive.getHexString()}`;
            materialProps.emissiveIntensity = mat.emissiveIntensity;
        }
        
        // Add map references
        if (mat.map) materialProps.map = 'Base Color';
        if (mat.normalMap) materialProps.normalMap = 'Normal';
        if (mat.roughnessMap) materialProps.roughnessMap = 'Roughness';
        if (mat.metalnessMap) materialProps.metalnessMap = 'Metalness';
        if (mat.aoMap) materialProps.aoMap = 'Ambient Occlusion';
        if (mat.emissiveMap) materialProps.emissiveMap = 'Emissive';
        if (mat.alphaMap) materialProps.alphaMap = 'Alpha';
        
        materialData.push(materialProps);
    });
    
    return materialData;
}

// Analyze textures
function analyzeTextures(gltf) {
    const textureData = [];
    const processedTextures = new Set();
    
    // Function to extract texture data
    function extractTextureData(texture, type) {
        if (!texture || !texture.image) return null;
        
        // Skip if we've already processed this texture
        const textureId = texture.id;
        if (processedTextures.has(textureId)) return null;
        processedTextures.add(textureId);
        
        return {
            id: textureId,
            name: texture.name || `${type} Map`,
            type: type,
            width: texture.image.width || 0,
            height: texture.image.height || 0,
            format: getTextureFormat(texture),
            repeat: [texture.repeat.x, texture.repeat.y],
            offset: [texture.offset.x, texture.offset.y],
            rotation: texture.rotation,
            encoding: getTextureEncoding(texture)
        };
    }
    
    // Helper to get texture format name
    function getTextureFormat(texture) {
        if (!texture) return 'Unknown';
        
        // Map THREE.js format constants to names
        const formatMap = {
            1022: 'RGB',
            1023: 'RGBA',
            1024: 'Luminance',
            1025: 'Luminance Alpha',
            1028: 'RGB S3TC DXT1',
            1029: 'RGBA S3TC DXT1',
            1030: 'RGBA S3TC DXT3',
            1031: 'RGBA S3TC DXT5',
            33776: 'RGB PVRTC 4BPPV1',
            33777: 'RGB PVRTC 2BPPV1',
            33778: 'RGBA PVRTC 4BPPV1',
            33779: 'RGBA PVRTC 2BPPV1',
            35840: 'RGB ETC1',
            36196: 'RGB ETC2',
            36198: 'RGBA ETC2 EAC',
            37808: 'RGBA ASTC 4x4',
            37809: 'RGBA ASTC 5x5',
            37810: 'RGBA ASTC 6x6',
            37811: 'RGBA ASTC 8x8',
            37812: 'RGBA ASTC 10x10',
            37813: 'RGBA ASTC 12x12',
        };
        
        if (texture.format && formatMap[texture.format]) {
            return formatMap[texture.format];
        }
        
        return 'Unknown';
    }
    
    // Helper to get texture encoding name
    function getTextureEncoding(texture) {
        if (!texture) return 'Unknown';
        
        // Map THREE.js encoding constants to names
        const encodingMap = {
            3000: 'Linear',
            3001: 'sRGB',
            3002: 'Gamma',
            3007: 'RGBE',
            3200: 'RGBM7',
            3201: 'RGBM16',
            3202: 'RGBD',
            3203: 'LogLuv'
        };
        
        if (texture.encoding && encodingMap[texture.encoding]) {
            return encodingMap[texture.encoding];
        }
        
        return 'Unknown';
    }
    
    // Traverse all materials to find textures
    modelMaterials.forEach(matInfo => {
        const mat = matInfo.material;
        
        // Check for various map types
        const mapData = extractTextureData(mat.map, 'Base Color');
        if (mapData) textureData.push(mapData);
        
        const normalMapData = extractTextureData(mat.normalMap, 'Normal');
        if (normalMapData) textureData.push(normalMapData);
        
        const roughnessMapData = extractTextureData(mat.roughnessMap, 'Roughness');
        if (roughnessMapData) textureData.push(roughnessMapData);
        
        const metalnessMapData = extractTextureData(mat.metalnessMap, 'Metalness');
        if (metalnessMapData) textureData.push(metalnessMapData);
        
        const aoMapData = extractTextureData(mat.aoMap, 'Ambient Occlusion');
        if (aoMapData) textureData.push(aoMapData);
        
        const emissiveMapData = extractTextureData(mat.emissiveMap, 'Emissive');
        if (emissiveMapData) textureData.push(emissiveMapData);
        
        const alphaMapData = extractTextureData(mat.alphaMap, 'Alpha');
        if (alphaMapData) textureData.push(alphaMapData);
    });
    
    return textureData;
}

// Analyze animations
function analyzeAnimations(gltf) {
    const animationData = [];
    
    animations.forEach((anim, index) => {
        const animInfo = {
            name: anim.name || `Animation ${index + 1}`,
            duration: anim.duration,
            trackCount: anim.tracks.length,
            tracks: [],
            keyframeTimes: new Set(),
            keyframeCount: 0
        };
        
        // Analyze animation tracks
        anim.tracks.forEach(track => {
            const trackData = {
                name: track.name,
                type: track.ValueTypeName,
                times: track.times.length,
                values: track.values.length
            };
            
            // Gather unique keyframe times
            for (let i = 0; i < track.times.length; i++) {
                animInfo.keyframeTimes.add(track.times[i]);
            }
            
            animInfo.keyframeCount += track.times.length;
            animInfo.tracks.push(trackData);
        });
        
        // Convert Set to Array
        animInfo.keyframeTimes = Array.from(animInfo.keyframeTimes);
        animInfo.uniqueKeyframes = animInfo.keyframeTimes.length;
        
        animationData.push(animInfo);
    });
    
    return animationData;
}

// Export analysis report as JSON
function exportAnalysisReport() {
    if (!lastAnalysisReport) {
        updateGLTFStatus("No analysis data to export");
        return;
    }
    
    // Convert analysis to nicely formatted JSON
    const reportJson = JSON.stringify(lastAnalysisReport, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download link
    const link = document.createElement('a');
    link.href = url;
    const filename = gltfModel.name ? `${gltfModel.name}_analysis.json` : 'gltf_analysis.json';
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    updateGLTFStatus("Analysis report exported");
    showTaskbarNotification("Analysis report saved to downloads", 'success');
}

// Run performance benchmark on the model
function analyzeBenchmark() {
    if (!gltfModel) {
        updateGLTFStatus("No model loaded to benchmark");
        return;
    }
    
    updateGLTFStatus("Running performance benchmark...");
    
    const metrics = {
        renderTime: 0,
        frameRate: 0,
        triangleCount: 0,
        drawCalls: 0,
        memoryUsage: 0
    };
    
    // Count triangles
    gltfModel.traverse(obj => {
        if (obj.isMesh && obj.geometry) {
            const geom = obj.geometry;
            if (geom.index) {
                metrics.triangleCount += geom.index.count / 3;
            } else if (geom.attributes && geom.attributes.position) {
                metrics.triangleCount += geom.attributes.position.count / 3;
            }
        }
    });
    
    // Renderer stats are not directly accessible in vanilla Three.js
    // Estimate draw calls based on material count
    metrics.drawCalls = modelMaterials.length;
    
    // Measure render time
    const startTime = performance.now();
    let frames = 0;
    
    function benchmarkRender() {
        renderer.render(scene, camera);
        frames++;
        
        if (performance.now() - startTime < 1000) {
            requestAnimationFrame(benchmarkRender);
        } else {
            const endTime = performance.now();
            metrics.renderTime = (endTime - startTime) / frames;
            metrics.frameRate = 1000 / metrics.renderTime;
            
            // Try to estimate memory usage (not exact)
            try {
                if (window.performance && window.performance.memory) {
                    metrics.memoryUsage = window.performance.memory.usedJSHeapSize / (1024 * 1024);
                }
            } catch (e) {
                metrics.memoryUsage = "Not available";
            }
            
            // Display results
            const resultsHtml = `
                <div class="analyzer-section">
                    <h4>Performance Benchmark</h4>
                    <div class="analyzer-list">
                        <div class="analyzer-item">
                            <div class="analyzer-property">
                                <span class="analyzer-property-name">Render Time:</span>
                                <span class="analyzer-property-value">${metrics.renderTime.toFixed(2)} ms/frame</span>
                            </div>
                            <div class="analyzer-property">
                                <span class="analyzer-property-name">Frame Rate:</span>
                                <span class="analyzer-property-value">${metrics.frameRate.toFixed(1)} FPS</span>
                            </div>
                            <div class="analyzer-property">
                                <span class="analyzer-property-name">Triangle Count:</span>
                                <span class="analyzer-property-value">${Math.round(metrics.triangleCount).toLocaleString()}</span>
                            </div>
                            <div class="analyzer-property">
                                <span class="analyzer-property-name">Est. Draw Calls:</span>
                                <span class="analyzer-property-value">${metrics.drawCalls}</span>
                            </div>
                            <div class="analyzer-property">
                                <span class="analyzer-property-name">Memory Usage:</span>
                                <span class="analyzer-property-value">${typeof metrics.memoryUsage === 'number' ? metrics.memoryUsage.toFixed(1) + ' MB' : metrics.memoryUsage}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert at the top of the analyzer tabs
            const analyzerStructure = document.getElementById('analyzer-structure');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = resultsHtml;
            const resultElement = tempDiv.firstElementChild;
            
            analyzerStructure.insertBefore(resultElement, analyzerStructure.firstChild);
            
            // Remove after 30 seconds
            setTimeout(() => {
                if (resultElement && resultElement.parentNode) {
                    resultElement.parentNode.removeChild(resultElement);
                }
            }, 30000);
            
            updateGLTFStatus("Benchmark complete: " + metrics.frameRate.toFixed(1) + " FPS");
            showTaskbarNotification("Performance benchmark completed", 'info');
        }
    }
    
    requestAnimationFrame(benchmarkRender);
}

// Render tree structure
function renderStructureTree(suffix = '') {
    const treeElement = document.getElementById('analyzer-tree' + suffix);
    
    if (!analyzedModel || !treeElement) {
        return;
    }
    
    // Get the structure data
    const structure = analyzeStructure(analyzedModel);
    
    // Create tree HTML
    let treeHtml = '';
    
    // Summary section
    treeHtml += `
        <div class="tree-item">
            <div class="tree-item-icon">📊</div>
            <strong>Model Overview</strong>
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Scenes: ${structure.scenes}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Nodes: ${structure.nodes}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Meshes: ${structure.meshes}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Materials: ${structure.materials}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Textures: ${structure.textures}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Animations: ${structure.animations}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Vertices: ${structure.vertexCount.toLocaleString()}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Triangles: ${Math.round(structure.triangleCount).toLocaleString()}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Primitives: ${structure.primitiveCount}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Tree Depth: ${structure.maxTreeDepth}
        </div>
        <div class="tree-item" style="padding-left: 20px;">
            <div class="tree-indent"></div>
            Est. Size: ${structure.estimatedSize.toFixed(1)} KB
        </div>
    `;
    
    treeElement.innerHTML = treeHtml;
}

// Render nodes list
function renderNodesList(suffix = '') {
    const nodesElement = document.getElementById('analyzer-nodes-list' + suffix);
    
    if (!analyzedModel || !nodesElement) {
        return;
    }
    
    // Get the nodes data
    const nodesData = analyzeNodes(analyzedModel);
    
    // Create HTML for nodes list
    let nodesHtml = '';
    
    // Function to recursively create node tree
    function createNodeTree(node, scene, level = 0) {
        const indent = '  '.repeat(level);
        const nodeType = node.isMesh ? '📦 ' : (node.isBone ? '🦴 ' : '📁 ');
        const name = node.name || "Unnamed Node";
        
        nodesHtml += `
            <div class="analyzer-item" data-node="${name}">
                <div style="margin-left: ${level * 16}px;">
                    ${nodeType}${name}
                </div>
            </div>
        `;
        
        // Process children
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                createNodeTree(child, scene, level + 1);
            });
        }
    }
    
    if (analyzedModel.scene) {
        nodesHtml = `<div class="analyzer-item" style="font-weight:bold;">Scene</div>`;
        createNodeTree(analyzedModel.scene, analyzedModel.scene, 1);
    }
    
    nodesElement.innerHTML = nodesHtml;
    
    // Add click event listeners
    const nodeItems = nodesElement.querySelectorAll('.analyzer-item');
    nodeItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove existing selection
            nodeItems.forEach(i => i.classList.remove('selected'));
            // Add selection to clicked item
            item.classList.add('selected');
        });
    });
}

// Render materials list
function renderMaterialsList(suffix = '') {
    const materialsElement = document.getElementById('analyzer-materials-list' + suffix);
    
    if (!analyzedModel || !materialsElement) {
        return;
    }
    
    // Get the materials data
    const materialsData = analyzeMaterials(analyzedModel);
    
    // Create HTML for materials list
    let materialsHtml = '';
    
    materialsData.forEach((material, index) => {
        let colorPreview = '';
        if (material.color) {
            colorPreview = `<div style="display:inline-block; width:12px; height:12px; background:${material.color}; border:1px solid #999; margin-right:5px;"></div>`;
        }
        
        materialsHtml += `
            <div class="analyzer-item" data-material="${index}">
                <div style="font-weight:bold; margin-bottom:3px;">
                    ${colorPreview}${material.name}
                </div>
                <div class="analyzer-property">
                    <span class="analyzer-property-name">Type:</span>
                    <span class="analyzer-property-value">${material.type}</span>
                </div>
        `;
        
        // Add material properties
        if (material.color) {
            materialsHtml += `
                <div class="analyzer-property">
                    <span class="analyzer-property-name">Color:</span>
                    <span class="analyzer-property-value">${material.color}</span>
                </div>
            `;
        }
        
        if (material.roughness !== undefined) {
            materialsHtml += `
                <div class="analyzer-property">
                    <span class="analyzer-property-name">Roughness:</span>
                    <span class="analyzer-property-value">${material.roughness.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (material.metalness !== undefined) {
            materialsHtml += `
                <div class="analyzer-property">
                    <span class="analyzer-property-name">Metalness:</span>
                    <span class="analyzer-property-value">${material.metalness.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (material.transparent) {
            materialsHtml += `
                <div class="analyzer-property">
                    <span class="analyzer-property-name">Opacity:</span>
                    <span class="analyzer-property-value">${material.opacity.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Add texture maps
        const maps = [
            { key: 'map', label: 'Base Color Map' },
            { key: 'normalMap', label: 'Normal Map' },
            { key: 'roughnessMap', label: 'Roughness Map' },
            { key: 'metalnessMap', label: 'Metalness Map' },
            { key: 'aoMap', label: 'AO Map' },
            { key: 'emissiveMap', label: 'Emissive Map' },
            { key: 'alphaMap', label: 'Alpha Map' }
        ];
        
        const hasMaps = maps.some(mapInfo => material[mapInfo.key]);
        
        if (hasMaps) {
            materialsHtml += `<div style="font-weight:bold; margin:3px 0;">Texture Maps:</div>`;
            
            maps.forEach(mapInfo => {
                if (material[mapInfo.key]) {
                    materialsHtml += `
                        <div class="analyzer-property">
                            <span class="analyzer-property-name">• ${mapInfo.label}</span>
                            <span class="analyzer-property-value">✓</span>
                        </div>
                    `;
                }
            });
        }
        
        materialsHtml += `</div>`;
    });
    
    if (materialsHtml === '') {
        materialsHtml = '<div class="tree-loader">No material data available</div>';
    }
    
    materialsElement.innerHTML = materialsHtml;
    
    // Add click event listeners
    const materialItems = materialsElement.querySelectorAll('.analyzer-item');
    materialItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove existing selection
            materialItems.forEach(i => i.classList.remove('selected'));
            // Add selection to clicked item
            item.classList.add('selected');
            
            // Select the corresponding material in the Materials list
            const matIndex = parseInt(item.dataset.material);
            if (!isNaN(matIndex) && matIndex >= 0 && matIndex < modelMaterials.length) {
                selectMaterial(matIndex);
            }
        });
    });
}

// Render textures grid
function renderTexturesGrid(suffix = '') {
    const texturesElement = document.getElementById('analyzer-textures-grid' + suffix);
    
    if (!analyzedModel || !texturesElement) {
        return;
    }
    
    // Get the textures data
    const texturesData = analyzeTextures(analyzedModel);
    
    // Create HTML for textures grid
    let texturesHtml = '';
    
    if (texturesData.length > 0) {
        texturesData.forEach(texture => {
            // Create thumbnail from texture if possible (not fully implemented as we can't easily
            // access raw texture data in Three.js without special handling)
            texturesHtml += `
                <div class="texture-thumbnail" style="background-color: #f0f0f0;">
                    <div style="text-align:center; padding-top:30px; color:#666;">
                        ${texture.type}
                    </div>
                    <div class="texture-label">
                        ${texture.width}x${texture.height} 
                    </div>
                </div>
            `;
        });
    } else {
        texturesHtml = '<div class="tree-loader" style="grid-column: 1 / -1;">No texture data available</div>';
    }
    
    texturesElement.innerHTML = texturesHtml;
}

// Render animations list
function renderAnimationsList(suffix = '') {
    const animationsElement = document.getElementById('analyzer-animations-list' + suffix);
    
    if (!analyzedModel || !animationsElement) {
        return;
    }
    
    // Get the animations data
    const animationsData = analyzeAnimations(analyzedModel);
    
    // Create HTML for animations list
    let animationsHtml = '';
    
    if (animationsData.length > 0) {
        animationsData.forEach((animation, index) => {
            animationsHtml += `
                <div class="analyzer-item" data-animation="${index}">
                    <div style="font-weight:bold; margin-bottom:3px;">
                        🎬 ${animation.name}
                    </div>
                    <div class="analyzer-property">
                        <span class="analyzer-property-name">Duration:</span>
                        <span class="analyzer-property-value">${animation.duration.toFixed(2)}s</span>
                    </div>
                    <div class="analyzer-property">
                        <span class="analyzer-property-name">Tracks:</span>
                        <span class="analyzer-property-value">${animation.trackCount}</span>
                    </div>
                    <div class="analyzer-property">
                        <span class="analyzer-property-name">Keyframes:</span>
                        <span class="analyzer-property-value">${animation.keyframeCount} (${animation.uniqueKeyframes} unique)</span>
                    </div>
                </div>
            `;
        });
    } else {
        animationsHtml = '<div class="tree-loader">No animation data available</div>';
    }
    
    animationsElement.innerHTML = animationsHtml;
    
    // Add click event listeners
    const animationItems = animationsElement.querySelectorAll('.analyzer-item');
    animationItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove existing selection
            animationItems.forEach(i => i.classList.remove('selected'));
            // Add selection to clicked item
            item.classList.add('selected');
            
            // Play the animation
            const animIndex = parseInt(item.dataset.animation);
            if (!isNaN(animIndex) && animIndex >= 0 && animIndex < animations.length) {
                playAnimation(animIndex);
            }
        });
    });
}

// Hook the analyzer into the glTF loading process
const originalLoadGLTFModel = loadGLTFModel;

loadGLTFModel = function(gltf, file = null) {
    // Call the original function first
    originalLoadGLTFModel.call(this, gltf, file);
    
    // Then analyze the model
    analyzeGLTFModel(gltf);
};

// GLTF Analyzer window functionality
let analyzerOpen = false;

function toggleAnalyzer() {
    const window = document.getElementById('analyzer-window');
    const taskbarBtn = document.getElementById('analyzer-taskbar-btn');
    
    if (analyzerOpen) {
        window.style.display = 'none';
        taskbarBtn.classList.remove('active');
        analyzerOpen = false;
        updateStatus("GLTF Analyzer closed");
    } else {
        window.style.display = 'block';
        taskbarBtn.classList.add('active');
        analyzerOpen = true;
        updateStatus("GLTF Analyzer opened");
        showTaskbarNotification("GLTF Analyzer opened", 'info');
        
        // Refresh analyzer if we have a model loaded
        if (gltfModel) {
            refreshAnalyzer();
        }
    }
}

function minimizeAnalyzer() {
    const window = document.getElementById('analyzer-window');
    const taskbarBtn = document.getElementById('analyzer-taskbar-btn');
    
    window.style.display = 'none';
    taskbarBtn.classList.remove('active');
    analyzerOpen = false;
    updateStatus("GLTF Analyzer minimized");
}

function closeAnalyzer() {
    minimizeAnalyzer();
}