// Check if we're in a browser environment before accessing document or window
if (typeof document === 'undefined' || typeof window === 'undefined') {
    console.log('Not in browser environment, skipping globals initialization');
} else {
    // This file contains ALL global functions needed by HTML elements
    // It's loaded before app.js to ensure the functions are defined

    // Basic UI functions
    window.toggleSection = function(element) {
        if (!element) return;
        const content = element.nextElementSibling;
        if (!content) return;
        
        if (content.style.display === "none" || !content.style.display) {
            content.style.display = "block";
            if (element.querySelector('.section-arrow')) {
                element.querySelector('.section-arrow').innerHTML = '▼';
            }
        } else {
            content.style.display = "none";
            if (element.querySelector('.section-arrow')) {
                element.querySelector('.section-arrow').innerHTML = '▶';
            }
        }
    };

    window.switchShaderTab = function(tab) {
        const tabButtons = document.querySelectorAll('.shader-tab-button');
        const tabPanels = document.querySelectorAll('.shader-tab');
        
        if (!tabButtons || !tabPanels) return;
        
        tabButtons.forEach(button => button.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        document.getElementById(tab + '-button')?.classList.add('active');
        document.getElementById(tab)?.classList.add('active');
    };

    window.toggleExpand = function(editorId) {
        const editor = document.getElementById(editorId);
        if (!editor) return;
        
        if (editor.classList.contains('expanded')) {
            editor.classList.remove('expanded');
            editor.style.height = '300px';
        } else {
            editor.classList.add('expanded');
            editor.style.height = '500px';
        }
    };

    // Shader related functions
    window.clearShaders = function() {
        console.log('placeholder: clearShaders');
    };

    window.loadExample = function() {
        console.log('placeholder: loadExample');
    };

    window.loadSpecificExample = function(type) {
        console.log('placeholder: loadSpecificExample', type);
    };

    window.updateShaders = function() {
        console.log('placeholder: updateShaders');
    };

    window.applyToSelectedMaterial = function() {
        console.log('placeholder: applyToSelectedMaterial');
    };

    // Window functions
    window.toggleShaderBrowser = function() {
        const browser = document.getElementById('shader-browser');
        if (browser) {
            browser.style.display = browser.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.toggleNotepad = function() {
        const notepad = document.getElementById('notepad');
        if (notepad) {
            notepad.style.display = notepad.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.toggleOptimizer = function() {
        const optimizer = document.getElementById('optimizer');
        if (optimizer) {
            optimizer.style.display = optimizer.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.minimizeNotepad = function() {
        const notepad = document.getElementById('notepad');
        if (notepad) {
            notepad.classList.add('minimized');
        }
    };

    window.closeNotepad = function() {
        const notepad = document.getElementById('notepad');
        if (notepad) {
            notepad.style.display = 'none';
        }
    };

    window.minimizeOptimizer = function() {
        const optimizer = document.getElementById('optimizer');
        if (optimizer) {
            optimizer.classList.add('minimized');
        }
    };

    window.closeOptimizer = function() {
        const optimizer = document.getElementById('optimizer');
        if (optimizer) {
            optimizer.style.display = 'none';
        }
    };

    window.minimizeShaderBrowser = function() {
        const browser = document.getElementById('shader-browser');
        if (browser) {
            browser.classList.add('minimized');
        }
    };

    window.closeShaderBrowser = function() {
        const browser = document.getElementById('shader-browser');
        if (browser) {
            browser.style.display = 'none';
        }
    };

    window.toggleStartMenu = function() {
        const startMenu = document.getElementById('start-menu');
        if (startMenu) {
            startMenu.style.display = startMenu.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.showSubMenu = function(submenuType) {
        console.log('placeholder: showSubMenu', submenuType);
    };

    window.startAction = function(action) {
        console.log('placeholder: startAction', action);
    };

    window.minimizeApp = function() {
        console.log('placeholder: minimizeApp');
    };

    // Model functions
    window.loadSampleModel = function() {
        console.log('placeholder: loadSampleModel');
    };

    window.clearModel = function() {
        console.log('placeholder: clearModel');
    };

    window.resetView = function() {
        console.log('placeholder: resetView');
    };

    window.centerModel = function() {
        console.log('placeholder: centerModel');
    };

    window.setCameraView = function(view) {
        console.log('placeholder: setCameraView', view);
    };

    window.resetTransform = function() {
        console.log('placeholder: resetTransform');
    };

    window.exportModel = function() {
        console.log('placeholder: exportModel');
    };

    window.exportScreenshot = function() {
        console.log('placeholder: exportScreenshot');
    };

    window.exportOptimized = function() {
        console.log('placeholder: exportOptimized');
    };

    // Animation functions
    window.toggleAnimation = function() {
        console.log('placeholder: toggleAnimation');
    };

    window.stopAnimation = function() {
        console.log('placeholder: stopAnimation');
    };

    window.nextAnimation = function() {
        console.log('placeholder: nextAnimation');
    };

    // Material functions
    window.resetSelectedMaterial = function() {
        console.log('placeholder: resetSelectedMaterial');
    };

    window.applyShaderToSelectedMaterial = function() {
        console.log('placeholder: applyShaderToSelectedMaterial');
    };

    window.toggleWireframe = function() {
        console.log('placeholder: toggleWireframe');
    };

    window.toggleDebugMode = function() {
        console.log('placeholder: toggleDebugMode');
    };

    // Notepad functions
    window.newNote = function() {
        console.log('placeholder: newNote');
    };

    window.saveNote = function() {
        console.log('placeholder: saveNote');
    };

    window.loadNote = function() {
        console.log('placeholder: loadNote');
    };

    window.clearNote = function() {
        console.log('placeholder: clearNote');
    };

    // Lighting functions
    window.setLightingPreset = function(preset) {
        console.log('placeholder: setLightingPreset', preset);
    };

    window.resetLighting = function() {
        console.log('placeholder: resetLighting');
    };

    // Shader browser functions
    window.clearShaderSearch = function() {
        console.log('placeholder: clearShaderSearch');
    };

    window.filterByCategory = function(category) {
        console.log('placeholder: filterByCategory', category);
    };

    window.applySelectedShader = function() {
        console.log('placeholder: applySelectedShader');
    };

    window.previewShader = function() {
        console.log('placeholder: previewShader');
    };

    window.saveShaderVariant = function() {
        console.log('placeholder: saveShaderVariant');
    };

    // Optimizer functions
    window.analyzeModel = function() {
        console.log('placeholder: analyzeModel');
    };

    window.optimizeModel = function() {
        console.log('placeholder: optimizeModel');
    };

    console.log('Global functions initialized');
} 