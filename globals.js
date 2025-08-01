// This file contains ALL global functions needed by HTML elements
// It's loaded before app.js to ensure the functions are defined

// Basic UI functions
window.toggleSection = function(element) { 
    console.log('Toggling section...'); 
    if (element) {
        const content = element.nextElementSibling;
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            element.classList.toggle('collapsed');
        }
    }
};

window.switchShaderTab = function(tab) { 
    console.log('Switching to tab: ' + tab); 
    const tabs = document.querySelectorAll('.panel-tab');
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.panel-tab:nth-child(${tab === 'vertex' ? 1 : tab === 'fragment' ? 2 : 3})`).classList.add('active');
};

window.toggleExpand = function(editorId) { 
    console.log('Expanding editor: ' + editorId); 
};

// Shader related functions
window.clearShaders = function() { 
    console.log('Clearing shaders...'); 
    const vertexTextarea = document.getElementById('vertexShader');
    const fragmentTextarea = document.getElementById('fragmentShader');
    if (vertexTextarea) vertexTextarea.value = '';
    if (fragmentTextarea) fragmentTextarea.value = '';
};

window.loadExample = function() { 
    console.log('Loading example shader...'); 
};

window.loadSpecificExample = function(type) {
    console.log('Loading specific example: ' + type);
};

window.updateShaders = function() { 
    console.log('Updating shaders...'); 
};

window.applyToSelectedMaterial = function() { 
    console.log('Applying to selected material...'); 
};

// Window functions
window.toggleShaderBrowser = function() { 
    console.log('Toggling shader browser...'); 
    const shaderBrowser = document.getElementById('shader-browser');
    if (shaderBrowser) {
        shaderBrowser.style.display = shaderBrowser.style.display === 'none' ? 'block' : 'none';
    }
};

window.toggleNotepad = function() { 
    console.log('Toggling notepad...'); 
    const notepad = document.getElementById('notepad');
    if (notepad) {
        notepad.style.display = notepad.style.display === 'none' ? 'block' : 'none';
    }
};

window.toggleOptimizer = function() { 
    console.log('Toggling optimizer...'); 
    const optimizer = document.getElementById('optimizer');
    if (optimizer) {
        optimizer.style.display = optimizer.style.display === 'none' ? 'block' : 'none';
    }
};

window.minimizeNotepad = function() {
    console.log('Minimizing notepad');
};

window.closeNotepad = function() {
    console.log('Closing notepad');
    const notepad = document.getElementById('notepad');
    if (notepad) notepad.style.display = 'none';
};

window.minimizeOptimizer = function() {
    console.log('Minimizing optimizer');
};

window.closeOptimizer = function() {
    console.log('Closing optimizer');
    const optimizer = document.getElementById('optimizer');
    if (optimizer) optimizer.style.display = 'none';
};

window.minimizeShaderBrowser = function() {
    console.log('Minimizing shader browser');
};

window.closeShaderBrowser = function() {
    console.log('Closing shader browser');
    const shaderBrowser = document.getElementById('shader-browser');
    if (shaderBrowser) shaderBrowser.style.display = 'none';
};

window.toggleStartMenu = function() {
    console.log('Toggling start menu');
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.style.display = startMenu.style.display === 'none' ? 'block' : 'none';
    }
};

window.showSubMenu = function(submenuType) {
    console.log('Showing submenu: ' + submenuType);
};

window.startAction = function(action) {
    console.log('Starting action: ' + action);
};

window.minimizeApp = function() {
    console.log('Minimizing app');
};

// Model functions
window.loadSampleModel = function() { 
    console.log('Loading sample model...'); 
};

window.clearModel = function() { 
    console.log('Clearing model...'); 
};

window.resetView = function() { 
    console.log('Resetting view...'); 
};

window.centerModel = function() { 
    console.log('Centering model...'); 
};

window.setCameraView = function(view) {
    console.log('Setting camera view: ' + view);
};

window.resetTransform = function() { 
    console.log('Resetting transform...'); 
};

window.exportModel = function() { 
    console.log('Exporting model...'); 
};

window.exportScreenshot = function() { 
    console.log('Taking screenshot...'); 
};

window.exportOptimized = function() {
    console.log('Exporting optimized model');
};

// Animation functions
window.toggleAnimation = function() { 
    console.log('Toggling animation...'); 
};

window.stopAnimation = function() { 
    console.log('Stopping animation...'); 
};

window.nextAnimation = function() { 
    console.log('Next animation...'); 
};

// Material functions
window.resetSelectedMaterial = function() { 
    console.log('Resetting selected material...'); 
};

window.applyShaderToSelectedMaterial = function() { 
    console.log('Applying shader to selected material...'); 
};

window.toggleWireframe = function() { 
    console.log('Toggling wireframe...'); 
};

window.toggleDebugMode = function() { 
    console.log('Toggling debug mode...'); 
};

// Notepad functions
window.newNote = function() {
    console.log('New note');
};

window.saveNote = function() {
    console.log('Save note');
};

window.loadNote = function() {
    console.log('Load note');
};

window.clearNote = function() {
    console.log('Clear note');
};

// Lighting functions
window.setLightingPreset = function(preset) {
    console.log('Setting lighting preset: ' + preset);
};

window.resetLighting = function() {
    console.log('Resetting lighting');
};

// Shader browser functions
window.clearShaderSearch = function() {
    console.log('Clearing shader search');
    const searchInput = document.querySelector('.search-box');
    if (searchInput) searchInput.value = '';
};

window.filterByCategory = function(category) {
    console.log('Filtering by category: ' + category);
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeButton = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(category));
    if (activeButton) activeButton.classList.add('active');
};

window.applySelectedShader = function() {
    console.log('Applying selected shader');
};

window.previewShader = function() {
    console.log('Previewing shader');
};

window.saveShaderVariant = function() {
    console.log('Saving shader variant');
};

// Optimizer functions
window.analyzeModel = function() {
    console.log('Analyzing model');
};

window.optimizeModel = function() {
    console.log('Optimizing model');
};

console.log('Global functions initialized'); 