// Toggle sidebar function
function toggleSidebar() {
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
sidebar.classList.toggle('open');
overlay.classList.toggle('hidden');
}

// Lightbox functions
function openLightbox(photoId) {
const photo = photos.find(p => p.id === photoId);
if (!photo) return;

currentPhotoIndex = photos.findIndex(p => p.id === photoId);

document.getElementById('lightboxImg').src = `/static/uploads/photos/${photo.filename}`;
document.getElementById('lightboxTitle').textContent = photo.title || 'Untitled';
document.getElementById('lightboxDescription').textContent = photo.description || '';
document.getElementById('lightboxDate').textContent = `Taken on ${formatDate(photo.date_taken)}`;
document.getElementById('editPhotoBtn').setAttribute('data-photo-id', photo.id);
document.getElementById('deletePhotoBtn').setAttribute('data-photo-id', photo.id);

document.getElementById('photoLightbox').style.display = 'flex';
document.body.style.overflow = 'hidden';
}

function closeLightbox() {
document.getElementById('photoLightbox').style.display = 'none';
document.body.style.overflow = 'auto';
}

function showNextPhoto() {
if (photos.length <= 1) return;

currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
const photo = photos[currentPhotoIndex];

document.getElementById('lightboxImg').src = `/static/uploads/photos/${photo.filename}`;
document.getElementById('lightboxTitle').textContent = photo.title || 'Untitled';
document.getElementById('lightboxDescription').textContent = photo.description || '';
document.getElementById('lightboxDate').textContent = `Taken on ${formatDate(photo.date_taken)}`;
document.getElementById('editPhotoBtn').setAttribute('data-photo-id', photo.id);
document.getElementById('deletePhotoBtn').setAttribute('data-photo-id', photo.id);
}

function showPrevPhoto() {
if (photos.length <= 1) return;

currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
const photo = photos[currentPhotoIndex];

document.getElementById('lightboxImg').src = `/static/uploads/photos/${photo.filename}`;
document.getElementById('lightboxTitle').textContent = photo.title || 'Untitled';
document.getElementById('lightboxDescription').textContent = photo.description || '';
document.getElementById('lightboxDate').textContent = `Taken on ${formatDate(photo.date_taken)}`;
document.getElementById('editPhotoBtn').setAttribute('data-photo-id', photo.id);
document.getElementById('deletePhotoBtn').setAttribute('data-photo-id', photo.id);
}

// Helper function to format dates
function formatDate(dateString) {
const options = { year: 'numeric', month: 'long', day: 'numeric' };
return new Date(dateString).toLocaleDateString('en-US', options);
}

// Global variables
let photos = [];
let currentPhotoIndex = 0;

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
// Set today's date as default for date taken
const today = new Date().toISOString().split('T')[0];
document.getElementById('dateTaken').value = today;

// Initialize the photo album
fetchPhotos();

// Upload photo button
document.getElementById('uploadPhotoBtn').addEventListener('click', function() {
    document.getElementById('uploadPhotoModal').style.display = 'flex';
});

document.getElementById('emptyStateUploadBtn').addEventListener('click', function() {
    document.getElementById('uploadPhotoModal').style.display = 'flex';
});

// Cancel upload button
document.getElementById('cancelUpload').addEventListener('click', function() {
    document.getElementById('uploadPhotoModal').style.display = 'none';
    resetUploadForm();
});

// Photo input change
document.getElementById('photoInput').addEventListener('change', handleFileSelect);

// Drop area functionality
const dropArea = document.getElementById('dropArea');

dropArea.addEventListener('click', function() {
    document.getElementById('photoInput').click();
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('border-[#BC6FB7]', 'bg-purple-50');
}

function unhighlight() {
    dropArea.classList.remove('border-[#BC6FB7]', 'bg-purple-50');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
    document.getElementById('photoInput').files = files;
    handleFileSelect();
    }
}

// Upload form submit
document.getElementById('uploadPhotoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    uploadPhoto();
});

// Lightbox navigation
document.getElementById('nextPhoto').addEventListener('click', showNextPhoto);
document.getElementById('prevPhoto').addEventListener('click', showPrevPhoto);

// Edit photo button
document.getElementById('editPhotoBtn').addEventListener('click', function() {
    const photoId = parseInt(this.getAttribute('data-photo-id'));
    openEditModal(photoId);
});

// Cancel edit button
document.getElementById('cancelEdit').addEventListener('click', function() {
    document.getElementById('editPhotoModal').style.display = 'none';
});

// Edit form submit
document.getElementById('editPhotoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    updatePhoto();
});

// Delete photo button
document.getElementById('deletePhotoBtn').addEventListener('click', function() {
    const photoId = parseInt(this.getAttribute('data-photo-id'));
    openDeleteModal(photoId);
});

// Cancel delete button
document.getElementById('cancelDelete').addEventListener('click', function() {
    document.getElementById('deletePhotoModal').style.display = 'none';
});

// Confirm delete button
document.getElementById('confirmDelete').addEventListener('click', function() {
    const photoId = parseInt(document.getElementById('deletePhotoBtn').getAttribute('data-photo-id'));
    deletePhoto(photoId);
});

// Sort options
document.getElementById('sortOptions').addEventListener('change', function() {
    sortPhotos(this.value);
});

// Close premium modal
document.getElementById('closePremiumModal').addEventListener('click', function() {
    document.getElementById('premiumUpgradeModal').style.display = 'none';
});
});

