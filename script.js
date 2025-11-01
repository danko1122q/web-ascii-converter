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
const sizeBtns = document.querySelectorAll('.size-btn');
const customSizeGroup = document.getElementById('customSizeGroup');
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
let sizeMode = 'auto';
let originalImageWidth = 0;
let originalImageHeight = 0;

// Character sets
const charSets = {
    standard: ' .:-=+*#%@',
    detailed: ' .\'",:;!~-_+<>i?/\\|()1{}[]rcvunxzjftLCJUYXZO0Qoahkbdpqwm*WMB8&%$#@',
    simple: ' .+#@',
    blocks: ' ░▒▓█',
    binary: ' 01',
    enhanced: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
};

// Quality presets
const qualityPresets = {
    1: { name: 'Rendah', scale: 0.5 },
    2: { name: 'Sedang', scale: 0.75 },
    3: { name: 'Bagus', scale: 1 },
    4: { name: 'Tinggi', scale: 1.5 },
    5: { name: 'Ultra', scale: 2 }
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
            resetBtn.style.display = 'block';
            stopWebcam();
            emptyState.querySelector('.empty-state-icon').textContent = '🖼️';
            emptyState.querySelector('.empty-state-text').textContent = 'Seni ASCII Anda akan muncul di sini';
        } else if (currentMode === 'video') {
            videoSection.classList.add('active');
            videoControls.style.display = 'flex';
            downloadBtn.style.display = 'none';
            copyAsciiBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            stopWebcam();
            emptyState.querySelector('.empty-state-icon').textContent = '🎬';
            emptyState.querySelector('.empty-state-text').textContent = 'Video ASCII Anda akan muncul di sini';
        } else if (currentMode === 'webcam') {
            webcamSection.classList.add('active');
            videoControls.style.display = 'flex';
            downloadBtn.style.display = 'none';
            copyAsciiBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            emptyState.querySelector('.empty-state-icon').textContent = '📹';
            emptyState.querySelector('.empty-state-text').textContent = 'Mulai webcam untuk melihat ASCII langsung';
        }

        resetCanvas();
    });
});

// Size mode switching
sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sizeMode = btn.dataset.size;
        
        if (sizeMode === 'auto') {
            customSizeGroup.style.display = 'none';
            if (currentImage) {
                convertToAscii(currentImage);
            }
        } else {
            customSizeGroup.style.display = 'block';
        }
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

// Sliders
widthSlider.addEventListener('input', (e) => {
    widthValue.textContent = e.target.value;
    if (currentMode === 'image' && currentImage && sizeMode === 'custom') {
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

function loadImage(file) {
    showProcessing('Memuat gambar...');
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
            showToast('Error memuat gambar. Silakan coba file lain.', 'error');
            hideProcessing();
        };
        img.src = e.target.result;
    };
    reader.onerror = () => {
        showToast('Error membaca file. Silakan coba gambar lain.', 'error');
        hideProcessing();
    };
    reader.readAsDataURL(file);
}

function loadVideo(file) {
    showProcessing('Memuat video...');
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
        showToast('Tidak dapat memuat video. Silakan coba format lain (MP4, WebM, OGG, MOV, AVI, MKV).', 'error');
        resetCanvas();
        hideProcessing();
    };
}

