document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const imageGallery = document.getElementById('imageGallery');
    const downloadBtn = document.getElementById('downloadBtn');
    const searchInput = document.getElementById('searchInput');
    
    // Modal Elements
    const downloadModal = document.getElementById('downloadModal');
    const imageModal = document.getElementById('imageModal');
    const renameFilesCheckbox = document.getElementById('renameFiles');
    const renameOptions = document.querySelector('.rename-options');
    const includeNotesCheckbox = document.getElementById('includeNotes');
    const baseFileName = document.getElementById('baseFileName');
    const confirmDownload = document.getElementById('confirmDownload');
    const cancelDownload = document.getElementById('cancelDownload');
    const previewImage = document.getElementById('previewImage');
    const imageNotes = document.getElementById('imageNotes');
    const saveNotes = document.getElementById('saveNotes');
    
    // Close buttons for modals
    const closeButtons = document.querySelectorAll('.close');
    
    // Store uploaded images
    let uploadedImages = [];
    let currentImageIndex = -1;
    
    // Maximum number of images
    const MAX_IMAGES = 50;
    
    // Initialize
    init();
    
    function init() {
        // Event Listeners
        uploadArea.addEventListener('click', triggerFileInput);
        uploadBtn.addEventListener('click', triggerFileInput);
        fileInput.addEventListener('change', handleFileSelect);
        downloadBtn.addEventListener('click', openDownloadModal);
        confirmDownload.addEventListener('click', downloadImages);
        cancelDownload.addEventListener('click', closeDownloadModal);
        searchInput.addEventListener('input', filterImages);
        saveNotes.addEventListener('click', saveImageNotes);
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        
        // Toggle rename options
        renameFilesCheckbox.addEventListener('change', function() {
            renameOptions.style.display = this.checked ? 'block' : 'none';
        });
        
        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                downloadModal.style.display = 'none';
                imageModal.style.display = 'none';
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === downloadModal) {
                downloadModal.style.display = 'none';
            }
            if (event.target === imageModal) {
                imageModal.style.display = 'none';
            }
        });
    }
    
    function triggerFileInput() {
        fileInput.click();
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }
    
    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    }
    
    function processFiles(files) {
        // Check if adding these files would exceed the maximum
        if (uploadedImages.length + files.length > MAX_IMAGES) {
            alert(`最多只能上传 ${MAX_IMAGES} 张图片。当前已有 ${uploadedImages.length} 张，选择了 ${files.length} 张。`);
            return;
        }
        
        // Process each file
        Array.from(files).forEach(file => {
            // Check if it's an image
            if (!file.type.match('image.*')) {
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageObj = {
                    id: generateUniqueId(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    notes: '',
                    date: new Date().toISOString()
                };
                
                uploadedImages.push(imageObj);
                renderImageGallery();
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    function renderImageGallery() {
        // Clear the gallery but keep the section header if it exists
        const sectionHeader = imageGallery.querySelector('.section-header');
        imageGallery.innerHTML = '';
        
        // If no images, show empty state
        if (uploadedImages.length === 0) {
            imageGallery.innerHTML = `
                <div class="empty-gallery">
                    <i class="fas fa-images"></i>
                    <p>上传图片后将显示在这里</p>
                    <p class="gallery-tip">上传后点击图片可以添加注释</p>
                </div>
            `;
            downloadBtn.disabled = true;
            return;
        }
        
        // Enable download button
        downloadBtn.disabled = false;
        
        // Render each image
        uploadedImages.forEach((image, index) => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.dataset.id = image.id;
            
            // Add a note indicator if the image has notes
            const noteIndicator = image.notes ? 
                `<div class="note-indicator" title="此图片有注释"><i class="fas fa-sticky-note"></i></div>` : '';
            
            imageCard.innerHTML = `
                <div class="image-container">
                    <img src="${image.data}" alt="${image.name}">
                    <div class="image-actions">
                        <div class="action-btn delete" title="删除">
                            <i class="fas fa-trash"></i>
                        </div>
                        <div class="action-btn edit" title="编辑注释">
                            <i class="fas fa-edit"></i>
                        </div>
                    </div>
                    ${noteIndicator}
                </div>
                <div class="image-info">
                    <div class="image-name">${image.name}</div>
                    <div class="image-notes">${image.notes || '无注释 (点击图片添加)'}</div>
                </div>
            `;
            
            // Add event listeners
            imageCard.querySelector('.image-container').addEventListener('click', function(e) {
                if (!e.target.closest('.action-btn')) {
                    openImageModal(index);
                }
            });
            
            imageCard.querySelector('.action-btn.delete').addEventListener('click', function() {
                deleteImage(index);
            });
            
            imageCard.querySelector('.action-btn.edit').addEventListener('click', function() {
                openImageModal(index);
            });
            
            imageGallery.appendChild(imageCard);
        });
    }
    
    function openImageModal(index) {
        currentImageIndex = index;
        const image = uploadedImages[index];
        
        previewImage.src = image.data;
        imageNotes.value = image.notes;
        
        // Focus on the textarea after a short delay
        setTimeout(() => {
            imageNotes.focus();
        }, 300);
        
        imageModal.style.display = 'block';
    }
    
    function saveImageNotes() {
        if (currentImageIndex >= 0) {
            uploadedImages[currentImageIndex].notes = imageNotes.value;
            renderImageGallery();
            
            // Show a brief success message
            const saveBtn = document.getElementById('saveNotes');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> 已保存';
            saveBtn.disabled = true;
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
                imageModal.style.display = 'none';
            }, 1000);
        }
    }
    
    function deleteImage(index) {
        if (confirm('确定要删除这张图片吗？')) {
            uploadedImages.splice(index, 1);
            renderImageGallery();
        }
    }
    
    function filterImages() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const imageCards = document.querySelectorAll('.image-card');
        
        imageCards.forEach((card, index) => {
            const image = uploadedImages[index];
            const matchesSearch = 
                image.name.toLowerCase().includes(searchTerm) || 
                image.notes.toLowerCase().includes(searchTerm);
            
            card.style.display = matchesSearch ? 'block' : 'none';
        });
    }
    
    function openDownloadModal() {
        downloadModal.style.display = 'block';
    }
    
    function closeDownloadModal() {
        downloadModal.style.display = 'none';
    }
    
    async function downloadImages() {
        const shouldRename = renameFilesCheckbox.checked;
        const includeNotes = includeNotesCheckbox.checked;
        const baseFileNameValue = baseFileName.value || 'image';
        
        try {
            const zip = new JSZip();
            
            // Add images to zip
            uploadedImages.forEach((image, index) => {
                // Convert base64 to blob
                const imageData = image.data.split(',')[1];
                const byteCharacters = atob(imageData);
                const byteArrays = [];
                
                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                    const slice = byteCharacters.slice(offset, offset + 512);
                    
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                
                const blob = new Blob(byteArrays, { type: image.type });
                
                // Determine filename
                let filename;
                if (shouldRename) {
                    const extension = image.name.split('.').pop();
                    filename = `${baseFileNameValue}-${index + 1}.${extension}`;
                } else {
                    filename = image.name;
                }
                
                // Add to zip
                zip.file(filename, blob);
                
                // Add notes if requested
                if (includeNotes && image.notes) {
                    const notesFilename = filename.split('.')[0] + '.txt';
                    zip.file(notesFilename, image.notes);
                }
            });
            
            // Generate zip file
            const content = await zip.generateAsync({ type: 'blob' });
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(content);
            downloadLink.download = 'images.zip';
            downloadLink.click();
            
            // Clean up
            URL.revokeObjectURL(downloadLink.href);
            closeDownloadModal();
            
        } catch (error) {
            console.error('Error creating zip file:', error);
            alert('下载过程中出现错误，请重试。');
        }
    }
    
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}); 