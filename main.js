// Import global styles or other setup if needed
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Make THREE and other libraries available globally
window.THREE = THREE;

// Attach additional classes to THREE namespace for compatibility
THREE.GLTFLoader = GLTFLoader;
THREE.DRACOLoader = DRACOLoader;
THREE.OrbitControls = OrbitControls;
THREE.GLTFExporter = GLTFExporter;

// Also make them available as globals for backwards compatibility
window.GLTFLoader = GLTFLoader;
window.DRACOLoader = DRACOLoader;
window.OrbitControls = OrbitControls;
window.GLTFExporter = GLTFExporter;

console.log('THREE.js libraries loaded:', !!window.THREE);
console.log('OrbitControls available:', !!THREE.OrbitControls);

// Function to ensure DOM is ready before initialization
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Initialize the application when both THREE is loaded and DOM is ready
domReady(() => {
    console.log('DOM ready, initializing application...');
    
    // Import globals and app after ensuring everything is ready
    Promise.all([
        import('./globals.js'),
        import('./app.js')
    ]).then(() => {
        console.log('All modules loaded successfully');
    }).catch(error => {
        console.error('Error loading modules:', error);
    });
});

console.log('Main entry point loaded'); 