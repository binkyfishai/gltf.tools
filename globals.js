// This file contains global functions needed by HTML elements
// It's loaded before app.js to ensure the functions are defined

// Define placeholder functions that will be replaced by real implementations
window.toggleShaderBrowser = function() { 
    console.log('Opening shader browser...'); 
    const shaderBrowser = document.getElementById('shader-browser');
    if (shaderBrowser) {
        shaderBrowser.style.display = shaderBrowser.style.display === 'none' ? 'block' : 'none';
    }
};

window.clearShaders = function() { 
    console.log('Clearing shaders...'); 
    const vertexTextarea = document.getElementById('vertexShader');
    const fragmentTextarea = document.getElementById('fragmentShader');
    if (vertexTextarea) vertexTextarea.value = '';
    if (fragmentTextarea) fragmentTextarea.value = '';
};

window.resetView = function() { 
    console.log('Resetting view...'); 
};

window.applyToSelectedMaterial = function() { 
    console.log('Applying shader to selected material...'); 
};

window.loadExample = function() { 
    console.log('Loading example shader...'); 
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

window.loadSampleModel = function() { 
    console.log('Loading sample model...'); 
};

window.clearModel = function() { 
    console.log('Clearing model...'); 
};

window.updateShaders = function() { 
    console.log('Updating shaders...'); 
};

window.toggleAnimation = function() { 
    console.log('Toggling animation...'); 
};

window.resetTransform = function() { 
    console.log('Resetting transform...'); 
};

window.centerModel = function() { 
    console.log('Centering model...'); 
};

window.exportModel = function() { 
    console.log('Exporting model...'); 
};

window.exportScreenshot = function() { 
    console.log('Taking screenshot...'); 
};

window.toggleWireframe = function() { 
    console.log('Toggling wireframe...'); 
};

window.toggleDebugMode = function() { 
    console.log('Toggling debug mode...'); 
};

window.resetSelectedMaterial = function() { 
    console.log('Resetting selected material...'); 
};

console.log('Global functions initialized'); 