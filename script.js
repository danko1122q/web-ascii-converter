// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const videoUploadArea = document.getElementById('videoUploadArea');
const fileInput = document.getElementById('fileInput');
const videoInput = document.getElementById('videoInput');
const canvas = document.getElementById('asciiCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const canvasContainer = document.getElementById('canvasContainer');
const emptyState = document.getElementById('emptyState');
const widthSlider = document.getElementById('widthSlider');
const widthValue = document.getElementById('widthValue');
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
const colorBtns = document.querySelectorAll('.color-btn');
const infoBar = document.getElementById('infoBar');
const dimensions = document.getElementById('dimensions');
const characters = document.getElementById('characters');
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

// Character sets with enhanced dark character support
const charSets = {
    standard: ' .:-=+*#%@',
    detailed: ' .\'",:;!~-_+<>i?/\\|()1{}[]rcvunxzjftLCJUYXZO0Qoahkbdpqwm*WMB8&%$#@',
    simple: ' .+#@',
    blocks: ' ░▒▓█',
    binary: ' 01',
    enhanced: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
};

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
            stopWebcam();
            emptyState.querySelector('.empty-state-icon').textContent = '🖼️';
            emptyState.querySelector('.empty-state-text').textContent = 'Your ASCII art will appear here';
        } else if (currentMode === 'video') {
            videoSection.classList.add('active');
            videoControls.style.display = 'flex';
            downloadBtn.style.display = 'none';
            copyAsciiBtn.style.display = 'none';
            stopWebcam();
            emptyState.querySelector('.empty-state-icon').textContent = '🎬';
            emptyState.querySelector('.empty-state-text').textContent = 'Your ASCII video will appear here';
        } else if (currentMode === 'webcam') {
            webcamSection.classList.add('active');
            videoControls.style.display = 'flex';
            downloadBtn.style.display = 'none';
            copyAsciiBtn.style.display = 'none';
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

// Sliders
widthSlider.addEventListener('input', (e) => {
    widthValue.textContent = e.target.value;
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

function loadImage(file) {
    showProcessing('Loading image...');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            convertToAscii(img);
            downloadBtn.disabled = false;
            copyAsciiBtn.disabled = false;
            canvasContainer.classList.remove('empty');
            emptyState.style.display = 'none';
            infoBar.style.display = 'flex';
            fullscreenBtn.disabled = false;
            hideProcessing();
        };
        img.onerror = () => {
            alert('Error loading image. Please try another file.');
            hideProcessing();
        };
        img.src = e.target.result;
    };
    reader.onerror = () => {
        alert('Error reading file. Please try another image.');
        hideProcessing();
    };
    reader.readAsDataURL(file);
}

function loadVideo(file) {
    showProcessing('Loading video...');
    console.log('Loading video:', file.name, file.type, file.size);
    stopVideo();
    stopWebcam();
    
    // Create object URL from file
    const url = URL.createObjectURL(file);
    videoSource.src = url;
    videoSource.load();
    
    videoSource.onloadedmetadata = () => {
        console.log('Video loaded:', videoSource.videoWidth, 'x', videoSource.videoHeight, videoSource.duration + 's');
        canvasContainer.classList.remove('empty');
        emptyState.style.display = 'none';
        infoBar.style.display = 'flex';
        playPauseBtn.disabled = false;
        stopBtn.disabled = false;
        fullscreenBtn.disabled = false;
        hideProcessing();
        
        // Show first frame
        videoSource.currentTime = 0.1;
    };

    videoSource.onseeked = () => {
        if (!isPlaying && videoSource.currentTime < 1) {
            convertToAscii(videoSource);
        }
    };
    
    videoSource.onerror = (e) => {
        console.error('Video error:', videoSource.error);
        alert('Cannot load video. Please try another format (MP4, WebM, OGG, MOV, AVI, MKV).');
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
            alert('Cannot access webcam. Please allow camera permission.');
            console.error('Webcam error:', error);
            hideProcessing();
        }
    }
}