// Fetch photos from the API
function fetchPhotos() {
fetch('/api/photos')
    .then(response => {
    if (!response.ok) {
        throw new Error('Failed to fetch photos');
    }
    return response.json();
    })
    .then(data => {
    photos = data;
    renderPhotos();
    })
    .catch(error => {
    console.error('Error fetching photos:', error);
    });
}

// Render photos in the grid
function renderPhotos() {
const photoGrid = document.getElementById('photoGrid');
const emptyState = document.getElementById('emptyState');

if (photos.length === 0) {
    emptyState.style.display = 'block';
    return;
}

emptyState.style.display = 'none';

// Clear the grid
photoGrid.innerHTML = '';

// Add each photo
photos.forEach(photo => {
    const photoCard = document.createElement('div');
    photoCard.className = 'photo-card bg-white rounded-lg shadow-sm overflow-hidden fade-in';
    photoCard.innerHTML = `
    <div class="relative pb-[100%] overflow-hidden bg-gray-100">
        <img src="/static/uploads/photos/${photo.filename}" alt="${photo.title || 'Photo'}" 
            class="absolute inset-0 w-full h-full object-cover">
    </div>
    <div class="p-3">
        <h3 class="font-medium text-gray-900 truncate">${photo.title || 'Untitled'}</h3>
        <p class="text-xs text-gray-500 mt-1">${formatDate(photo.date_taken)}</p>
    </div>
    `;
    
    photoCard.addEventListener('click', function() {
    openLightbox(photo.id);
    });
    
    photoGrid.appendChild(photoCard);
});
}

// Handle file selection
function handleFileSelect() {
const fileInput = document.getElementById('photoInput');
const file = fileInput.files[0];

if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'block';
    document.getElementById('photoPreview').src = e.target.result;
    document.getElementById('fileNameDisplay').textContent = file.name;
    document.getElementById('submitUpload').disabled = false;
    };
    
    reader.readAsDataURL(file);
}
}

// Reset upload form
function resetUploadForm() {
document.getElementById('uploadPhotoForm').reset();
document.getElementById('uploadPlaceholder').style.display = 'block';
document.getElementById('previewContainer').style.display = 'none';
document.getElementById('submitUpload').disabled = true;

// Set today's date as default
const today = new Date().toISOString().split('T')[0];
document.getElementById('dateTaken').value = today;
}

// Upload photo
function uploadPhoto() {
const formData = new FormData(document.getElementById('uploadPhotoForm'));

fetch('/api/photos', {
    method: 'POST',
    body: formData
})
.then(response => {
    if (!response.ok) {
    return response.json().then(data => {
        throw new Error(data.error || 'Failed to upload photo');
    });
    }
    return response.json();
})
.then(data => {
    document.getElementById('uploadPhotoModal').style.display = 'none';
    resetUploadForm();
    fetchPhotos();
})
.catch(error => {
    console.error('Error uploading photo:', error);
    
    if (error.message.includes('maximum number of photos')) {
    document.getElementById('uploadPhotoModal').style.display = 'none';
    document.getElementById('premiumUpgradeModal').style.display = 'flex';
    } else {
    alert(error.message);
    }
});
}

// Open edit modal
function openEditModal(photoId) {
const photo = photos.find(p => p.id === photoId);
if (!photo) return;

document.getElementById('editPhotoId').value = photo.id;
document.getElementById('editPhotoTitle').value = photo.title || '';
document.getElementById('editPhotoDescription').value = photo.description || '';
document.getElementById('editDateTaken').value = photo.date_taken;

document.getElementById('editPhotoModal').style.display = 'flex';
closeLightbox();
}

// Update photo
function updatePhoto() {
const photoId = document.getElementById('editPhotoId').value;
const formData = new FormData(document.getElementById('editPhotoForm'));

fetch(`/api/photos/${photoId}`, {
    method: 'PUT',
    body: formData
})
.then(response => {
    if (!response.ok) {
    throw new Error('Failed to update photo');
    }
    return response.json();
})
.then(data => {
    document.getElementById('editPhotoModal').style.display = 'none';
    fetchPhotos();
})
.catch(error => {
    console.error('Error updating photo:', error);
    alert(error.message);
});
}

// Open delete modal
function openDeleteModal(photoId) {
document.getElementById('deletePhotoModal').style.display = 'flex';
closeLightbox();
}

// Delete photo
function deletePhoto(photoId) {
fetch(`/api/photos/${photoId}`, {
    method: 'DELETE'
})
.then(response => {
    if (!response.ok) {
    throw new Error('Failed to delete photo');
    }
    return response.json();
})
.then(data => {
    document.getElementById('deletePhotoModal').style.display = 'none';
    fetchPhotos();
})
.catch(error => {
    console.error('Error deleting photo:', error);
    alert(error.message);
});
}

// Sort photos
function sortPhotos(sortBy) {
switch (sortBy) {
    case 'newest':
    photos.sort((a, b) => new Date(b.date_taken) - new Date(a.date_taken));
    break;
    case 'oldest':
    photos.sort((a, b) => new Date(a.date_taken) - new Date(b.date_taken));
    break;
    case 'title':
    photos.sort((a, b) => {
        const titleA = a.title || 'Untitled';
        const titleB = b.title || 'Untitled';
        return titleA.localeCompare(titleB);
    });
    break;
}

renderPhotos();
}
