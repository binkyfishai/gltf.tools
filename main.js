// Import global styles or other setup if needed
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Safe assignment function to avoid read-only property errors
function safeAssign(obj, prop, value) {
    try {
        if (!(prop in obj) || obj[prop] !== value) {
            obj[prop] = value;
        }
    } catch (error) {
        console.warn(`Could not assign ${prop}:`, error);
        try {
            Object.defineProperty(obj, prop, {
                value: value,
                writable: true,
                configurable: true
            });
        } catch (defineError) {
            console.warn(`Could not define property ${prop}:`, defineError);
        }
    }
}

// Make THREE available globally first
safeAssign(window, 'THREE', THREE);

// Attach additional classes to THREE namespace for compatibility
safeAssign(THREE, 'GLTFLoader', GLTFLoader);
safeAssign(THREE, 'DRACOLoader', DRACOLoader);
safeAssign(THREE, 'OrbitControls', OrbitControls);
safeAssign(THREE, 'GLTFExporter', GLTFExporter);

// Also make them available as globals for backwards compatibility
safeAssign(window, 'GLTFLoader', GLTFLoader);
safeAssign(window, 'DRACOLoader', DRACOLoader);
safeAssign(window, 'OrbitControls', OrbitControls);
safeAssign(window, 'GLTFExporter', GLTFExporter);

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