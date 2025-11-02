// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const videoUploadArea = document.getElementById('videoUploadArea');
const fileInput = document.getElementById('fileInput');
const videoInput = document.getElementById('videoInput');
const canvas = document.getElementById('asciiCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const canvasContainer = document.getElementById('canvasContainer');
const canvasWrapper = document.getElementById('canvasWrapper');
const emptyState = document.getElementById('emptyState');
const widthSlider = document.getElementById('widthSlider');
const widthValue = document.getElementById('widthValue');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const fontSlider = document.getElementById('fontSlider');
const fontValue = document.getElementById('fontValue');
const contrastSlider = document.getElementById('contrastSlider');
const contrastValue = document.getElementById('contrastValue');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const sharpnessSlider = document.getElementById('sharpnessSlider');
const sharpnessValue = document.getElementById('sharpnessValue');
const charSetSelect = document.getElementById('charSet');
const downloadBtn = document.getElementById('downloadBtn');
const copyAsciiBtn = document.getElementById('copyAsciiBtn');
const resetBtn = document.getElementById('resetBtn');
const colorBtns = document.querySelectorAll('.color-btn');
const infoBar = document.getElementById('infoBar');
const dimensions = document.getElementById('dimensions');
const characters = document.getElementById('characters');
const imageSize = document.getElementById('imageSize');
const tabBtns = document.querySelectorAll('.tab-btn');
const imageSection = document.getElementById('imageSection');
const videoSection = document.getElementById('videoSection');
const webcamSection = document.getElementById('webcamSection');
const videoControls = document.getElementById('videoControls');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const fpsDisplay = document.getElementById('fpsDisplay');
const videoSource = document.getElementById('videoSource');
const startWebcamBtn = document.getElementById('startWebcamBtn');
const captureFrameBtn = document.getElementById('captureFrameBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenHeader = document.getElementById('fullscreenHeader');
const fullscreenCloseBtn = document.getElementById('fullscreenCloseBtn');
const processingOverlay = document.getElementById('processingOverlay');
const processingText = document.getElementById('processingText');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomLevel = document.getElementById('zoomLevel');

// State variables
let currentImage = null;
let currentColorMode = 'colorful';
let currentMode = 'image';
let isPlaying = false;
let animationId = null;
let lastFrameTime = 0;
let fps = 0;
let webcamStream = null;
let isFullscreen = false;
let currentAsciiText = '';
let originalImageWidth = 0;
let originalImageHeight = 0;

// Zoom and Pan variables
let currentZoom = 1;
let minZoom = 0.25;
let maxZoom = 5;
let zoomStep = 0.25;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;

// Character sets with accurate density mapping
const charSets = {
    standard: ' .:-=+*#%@',
    detailed: ' .`\'^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
    simple: ' .+#@',
    blocks: ' ░▒▓█',
    binary: ' 0123456789',
    enhanced: ' .\':,;i|!~+=?][}{1)(l\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
    matrix: ' .:*=+%#@',
    bold: ' ▁▂▃▄▅▆▇█',
    shade: ' ·∘∙•●',
    geometric: ' ◦◊◈◉●',
    slashes: ' /\\|─═║╬',
    dots: ' .·:∴∷∴:·.',
    waves: ' ~≈∼≋≈~',
    stars: ' .·*★☆★*·.',
    arrows: ' ›»›»›»',
    circuit: ' ─┼╬═║╬┼─'
};

// Pre-calculated character densities for accurate mapping
const charDensities = {};
function calculateCharacterDensity(char, fontSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = fontSize * 0.6;
    canvas.height = fontSize;
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px 'Courier New', 'Segoe UI Symbol', 'Arial Unicode MS', monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(char, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let whitePixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 128) whitePixels++;
    }
    
    return whitePixels / (canvas.width * canvas.height);
}

function initCharacterDensities() {
    for (const setName in charSets) {
        charDensities[setName] = charSets[setName].split('').map(char => ({
            char,
            density: calculateCharacterDensity(char, 10)
        })).sort((a, b) => a.density - b.density);
    }
}

// Quality presets
const qualityPresets = {
    1: { name: 'Low', scale: 0.5 },
    2: { name: 'Medium', scale: 0.75 },
    3: { name: 'Good', scale: 1 },
    4: { name: 'High', scale: 1.5 },
    5: { name: 'Ultra', scale: 2 }
};

// Initialize
function init() {
    charSetSelect.value = 'enhanced';
    qualitySlider.value = 4;
    qualityValue.textContent = qualityPresets[4].name;
    initCharacterDensities();
    setupEventListeners();
}

function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            imageSection.classList.remove('active');
            videoSection.classList.remove('active');
            webcamSection.classList.remove('active');
            
            if (currentMode === 'image') {
                imageSection.classList.add('active');
                videoControls.style.display = 'none';
                downloadBtn.style.display = 'block';
                copyAsciiBtn.style.display = 'block';
                resetBtn.style.display = 'block';
                stopWebcam();
                emptyState.querySelector('.empty-state-icon').textContent = '🖼️';
                emptyState.querySelector('.empty-state-text').textContent = 'Your ASCII art will appear here';
            } else if (currentMode === 'video') {
                videoSection.classList.add('active');
                videoControls.style.display = 'flex';
                downloadBtn.style.display = 'none';
                copyAsciiBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                stopWebcam();
                emptyState.querySelector('.empty-state-icon').textContent = '🎬';
                emptyState.querySelector('.empty-state-text').textContent = 'Your ASCII video will appear here';
            } else if (currentMode === 'webcam') {
                webcamSection.classList.add('active');
                videoControls.style.display = 'flex';
                downloadBtn.style.display = 'none';
                copyAsciiBtn.style.display = 'none';
                resetBtn.style.display = 'none';
                emptyState.querySelector('.empty-state-icon').textContent = '📹';
                emptyState.querySelector('.empty-state-text').textContent = 'Start webcam to see live ASCII';
            }

            resetCanvas();
        });
    });

    // Image upload
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadImage(file);
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    });

    // Video upload
    videoUploadArea.addEventListener('click', () => videoInput.click());
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadVideo(file);
    });

    videoUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoUploadArea.classList.add('drag-over');
    });

    videoUploadArea.addEventListener('dragleave', () => {
        videoUploadArea.classList.remove('drag-over');
    });

    videoUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        videoUploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            loadVideo(file);
        }
    });

    // Webcam
    startWebcamBtn.addEventListener('click', toggleWebcam);
    captureFrameBtn.addEventListener('click', captureFrame);

    // Video controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    stopBtn.addEventListener('click', () => {
        if (currentMode === 'webcam') {
            stopWebcam();
        } else {
            stopVideo();
        }
    });

    // Canvas controls
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    fullscreenCloseBtn.addEventListener('click', toggleFullscreen);
    copyAsciiBtn.addEventListener('click', copyAsciiToClipboard);
    resetBtn.addEventListener('click', resetCanvas);

    // Zoom controls
    zoomInBtn.addEventListener('click', () => setZoom(currentZoom + zoomStep));
    zoomOutBtn.addEventListener('click', () => setZoom(currentZoom - zoomStep));
    zoomResetBtn.addEventListener('click', () => {
        setZoom(1);
        resetPan();
    });

    // Mouse wheel zoom in fullscreen
    canvasContainer.addEventListener('wheel', (e) => {
        if (isFullscreen) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
            setZoom(currentZoom + delta);
        }
    });

    // Drag functionality
    canvasWrapper.addEventListener('mousedown', startDrag);
    canvasWrapper.addEventListener('mousemove', drag);
    canvasWrapper.addEventListener('mouseup', endDrag);
    canvasWrapper.addEventListener('mouseleave', endDrag);

    // Touch support for mobile
    canvasWrapper.addEventListener('touchstart', (e) => {
        if (isFullscreen) {
            const touch = e.touches[0];
            startDrag({ clientX: touch.clientX, clientY: touch.clientY });
        }
    });

    canvasWrapper.addEventListener('touchmove', (e) => {
        if (isFullscreen) {
            e.preventDefault();
            const touch = e.touches[0];
            drag({ clientX: touch.clientX, clientY: touch.clientY });
        }
    });

    canvasWrapper.addEventListener('touchend', endDrag);

    // Sliders
    widthSlider.addEventListener('input', (e) => {
        widthValue.textContent = e.target.value;
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    qualitySlider.addEventListener('input', (e) => {
        const quality = parseInt(e.target.value);
        qualityValue.textContent = qualityPresets[quality].name;
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    fontSlider.addEventListener('input', (e) => {
        fontValue.textContent = e.target.value;
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    contrastSlider.addEventListener('input', (e) => {
        contrastValue.textContent = e.target.value;
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    brightnessSlider.addEventListener('input', (e) => {
        brightnessValue.textContent = e.target.value;
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    sharpnessSlider.addEventListener('input', (e) => {
        sharpnessValue.textContent = e.target.value;
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    charSetSelect.addEventListener('change', () => {
        if (currentMode === 'image' && currentImage) {
            convertToAscii(currentImage);
        }
    });

    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentColorMode = btn.dataset.color;
            if (currentMode === 'image' && currentImage) {
                convertToAscii(currentImage);
            }
        });
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'ascii-art.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (isFullscreen) {
            switch(e.key) {
                case 'Escape':
                    exitFullscreen();
                    break;
                case '+':
                case '=':
                    setZoom(currentZoom + zoomStep);
                    break;
                case '-':
                case '_':
                    setZoom(currentZoom - zoomStep);
                    break;
                case '0':
                    setZoom(1);
                    resetPan();
                    break;
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (currentImage && !isFullscreen) {
            convertToAscii(currentImage);
        }
    });
}

function startDrag(e) {
    if (isFullscreen && currentZoom > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        canvasWrapper.classList.add('dragging');
    }
}

function drag(e) {
    if (isDragging && isFullscreen) {
        e.preventDefault();
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    }
}

function endDrag() {
    isDragging = false;
    canvasWrapper.classList.remove('dragging');
}

function setZoom(zoom) {
    currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    updateZoomDisplay();
    updateTransform();
    
    if (currentZoom === 1) {
        resetPan();
    }
}

function updateZoomDisplay() {
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
}

function updateTransform() {
    canvasWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

function resetPan() {
    translateX = 0;
    translateY = 0;
    updateTransform();
}

function loadImage(file) {
    showProcessing('Loading image...');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            originalImageWidth = img.width;
            originalImageHeight = img.height;
            convertToAscii(img);
            downloadBtn.disabled = false;
            copyAsciiBtn.disabled = false;
            resetBtn.disabled = false;
            canvasContainer.classList.remove('empty');
            emptyState.style.display = 'none';
            infoBar.style.display = 'flex';
            fullscreenBtn.disabled = false;
            hideProcessing();
        };
        img.onerror = () => {
            showToast('Error loading image. Please try another file.', 'error');
            hideProcessing();
        };
        img.src = e.target.result;
    };
    reader.onerror = () => {
        showToast('Error reading file. Please try another image.', 'error');
        hideProcessing();
    };
    reader.readAsDataURL(file);
}

function loadVideo(file) {
    showProcessing('Loading video...');
    stopVideo();
    stopWebcam();
    
    const url = URL.createObjectURL(file);
    videoSource.src = url;
    videoSource.load();
    
    videoSource.onloadedmetadata = () => {
        canvasContainer.classList.remove('empty');
        emptyState.style.display = 'none';
        infoBar.style.display = 'flex';
        playPauseBtn.disabled = false;
        stopBtn.disabled = false;
        fullscreenBtn.disabled = false;
        hideProcessing();
        
        videoSource.currentTime = 0.1;
    };

    videoSource.onseeked = () => {
        if (!isPlaying && videoSource.currentTime < 1) {
            convertToAscii(videoSource);
        }
    };
    
    videoSource.onerror = (e) => {
        showToast('Cannot load video. Please try another format (MP4, WebM, OGG, MOV).', 'error');
        resetCanvas();
        hideProcessing();
    };
}

async function toggleWebcam() {
    if (webcamStream) {
        stopWebcam();
        startWebcamBtn.textContent = 'Start Webcam';
        captureFrameBtn.disabled = true;
    } else {
        try {
            showProcessing('Starting webcam...');
            webcamStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            videoSource.srcObject = webcamStream;
            await videoSource.play();
            
            canvasContainer.classList.remove('empty');
            emptyState.style.display = 'none';
            infoBar.style.display = 'flex';
            playPauseBtn.disabled = false;
            stopBtn.disabled = false;
            captureFrameBtn.disabled = false;
            fullscreenBtn.disabled = false;
            
            startWebcamBtn.textContent = 'Stop Webcam';
            playVideo();
            hideProcessing();
        } catch (error) {
            showToast('Cannot access webcam. Please allow camera permission.', 'error');
            hideProcessing();
        }
    }
}

function captureFrame() {
    if (webcamStream) {
        convertToAscii(videoSource);
        downloadBtn.disabled = false;
        copyAsciiBtn.disabled = false;
        resetBtn.disabled = false;
        currentMode = 'image';
        setTimeout(() => {
            currentMode = 'webcam';
        }, 100);
    }
}

function togglePlayPause() {
    if (isPlaying) {
        pauseVideo();
    } else {
        playVideo();
    }
}

function playVideo() {
    if (currentMode === 'video' && !videoSource.src) return;
    if (currentMode === 'webcam' && !webcamStream) return;
    
    isPlaying = true;
    
    if (currentMode === 'video') {
        videoSource.play();
    }
    
    playPauseBtn.textContent = '⏸ Pause';
    playPauseBtn.classList.add('playing');
    
    renderVideoFrame();
}

function pauseVideo() {
    isPlaying = false;
    
    if (currentMode === 'video') {
        videoSource.pause();
    }
    
    playPauseBtn.textContent = '▶ Play';
    playPauseBtn.classList.remove('playing');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function stopVideo() {
    isPlaying = false;
    
    if (videoSource.src) {
        videoSource.pause();
        videoSource.currentTime = 0;
    }
    
    playPauseBtn.textContent = '▶ Play';
    playPauseBtn.classList.remove('playing');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    fpsDisplay.textContent = '0 FPS';
}

function stopWebcam() {
    isPlaying = false;
    
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    
    videoSource.srcObject = null;
    
    playPauseBtn.textContent = '▶ Play';
    playPauseBtn.classList.remove('playing');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    fpsDisplay.textContent = '0 FPS';
    
    if (startWebcamBtn) {
        startWebcamBtn.textContent = 'Start Webcam';
    }
}

function renderVideoFrame() {
    if (!isPlaying) return;

    const currentTime = performance.now();
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    
    if (currentTime - lastFrameTime >= frameInterval) {
        try {
            if (videoSource.readyState >= videoSource.HAVE_CURRENT_DATA) {
                convertToAscii(videoSource);
                
                fps = Math.round(1000 / (currentTime - lastFrameTime));
                fpsDisplay.textContent = `${Math.min(fps, targetFPS)} FPS`;
                lastFrameTime = currentTime;
            }
        } catch (error) {
            console.error('Error rendering frame:', error);
        }
    }

    animationId = requestAnimationFrame(renderVideoFrame);
}

function calculateOptimalDimensions(sourceWidth, sourceHeight) {
    const width = parseInt(widthSlider.value);
    const aspectRatio = sourceHeight / sourceWidth;
    const height = Math.floor(width * aspectRatio * 0.5);
    
    return { width, height };
}

function convertToAscii(source) {
    try {
        const sourceWidth = source.videoWidth || source.width;
        const sourceHeight = source.videoHeight || source.height;
        
        if (!sourceWidth || !sourceHeight) {
            console.error('Invalid source dimensions');
            return;
        }
        
        const { width, height } = calculateOptimalDimensions(sourceWidth, sourceHeight);
        const fontSize = parseInt(fontSlider.value);
        const contrast = parseFloat(contrastSlider.value);
        const brightness = parseFloat(brightnessSlider.value);
        const sharpness = parseFloat(sharpnessSlider.value);
        const charSetName = charSetSelect.value;
        const charSet = charSets[charSetName];
        const densityMap = charDensities[charSetName];

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        tempCtx.drawImage(source, 0, 0, width, height);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // Advanced image processing
        applyImageEnhancements(imageData, contrast, brightness, sharpness);
        
        // Calculate edge map for better detail
        const edgeMap = detectEdges(imageData);

        const charWidth = fontSize * 0.6;
        const charHeight = fontSize;

        canvas.width = width * charWidth;
        canvas.height = height * charHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `bold ${fontSize}px 'Courier New', 'Segoe UI Symbol', 'Arial Unicode MS', monospace`;
        ctx.textBaseline = 'top';

        currentAsciiText = '';

        // Error diffusion for better gradients
        const errorBuffer = new Float32Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                let r = pixels[index];
                let g = pixels[index + 1];
                let b = pixels[index + 2];
                
                // Enhanced luminance calculation (using sRGB weights)
                let luma = (0.2126 * r + 0.7152 * g + 0.0722 * b);
                
                // Add error diffusion
                luma += errorBuffer[y * width + x];
                luma = Math.min(255, Math.max(0, luma));
                
                // Edge enhancement
                const edgeStrength = edgeMap[y * width + x];
                const enhancedLuma = luma + (edgeStrength * 20);
                
                // Adaptive gamma correction
                const gamma = 1.4 + (edgeStrength * 0.3);
                const normalized = enhancedLuma / 255;
                const gammaCorrected = Math.pow(normalized, 1/gamma) * 255;
                
                // Select character using density mapping for accuracy
                let char;
                if (densityMap) {
                    const targetDensity = gammaCorrected / 255;
                    let bestMatch = densityMap[0];
                    let minDiff = Math.abs(bestMatch.density - targetDensity);
                    
                    for (let i = 1; i < densityMap.length; i++) {
                        const diff = Math.abs(densityMap[i].density - targetDensity);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestMatch = densityMap[i];
                        }
                    }
                    char = bestMatch.char;
                } else {
                    const charIndex = Math.floor((gammaCorrected / 255) * (charSet.length - 1));
                    char = charSet[charIndex];
                }
                
                currentAsciiText += char;
                if (x === width - 1) {
                    currentAsciiText += '\n';
                }

                // Error diffusion (Floyd-Steinberg)
                const error = luma - (gammaCorrected);
                if (x + 1 < width) {
                    errorBuffer[y * width + (x + 1)] += error * 7 / 16;
                }
                if (y + 1 < height) {
                    if (x > 0) {
                        errorBuffer[(y + 1) * width + (x - 1)] += error * 3 / 16;
                    }
                    errorBuffer[(y + 1) * width + x] += error * 5 / 16;
                    if (x + 1 < width) {
                        errorBuffer[(y + 1) * width + (x + 1)] += error * 1 / 16;
                    }
                }

                // Enhanced color rendering
                let color;
                if (currentColorMode === 'colorful') {
                    // Advanced color saturation
                    const luminance = (r + g + b) / 3;
                    const saturation = 1.3;
                    const enhancedR = Math.min(255, luminance + (r - luminance) * saturation);
                    const enhancedG = Math.min(255, luminance + (g - luminance) * saturation);
                    const enhancedB = Math.min(255, luminance + (b - luminance) * saturation);
                    color = `rgb(${Math.round(enhancedR)}, ${Math.round(enhancedG)}, ${Math.round(enhancedB)})`;
                } else if (currentColorMode === 'green') {
                    const greenValue = Math.round(gammaCorrected);
                    color = `rgb(0, ${greenValue}, ${Math.round(greenValue * 0.3)})`;
                } else if (currentColorMode === 'bw') {
                    const bwValue = Math.round(gammaCorrected);
                    color = `rgb(${bwValue}, ${bwValue}, ${bwValue})`;
                } else if (currentColorMode === 'retro') {
                    const amber = Math.round(gammaCorrected);
                    color = `rgb(${amber}, ${Math.round(amber * 0.65)}, 0)`;
                }

                ctx.fillStyle = color;
                ctx.fillText(char, x * charWidth, y * charHeight);
            }
        }

        dimensions.textContent = `${width} × ${height} characters`;
        characters.textContent = `${width * height} total characters`;
        imageSize.textContent = `Original: ${sourceWidth} × ${sourceHeight}px`;
    } catch (error) {
        console.error('Error in convertToAscii:', error);
    }
}

// Advanced image enhancement with multi-stage processing
function applyImageEnhancements(imageData, contrast, brightness, sharpness) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Step 1: Brightness and Contrast
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            let value = data[i + c];
            // Apply brightness
            value *= brightness;
            // Apply contrast
            value = ((value / 255 - 0.5) * contrast + 0.5) * 255;
            data[i + c] = Math.min(255, Math.max(0, value));
        }
    }
    
    // Step 2: Sharpness (Unsharp Mask)
    if (sharpness > 1.0) {
        const tempData = new Uint8ClampedArray(data);
        const amount = (sharpness - 1.0) * 1.5;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    const idx = (y * width + x) * 4 + c;
                    const center = tempData[idx];
                    
                    // 3x3 Gaussian blur for unsharp mask
                    const blur = (
                        tempData[((y-1) * width + (x-1)) * 4 + c] * 0.077 +
                        tempData[((y-1) * width + x) * 4 + c] * 0.123 +
                        tempData[((y-1) * width + (x+1)) * 4 + c] * 0.077 +
                        tempData[(y * width + (x-1)) * 4 + c] * 0.123 +
                        tempData[(y * width + x) * 4 + c] * 0.20 +
                        tempData[(y * width + (x+1)) * 4 + c] * 0.123 +
                        tempData[((y+1) * width + (x-1)) * 4 + c] * 0.077 +
                        tempData[((y+1) * width + x) * 4 + c] * 0.123 +
                        tempData[((y+1) * width + (x+1)) * 4 + c] * 0.077
                    );
                    
                    const sharpened = center + (center - blur) * amount;
                    data[idx] = Math.min(255, Math.max(0, sharpened));
                }
            }
        }
    }
}