async function toggleWebcam() {
    if (webcamStream) {
        stopWebcam();
        startWebcamBtn.textContent = 'Mulai Webcam';
        captureFrameBtn.disabled = true;
    } else {
        try {
            showProcessing('Memulai webcam...');
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
            showToast('Tidak dapat mengakses webcam. Silakan izinkan akses kamera.', 'error');
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
    
    playPauseBtn.textContent = '⏸ Jeda';
    playPauseBtn.classList.add('playing');
    
    renderVideoFrame();
}

function pauseVideo() {
    isPlaying = false;
    
    if (currentMode === 'video') {
        videoSource.pause();
    }
    
    playPauseBtn.textContent = '▶ Putar';
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
    
    playPauseBtn.textContent = '▶ Putar';
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
    
    playPauseBtn.textContent = '▶ Putar';
    playPauseBtn.classList.remove('playing');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    fpsDisplay.textContent = '0 FPS';
    
    if (startWebcamBtn) {
        startWebcamBtn.textContent = 'Mulai Webcam';
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
    const containerWidth = canvasContainer.clientWidth - 40;
    const containerHeight = window.innerHeight - 300;
    const quality = parseInt(qualitySlider.value);
    const qualityScale = qualityPresets[quality].scale;
    
    let width, height;
    
    if (sizeMode === 'auto') {
        // Calculate optimal width based on container and quality
        const maxCharWidth = Math.floor(containerWidth / 8);
        const maxCharHeight = Math.floor(containerHeight / 16);
        
        // Maintain aspect ratio
        const aspectRatio = sourceHeight / sourceWidth;
        const calculatedWidth = Math.min(maxCharWidth, Math.floor(sourceWidth / 10 * qualityScale));
        const calculatedHeight = Math.floor(calculatedWidth * aspectRatio * 0.5);
        
        width = Math.max(50, Math.min(300, calculatedWidth));
        height = Math.floor(width * aspectRatio * 0.5);
    } else {
        width = parseInt(widthSlider.value);
        const aspectRatio = sourceHeight / sourceWidth;
        height = Math.floor(width * aspectRatio * 0.5);
    }
    
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
        const charSet = charSets[charSetSelect.value];

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        tempCtx.filter = `contrast(${contrast}) brightness(${brightness})`;
        tempCtx.drawImage(source, 0, 0, width, height);

        const imageData = tempCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

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

        currentAsciiText = '';

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                let r = pixels[index];
                let g = pixels[index + 1];
                let b = pixels[index + 2];
                
                r = Math.min(255, Math.max(0, r * brightness));
                g = Math.min(255, Math.max(0, g * brightness));
                b = Math.min(255, Math.max(0, b * brightness));
                
                let brightnessValue = (0.299 * r + 0.587 * g + 0.114 * b);
                brightnessValue = Math.min(255, Math.max(0, (brightnessValue - 128) * contrast + 128));
                
                const gamma = 1.5;
                const normalized = brightnessValue / 255;
                const gammaCorrected = Math.pow(normalized, 1/gamma) * 255;
                const finalBrightness = (brightnessValue * 0.7 + gammaCorrected * 0.3);
                
                const charIndex = Math.floor((finalBrightness / 255) * (charSet.length - 1));
                const char = charSet[charIndex];
                
                currentAsciiText += char;
                if (x === width - 1) {
                    currentAsciiText += '\n';
                }

                let color;
                if (currentColorMode === 'colorful') {
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

        dimensions.textContent = `${width} × ${height} karakter`;
        characters.textContent = `${width * height} total karakter`;
        imageSize.textContent = `Asli: ${sourceWidth} × ${sourceHeight}px`;
    } catch (error) {
        console.error('Error in convertToAscii:', error);
    }
}

function sharpenImageData(imageData, factor) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const idx = (y * width + x) * 4 + c;
                const center = data[idx];
                const top = data[((y-1) * width + x) * 4 + c];
                const bottom = data[((y+1) * width + x) * 4 + c];
                const left = data[(y * width + (x-1)) * 4 + c];
                const right = data[(y * width + (x+1)) * 4 + c];
                
                const sharpened = center * (1 + 4 * (factor - 1)) - 
                                 (top + bottom + left + right) * (factor - 1);
                
                tempData[idx] = Math.min(255, Math.max(0, sharpened));
            }
        }
    }
    
    for (let i = 0; i < data.length; i++) {
        data[i] = tempData[i];
    }
}

function toggleFullscreen() {
    if (!isFullscreen) {
        canvasContainer.classList.add('fullscreen');
        fullscreenHeader.style.display = 'flex';
        isFullscreen = true;
        fullscreenBtn.textContent = 'Keluar Layar Penuh';
    } else {
        canvasContainer.classList.remove('fullscreen');
        fullscreenHeader.style.display = 'none';
        isFullscreen = false;
        fullscreenBtn.textContent = 'Layar Penuh';
    }
}

function copyAsciiToClipboard() {
    if (!currentAsciiText) {
        showToast('Tidak ada seni ASCII untuk disalin', 'error');
        return;
    }
    
    navigator.clipboard.writeText(currentAsciiText)
        .then(() => {
            showToast('Seni ASCII berhasil disalin!', 'success');
        })
        .catch(err => {
            showToast('Gagal menyalin seni ASCII', 'error');
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

function showProcessing(text = 'Memproses...') {
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
    fullscreenBtn.textContent = 'Layar Penuh';
    
    if (videoSource.src) {
        URL.revokeObjectURL(videoSource.src);
        videoSource.removeAttribute('src');
        videoSource.load();
    }
    
    isPlaying = false;
    playPauseBtn.textContent = '▶ Putar';
    playPauseBtn.classList.remove('playing');
    fpsDisplay.textContent = '0 FPS';
    
    if (isFullscreen) {
        canvasContainer.classList.remove('fullscreen');
        fullscreenHeader.style.display = 'none';
        isFullscreen = false;
    }
}

// Initialize
charSetSelect.value = 'enhanced';
qualitySlider.value = 4;
qualityValue.textContent = qualityPresets[4].name;

// Handle window resize
window.addEventListener('resize', () => {
    if (currentImage && sizeMode === 'auto') {
        convertToAscii(currentImage);
    }
});
