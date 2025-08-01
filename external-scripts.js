// Import Three.js libraries from CDN
document.addEventListener('DOMContentLoaded', function() {
  const threeJsScript = document.createElement('script');
  threeJsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.151.3/build/three.min.js';
  document.head.appendChild(threeJsScript);
  
  const gltfLoaderScript = document.createElement('script');
  gltfLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/loaders/GLTFLoader.js';
  threeJsScript.onload = function() {
    document.head.appendChild(gltfLoaderScript);
  };
  
  const orbitControlsScript = document.createElement('script');
  orbitControlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/controls/OrbitControls.js';
  gltfLoaderScript.onload = function() {
    document.head.appendChild(orbitControlsScript);
  };
  
  const dracoLoaderScript = document.createElement('script');
  dracoLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/loaders/DRACOLoader.js';
  orbitControlsScript.onload = function() {
    document.head.appendChild(dracoLoaderScript);
  };
  
  const appScript = document.createElement('script');
  appScript.src = 'app.js';
  dracoLoaderScript.onload = function() {
    document.head.appendChild(appScript);
  };
}); 