# glTF Shader Studio

A web-based 3D viewer and shader editor for glTF models with specialized shaders like Cel Shading and Cartoon Outline.

## Features

- Load and display glTF 3D models
- Apply specialized shaders to models:
  - Cel Shading with texture preservation
  - Cartoon Outline with texture preservation
  - Studio Lighting
- Shader editor with real-time preview
- Material editor for modifying 3D model properties
- Windows XP-inspired UI with taskbar and windows

## Quick Start

1. Clone the repository:
   ```
   git clone https://github.com/binkyfishai/gltf.tools.git
   cd gltf.tools
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Deploying to Vercel

This project is configured for easy deployment to Vercel:

1. Fork or clone this repository

2. Connect your GitHub repository to Vercel:
   - Sign up or log in to [Vercel](https://vercel.com)
   - Click "New Project" and import from GitHub
   - Select your fork of this repository
   - Click "Deploy"

3. Once deployed, your site will be available at a Vercel URL, which you can customize in the Vercel dashboard.

### Manual Deployment

You can also deploy from your local environment:

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Run the deployment command:
   ```
   vercel
   ```

3. Follow the prompts to link your project and deploy.

## Development

The application uses:
- Three.js for 3D rendering
- GLSL for shaders
- Pure JavaScript for the UI

### File Structure

- `index.html` - Main HTML file
- `app.js` - Application logic and Three.js setup
- `package.json` - Project configuration
- `vercel.json` - Vercel deployment configuration

## License

MIT 