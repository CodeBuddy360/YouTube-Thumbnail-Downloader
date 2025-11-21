// Get DOM elements
const videoUrlInput = document.getElementById('videoUrl');
const fetchBtn = document.getElementById('fetchBtn');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const thumbnailPreview = document.getElementById('thumbnailPreview');

let currentVideoId = null;

// Extract video ID from various YouTube URL formats
function extractVideoId(url) {
    // Remove whitespace
    url = url.trim();

    // Handle different YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // Check if it's already a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

// Show error message to user
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    resultsSection.style.display = 'none';

    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Generate thumbnail URL based on video ID and quality
function getThumbnailUrl(videoId, quality) {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// Fetch and display thumbnail
function fetchThumbnail() {
    const url = videoUrlInput.value;

    if (!url) {
        showError('Please enter a YouTube video URL');
        return;
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
        showError('Invalid YouTube URL. Please check the URL and try again.');
        return;
    }

    // Store current video ID
    currentVideoId = videoId;

    // Hide any previous errors
    hideError();

    // Show the best quality thumbnail in preview
    const previewUrl = getThumbnailUrl(videoId, 'maxresdefault');
    thumbnailPreview.src = previewUrl;

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Download thumbnail with specified quality
async function downloadThumbnail(quality) {
    if (!currentVideoId) {
        showError('Please fetch a thumbnail first');
        return;
    }

    const thumbnailUrl = getThumbnailUrl(currentVideoId, quality);

    try {
        // Fetch the image
        const response = await fetch(thumbnailUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch thumbnail');
        }

        // Convert to blob
        const blob = await response.blob();

        // Create download link
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `youtube-thumbnail-${currentVideoId}-${quality}.jpg`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        showError('Failed to download thumbnail. Please try again.');
        console.error('Download error:', error);
    }
}

// Event listeners
fetchBtn.addEventListener('click', fetchThumbnail);

// Allow Enter key to fetch thumbnail
videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchThumbnail();
    }
});

// Add event listeners to all download buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.download-btn')) {
        const button = e.target.closest('.download-btn');
        const quality = button.getAttribute('data-quality');
        downloadThumbnail(quality);
    }
});

// Handle image load errors - fallback to lower quality
thumbnailPreview.addEventListener('error', function() {
    // If maxresdefault fails, try sddefault
    if (this.src.includes('maxresdefault')) {
        this.src = getThumbnailUrl(currentVideoId, 'sddefault');
    }
});
