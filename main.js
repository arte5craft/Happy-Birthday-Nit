import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Music player variables
let currentAudio = null;
let isPlaying = false;
let currentTrack = 0;
let volume = 0.5;

const musicTracks = [
    {
        name: "I really want to stay at your house",
        url: "./music/CYBERPUNK 2077 SOUNDTRACK - I REALLY WANT TO STAY AT YOUR HOUSE by Rosa Walton & Hallie Coggins.mp3",
        artist: "Rosa Walton and Haggie Coggins"
    },
    {
        name: "City ruins (shade)", 
        url: "./music/2-02 - City Ruins - Shade.mp3",
        artist: "岡部啓一 (Keiichi Okabe)"
    },
    {
        name: "Malenia, Blade of Miquella",
        url: "./music/2-23 Malenia, Blade of Miquella.mp3", 
        artist: "Yuka Kitamura"
    }
];

// Create music player UI
function createMusicPlayer() {
    const playerContainer = document.createElement('div');
    playerContainer.id = 'music-player';
    playerContainer.innerHTML = `
        <div class="player-controls">
            <button id="prev-btn">⏮</button>
            <button id="play-btn">▶</button>
            <button id="next-btn">⏭</button>
            <button id="mute-btn">🔊</button>
        </div>
        <div class="track-info">
            <div id="track-name">No track loaded</div>
            <div id="track-artist">Unknown Artist</div>
        </div>
        <div class="progress-container">
            <input type="range" id="progress-bar" min="0" max="100" value="0">
            <div class="time-display">
                <span id="current-time">0:00</span>
                <span id="total-time">0:00</span>
            </div>
        </div>
        <div class="volume-container">
            <span>🔉</span>
            <input type="range" id="volume-slider" min="0" max="100" value="50">
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #music-player {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            min-width: 250px;
            font-family: Arial, sans-serif;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 1000;
        }
        
        .player-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .player-controls button {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        
        .player-controls button:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .track-info {
            text-align: center;
            margin-bottom: 10px;
        }
        
        #track-name {
            font-weight: bold;
            font-size: 14px;
        }
        
        #track-artist {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .progress-container {
            margin-bottom: 10px;
        }
        
        #progress-bar {
            width: 100%;
            margin-bottom: 5px;
        }
        
        .time-display {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            opacity: 0.7;
        }
        
        .volume-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        #volume-slider {
            flex: 1;
        }
        
        input[type="range"] {
            appearance: none;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.3);
            outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(playerContainer);
    
    // Initialize player functionality
    initializeMusicPlayer();
}

// Initialize music player functionality
function initializeMusicPlayer() {
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const muteBtn = document.getElementById('mute-btn');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    
    // Load initial track
    loadTrack(currentTrack);
    
    // Play/Pause functionality
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });
    
    // Previous track
    prevBtn.addEventListener('click', () => {
        currentTrack = (currentTrack - 1 + musicTracks.length) % musicTracks.length;
        loadTrack(currentTrack);
        if (isPlaying) playMusic();
    });
    
    // Next track
    nextBtn.addEventListener('click', () => {
        currentTrack = (currentTrack + 1) % musicTracks.length;
        loadTrack(currentTrack);
        if (isPlaying) playMusic();
    });
    
    // Mute functionality
    muteBtn.addEventListener('click', () => {
        if (currentAudio) {
            if (currentAudio.muted) {
                currentAudio.muted = false;
                muteBtn.textContent = '🔊';
            } else {
                currentAudio.muted = true;
                muteBtn.textContent = '🔇';
            }
        }
    });
    
    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        volume = e.target.value / 100;
        if (currentAudio) {
            currentAudio.volume = volume;
        }
    });
    
    // Progress bar control
    progressBar.addEventListener('input', (e) => {
        if (currentAudio) {
            const seekTime = (e.target.value / 100) * currentAudio.duration;
            currentAudio.currentTime = seekTime;
        }
    });
}

// Load a track
function loadTrack(trackIndex) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    const track = musicTracks[trackIndex];
    currentAudio = new Audio(track.url);
    currentAudio.volume = volume;
    
    // Update UI
    document.getElementById('track-name').textContent = track.name;
    document.getElementById('track-artist').textContent = track.artist;
    
    // Audio event listeners
    currentAudio.addEventListener('loadedmetadata', () => {
        document.getElementById('total-time').textContent = formatTime(currentAudio.duration);
    });
    
    currentAudio.addEventListener('timeupdate', () => {
        if (currentAudio.duration) {
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            document.getElementById('progress-bar').value = progress;
            document.getElementById('current-time').textContent = formatTime(currentAudio.currentTime);
        }
    });
    
    currentAudio.addEventListener('ended', () => {
        // Auto-play next track
        currentTrack = (currentTrack + 1) % musicTracks.length;
        loadTrack(currentTrack);
        playMusic();
    });
}

// Play music
function playMusic() {
    if (currentAudio) {
        currentAudio.play().catch(e => {
            console.log('Audio play failed:', e);
            // Some browsers require user interaction before playing audio
        });
        isPlaying = true;
        document.getElementById('play-btn').textContent = '⏸';
    }
}

// Pause music
function pauseMusic() {
    if (currentAudio) {
        currentAudio.pause();
        isPlaying = false;
        document.getElementById('play-btn').textContent = '▶';
    }
}

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000008); 
document.body.appendChild(renderer.domElement);

// Create starry background
function createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true
    });

    const starsVertices = [];
    const starsColors = [];
    const starsBrightness = []; // Store base brightness for twinkling
    const starsPhase = []; // Random phase for twinkling animation
    
    // Create multiple star populations for realistic distribution
    const starPopulations = [
        { count: 1500, minRadius: 800, maxRadius: 1500, clusterFactor: 0.7 }, // Distant background stars
        { count: 1500, minRadius: 500, maxRadius: 800, clusterFactor: 0.7 },  // Mid-distance stars
        { count: 800, minRadius: 300, maxRadius: 500, clusterFactor: 0.7 },   // Closer bright stars
    ];

    // Generate cluster centers for more realistic star distribution
    const clusterCenters = [];
    for (let i = 0; i < 12; i++) {
        clusterCenters.push({
            x: (Math.random() - 0.7) * 2,
            y: (Math.random() - 0.7) * 2,
            z: (Math.random() - 0.7) * 2
        });
    }

    starPopulations.forEach(population => {
        for (let i = 0; i < population.count; i++) {
            let x, y, z;
            
            // Some stars are clustered, others are random
            if (Math.random() < population.clusterFactor && clusterCenters.length > 0) {
                // Clustered star
                const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
                const clusterRadius = 0.3 + Math.random() * 0.4;
                
                // Generate position near cluster center
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const radius = population.minRadius + Math.random() * (population.maxRadius - population.minRadius);
                
                // Base spherical position
                const baseX = radius * Math.sin(phi) * Math.cos(theta);
                const baseY = radius * Math.sin(phi) * Math.sin(theta);
                const baseZ = radius * Math.cos(phi);
                
                // Add cluster offset
                x = baseX + cluster.x * clusterRadius * radius * 0.1;
                y = baseY + cluster.y * clusterRadius * radius * 0.1;
                z = baseZ + cluster.z * clusterRadius * radius * 0.1;
            } else {
                // Random distributed star
                const radius = population.minRadius + Math.random() * (population.maxRadius - population.minRadius);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                x = radius * Math.sin(phi) * Math.cos(theta);
                y = radius * Math.sin(phi) * Math.sin(theta);
                z = radius * Math.cos(phi);
            }
            
            starsVertices.push(x, y, z);
            
            // More diverse star colors and brightness variation
            const brightness = Math.pow(Math.random(), 2.5); // More dim stars than bright ones
            const starType = Math.random();
            
            let r, g, b;
            if (starType < 0.03) {
                // Red supergiants (very rare, 3%)
                r = 1.0 * brightness;
                g = 0.2 * brightness;
                b = 0.1 * brightness;
            } else if (starType < 0.06) {
                // Orange giants (3%)
                r = 1.0 * brightness;
                g = 0.5 * brightness;
                b = 0.2 * brightness;
            } else if (starType < 0.1) {
                // Blue supergiants (rare, 4%)
                r = 0.6 * brightness;
                g = 0.8 * brightness;
                b = 1.0 * brightness;
            } else if (starType < 0.15) {
                // Blue-white giants (5%)
                r = 0.8 * brightness;
                g = 0.9 * brightness;
                b = 1.0 * brightness;
            } else if (starType < 0.25) {
                // Yellow giants (10%)
                r = 1.0 * brightness;
                g = 0.9 * brightness;
                b = 0.6 * brightness;
            } else if (starType < 0.4) {
                // Yellow main sequence like our sun (15%)
                r = 1.0 * brightness;
                g = 0.95 * brightness;
                b = 0.8 * brightness;
            } else if (starType < 0.55) {
                // Orange main sequence (15%)
                r = 1.0 * brightness;
                g = 0.7 * brightness;
                b = 0.4 * brightness;
            } else if (starType < 0.7) {
                // Red dwarfs (15%)
                r = 1.0 * brightness;
                g = 0.4 * brightness;
                b = 0.3 * brightness;
            } else if (starType < 0.85) {
                // White main sequence (15%)
                const variation = 0.9 + Math.random() * 0.1;
                r = variation * brightness;
                g = variation * brightness;
                b = variation * brightness;
            } else if (starType < 0.95) {
                // Blue-white main sequence (10%)
                r = 0.9 * brightness;
                g = 0.95 * brightness;
                b = 1.0 * brightness;
            } else {
                // Exotic colors - purple, green tints (5%)
                if (Math.random() < 0.5) {
                    // Purple/magenta stars
                    r = 0.9 * brightness;
                    g = 0.6 * brightness;
                    b = 1.0 * brightness;
                } else {
                    // Green-tinted stars
                    r = 0.7 * brightness;
                    g = 1.0 * brightness;
                    b = 0.8 * brightness;
                }
            }
            
            starsColors.push(r, g, b);
            starsBrightness.push(brightness);
            starsPhase.push(Math.random() * Math.PI * 2); // Random starting phase for twinkling
        }
    });

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
    
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
    
    // Store data for twinkling animation
    starField.userData = {
        originalColors: [...starsColors],
        baseBrightness: starsBrightness,
        phases: starsPhase
    };
    
    return starField;
}

// Create the star field
const stars = createStarField();

createMusicPlayer();

// Add some basic lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Create OrbitControls with Y-axis only rotation
const controls = new OrbitControls(camera, renderer.domElement);

// Configure controls for Y-axis only rotation
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Restrict vertical rotation (no up/down movement)
controls.minPolarAngle = 0; // Lock at horizontal level
controls.maxPolarAngle = Math.PI/2; // Lock at horizontal level

// Allow unlimited horizontal rotation (360 degrees)
controls.minAzimuthAngle = -Infinity; // No limit on left rotation
controls.maxAzimuthAngle = Math.PI;  // No limit on right rotation

// Disable zoom and pan - only allow rotation
controls.enableZoom = false;
controls.enablePan = false;

// Keep camera at fixed distance
controls.minDistance = 5;
controls.maxDistance = 5;

// Set target to center of scene
controls.target.set(0, -4, 0);

// Create loader
const loader = new GLTFLoader();

// Load the GLB model
loader.load(
    './scene.glb', // Replace with your GLB file path
    function (gltf) {
        // Success callback
        const model = gltf.scene;
        
        // Optional: Scale and position the model
        model.scale.setScalar(1);
        model.position.set(0, 0, 0);
        
        scene.add(model);
        console.log('Model loaded successfully');
        
        // Optional: Center the model in the scene
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Center the model at origin
    },
    function (progress) {
        // Progress callback
        const percentage = (progress.loaded / progress.total * 100);
        console.log('Loading progress:', percentage.toFixed(2) + '%');
    },
    function (error) {
        // Error callback
        console.error('Error loading model:', error);
    }
);

// Set initial camera position (fixed distance from center)
camera.position.set(10, 0, 0); // 10 units away from center, at ground level
controls.update();

// Optional: Add keyboard controls to modify behavior
document.addEventListener('keydown', function(event) {
    switch(event.code) {
        case 'KeyZ':
            // Toggle zoom capability
            controls.enableZoom = !controls.enableZoom;
            console.log('Zoom', controls.enableZoom ? 'enabled' : 'disabled');
            break;
        case 'KeyP':
            // Toggle pan capability
            controls.enablePan = !controls.enablePan;
            console.log('Pan', controls.enablePan ? 'enabled' : 'disabled');
            break;
        case 'KeyR':
            // Reset camera position
            camera.position.set(10, 0, 0);
            controls.update();
            console.log('Camera position reset');
            break;
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls (required for damping)
    controls.update();
    
    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();

// Display controls info
console.log('Controls:');
console.log('Left Mouse Drag: Rotate around Y-axis (360 degrees)');
console.log('Z Key: Toggle zoom on/off');
console.log('P Key: Toggle pan on/off');
console.log('R Key: Reset camera position');
// 600 lines is pretty goated ngl