// Sobel edge detection for detail preservation
function detectEdges(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const edgeMap = new Float32Array(width * height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    const kernelIdx = (ky + 1) * 3 + (kx + 1);
                    
                    gx += brightness * sobelX[kernelIdx];
                    gy += brightness * sobelY[kernelIdx];
                }
            }
            
            const magnitude = Math.sqrt(gx * gx + gy * gy) / 1442; // Normalize
            edgeMap[y * width + x] = Math.min(1, magnitude);
        }
    }
    
    return edgeMap;
}

function toggleFullscreen() {
    if (!isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    canvasContainer.classList.add('fullscreen');
    fullscreenHeader.style.display = 'flex';
    isFullscreen = true;
    fullscreenBtn.textContent = 'Exit Fullscreen';
    
    setZoom(1);
    resetPan();
    
    setTimeout(() => {
        canvasContainer.style.cursor = 'default';
    }, 100);
}

function exitFullscreen() {
    canvasContainer.classList.remove('fullscreen');
    fullscreenHeader.style.display = 'none';
    isFullscreen = false;
    fullscreenBtn.textContent = 'Fullscreen';
    
    setZoom(1);
    resetPan();
}

function copyAsciiToClipboard() {
    if (!currentAsciiText) {
        showToast('No ASCII art to copy', 'error');
        return;
    }
    
    navigator.clipboard.writeText(currentAsciiText)
        .then(() => {
            showToast('ASCII art copied to clipboard!', 'success');
        })
        .catch(err => {
            showToast('Failed to copy ASCII art', 'error');
        });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function showProcessing(text = 'Processing...') {
    processingText.textContent = text;
    processingOverlay.style.display = 'flex';
}

function hideProcessing() {
    processingOverlay.style.display = 'none';
}

function resetCanvas() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    stopVideo();
    stopWebcam();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasContainer.classList.add('empty');
    emptyState.style.display = 'block';
    infoBar.style.display = 'none';
    currentImage = null;
    currentAsciiText = '';
    downloadBtn.disabled = true;
    copyAsciiBtn.disabled = true;
    resetBtn.disabled = true;
    playPauseBtn.disabled = true;
    stopBtn.disabled = true;
    captureFrameBtn.disabled = true;
    fullscreenBtn.disabled = true;
    fullscreenBtn.textContent = 'Fullscreen';
    
    if (videoSource.src) {
        URL.revokeObjectURL(videoSource.src);
        videoSource.removeAttribute('src');
        videoSource.load();
    }
    
    isPlaying = false;
    playPauseBtn.textContent = '▶ Play';
    playPauseBtn.classList.remove('playing');
    fpsDisplay.textContent = '0 FPS';
    
    if (isFullscreen) {
        exitFullscreen();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