function captureFrame() {
    if (webcamStream) {
        convertToAscii(videoSource);
        downloadBtn.disabled = false;
        copyAsciiBtn.disabled = false;
        currentMode = 'image'; // Temporarily switch to image mode for download
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

function convertToAscii(source) {
    try {
        const width = parseInt(widthSlider.value);
        const fontSize = parseInt(fontSlider.value);
        const contrast = parseFloat(contrastSlider.value);
        const brightness = parseFloat(brightnessSlider.value);
        const sharpness = parseFloat(sharpnessSlider.value);
        const charSet = charSets[charSetSelect.value];
        
        // Check if source is valid
        const sourceWidth = source.videoWidth || source.width;
        const sourceHeight = source.videoHeight || source.height;
        
        if (!sourceWidth || !sourceHeight) {
            console.error('Invalid source dimensions');
            return;
        }
        
        const aspectRatio = sourceHeight / sourceWidth;
        const height = Math.floor(width * aspectRatio * 0.5);

        // Ensure valid dimensions
        if (width <= 0 || height <= 0) {
            console.error('Invalid dimensions');
            return;
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Apply sharpness with convolution filter
        tempCtx.filter = `contrast(${contrast}) brightness(${brightness})`;
        tempCtx.drawImage(source, 0, 0, width, height);

        const imageData = tempCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // Apply sharpness manually if needed
        if (sharpness > 1.0) {
            sharpenImageData(imageData, sharpness);
        }

        const charWidth = fontSize * 0.6;
        const charHeight = fontSize;

        canvas.width = width * charWidth;
        canvas.height = height * charHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        ctx.textBaseline = 'top';

        // Store ASCII text for copying
        currentAsciiText = '';

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                let r = pixels[index];
                let g = pixels[index + 1];
                let b = pixels[index + 2];
                
                // Apply brightness adjustment
                r = Math.min(255, Math.max(0, r * brightness));
                g = Math.min(255, Math.max(0, g * brightness));
                b = Math.min(255, Math.max(0, b * brightness));
                
                // Enhanced brightness calculation with gamma correction
                let brightnessValue = (0.299 * r + 0.587 * g + 0.114 * b);
                
                // Apply contrast enhancement with non-linear mapping for dark areas
                brightnessValue = Math.min(255, Math.max(0, (brightnessValue - 128) * contrast + 128));
                
                // Gamma correction to enhance details in dark areas
                const gamma = 1.5;
                const normalized = brightnessValue / 255;
                const gammaCorrected = Math.pow(normalized, 1/gamma) * 255;
                
                // Combine original and gamma-corrected values for better detail
                const finalBrightness = (brightnessValue * 0.7 + gammaCorrected * 0.3);
                
                // Improved character selection for dark areas
                const charIndex = Math.floor((finalBrightness / 255) * (charSet.length - 1));
                const char = charSet[charIndex];
                
                // Add character to ASCII text
                currentAsciiText += char;
                
                // Add line break at the end of each row
                if (x === width - 1) {
                    currentAsciiText += '\n';
                }

                let color;
                if (currentColorMode === 'colorful') {
                    // Enhanced color accuracy with better saturation
                    const saturation = 1.2;
                    const enhancedR = Math.min(255, r * saturation);
                    const enhancedG = Math.min(255, g * saturation);
                    const enhancedB = Math.min(255, b * saturation);
                    color = `rgb(${Math.round(enhancedR)}, ${Math.round(enhancedG)}, ${Math.round(enhancedB)})`;
                } else if (currentColorMode === 'green') {
                    const greenValue = Math.round(finalBrightness);
                    color = `rgb(0, ${greenValue}, 0)`;
                } else if (currentColorMode === 'bw') {
                    const bwValue = Math.round(finalBrightness);
                    color = `rgb(${bwValue}, ${bwValue}, ${bwValue})`;
                } else if (currentColorMode === 'retro') {
                    const amber = Math.round(finalBrightness);
                    color = `rgb(${amber}, ${Math.round(amber * 0.7)}, 0)`;
                }

                ctx.fillStyle = color;
                ctx.fillText(char, x * charWidth, y * charHeight);
            }
        }

        dimensions.textContent = `${width} × ${height} characters`;
        characters.textContent = `${width * height} total characters`;
    } catch (error) {
        console.error('Error in convertToAscii:', error);
    }
}

function sharpenImageData(imageData, factor) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);
    
    // Simple sharpening kernel
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const idx = (y * width + x) * 4 + c;
                const center = data[idx];
                const top = data[((y-1) * width + x) * 4 + c];
                const bottom = data[((y+1) * width + x) * 4 + c];
                const left = data[(y * width + (x-1)) * 4 + c];
                const right = data[(y * width + (x+1)) * 4 + c];
                
                // Apply sharpening
                const sharpened = center * (1 + 4 * (factor - 1)) - 
                                 (top + bottom + left + right) * (factor - 1);
                
                tempData[idx] = Math.min(255, Math.max(0, sharpened));
            }
        }
    }
    
    // Copy back to original image data
    for (let i = 0; i < data.length; i++) {
        data[i] = tempData[i];
    }
}

function toggleFullscreen() {
    if (!isFullscreen) {
        canvasContainer.classList.add('fullscreen');
        fullscreenHeader.style.display = 'flex';
        isFullscreen = true;
        fullscreenBtn.textContent = 'Exit Fullscreen';
    } else {
        canvasContainer.classList.remove('fullscreen');
        fullscreenHeader.style.display = 'none';
        isFullscreen = false;
        fullscreenBtn.textContent = 'Fullscreen';
    }
}

function copyAsciiToClipboard() {
    if (!currentAsciiText) {
        showToast('No ASCII art to copy');
        return;
    }
    
    navigator.clipboard.writeText(currentAsciiText)
        .then(() => {
            showToast('ASCII art copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy ASCII art');
        });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after 3 seconds
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
    playPauseBtn.disabled = true;
    stopBtn.disabled = true;
    captureFrameBtn.disabled = true;
    fullscreenBtn.disabled = true;
    fullscreenBtn.textContent = 'Fullscreen';
    
    // Clear video source
    if (videoSource.src) {
        URL.revokeObjectURL(videoSource.src);
        videoSource.removeAttribute('src');
        videoSource.load();
    }
    
    isPlaying = false;
    playPauseBtn.textContent = '▶ Play';
    playPauseBtn.classList.remove('playing');
    fpsDisplay.textContent = '0 FPS';
    
    // Reset fullscreen if active
    if (isFullscreen) {
        canvasContainer.classList.remove('fullscreen');
        fullscreenHeader.style.display = 'none';
        isFullscreen = false;
    }
}

// Initialize with enhanced character set selected
charSetSelect.value = 'enhanced';
