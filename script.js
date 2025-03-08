const form = document.getElementById('registrationForm');
const fileInput = document.getElementById('fileInput');
const mediaQueue = document.getElementById('mediaQueue');
const thumbnailQueue = document.getElementById('thumbnailQueue');
const addGraphicsBtn = document.getElementById('addGraphicsBtn');
let mediaItems = [];
let guestIndex = 0;
let signatures = {};
const predefinedColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71'
];
let groups = [];

window.addEventListener('load', () => {
    localStorage.clear();
    signatures = {};
    document.getElementById('mainRelease').checked = false;
    console.log('Page loaded with fresh state, localStorage cleared.');
});

let positions = {
    date: { x: 0.16, y: 0.70 },
    name: { x: 0.21, y: 0.73 },
    address: { x: 0.57, y: 0.73 },
    city: { x: 0.61, y: 0.76 },
    state: { x: 0.86, y: 0.76 },
    zip: { x: 0.89, y: 0.76 },
    cellphone: { x: 0.59, y: 0.70 },
    email: { x: 0.17, y: 0.79 },
    printedName: { x: 0.14, y: 0.30 },
    signature: { x: 0.19, y: 0.76 },
    guardianSignature: { x: 0.19, y: 0.92 }
};

// Add Guest Functionality
document.getElementById('addGuestBtn').addEventListener('click', () => {
    const container = document.getElementById('additionalGuestsContainer');
    const guestDiv = document.createElement('div');
    guestDiv.className = 'additional-guest';
    guestDiv.dataset.index = guestIndex;
    guestDiv.innerHTML = `
        <div class="form-group">
            <label>Guest Name</label>
            <input type="text" name="additionalGuestName[${guestIndex}]">
        </div>
        <div class="form-group">
            <label>Guest Title</label>
            <input type="text" name="additionalGuestTitle[${guestIndex}]">
        </div>
        <div class="form-group">
            <button type="button" class="sign-btn" data-index="${guestIndex}">Sign Release Form</button>
            <label>
                <input type="checkbox" name="additionalGuestRelease[${guestIndex}]" disabled>
                Release form signed
            </label>
        </div>
        <button type="button" class="remove-guest">Remove</button>
    `;
    container.appendChild(guestDiv);
    guestIndex++;
});

// Remove Guest
document.getElementById('additionalGuestsContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-guest')) {
        e.target.parentElement.remove();
    }
});

// Program "Other" Field
document.getElementById('program').addEventListener('change', (e) => {
    const otherField = document.getElementById('otherProgram');
    if (e.target.value === 'Other') {
        otherField.style.display = 'block';
        otherField.required = true;
    } else {
        otherField.style.display = 'none';
        otherField.required = false;
        otherField.value = '';
    }
});

// First Recording Conditional Content
document.querySelectorAll('input[name="firstRecording"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const yesDiv = document.getElementById('firstRecordingYes');
        const noDiv = document.getElementById('firstRecordingNo');
        if (e.target.value === 'Yes') {
            yesDiv.style.display = 'block';
            noDiv.style.display = 'none';
        } else {
            yesDiv.style.display = 'none';
            noDiv.style.display = 'block';
        }
    });
});

// Floating Add Graphics Button
const floatingAddGraphics = document.getElementById('floatingAddGraphics');
const floatingAddBtn = document.getElementById('floatingAddBtn');
const dismissBtn = floatingAddGraphics.querySelector('.dismiss-btn');
const graphicsSection = document.getElementById('graphicsSection');

floatingAddBtn.addEventListener('click', () => {
    graphicsSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        graphicsModal.style.display = 'flex';
        displayMediaItems();
    }, 500);
});

dismissBtn.addEventListener('click', () => {
    floatingAddGraphics.style.display = 'none';
});

window.addEventListener('scroll', () => {
    const rect = graphicsSection.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        floatingAddGraphics.classList.add('hidden');
    } else {
        floatingAddGraphics.classList.remove('hidden');
    }
});

// Graphics Modal
const graphicsModal = document.getElementById('graphicsModal');
const graphicsClose = document.getElementById('graphicsClose');
const openGroupsManagerGraphics = document.getElementById('openGroupsManagerGraphics');
const openGroupsManagerModal = document.getElementById('openGroupsManagerModal');

addGraphicsBtn.addEventListener('click', () => {
    graphicsSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        graphicsModal.style.display = 'flex';
        displayMediaItems();
    }, 500);
});

graphicsClose.addEventListener('click', () => graphicsModal.style.display = 'none');
graphicsModal.addEventListener('click', (e) => {
    if (e.target === graphicsModal) graphicsModal.style.display = 'none';
});

function openGroupsModal() {
    groupsManagerModal.style.display = 'flex';
    updateGroupsList();
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
}

openGroupsManagerGraphics.addEventListener('click', openGroupsModal);
openGroupsManagerModal.addEventListener('click', openGroupsModal);

// Media Upload and Display
fileInput.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    if (mediaItems.length + newFiles.length > 20) {
        alert('Maximum of 20 items allowed.');
        return;
    }
    const newMediaItems = newFiles.map(file => ({ file, group: '', description: '' }));
    mediaItems = mediaItems.concat(newMediaItems);
    regroupMediaItems();
    displayMediaItems();
    updateThumbnailQueueDebounced();
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const updateThumbnailQueueDebounced = debounce(() => {
    updateThumbnailQueue();
}, 300);

// Display Thumbnails on Main Page
function updateThumbnailQueue() {
    thumbnailQueue.innerHTML = '';
    mediaItems.forEach((mediaItem, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail-item';
        let url;
        if (mediaItem.file.type.startsWith('image/')) {
            const img = document.createElement('img');
            url = URL.createObjectURL(mediaItem.file);
            img.src = url;
            thumbnail.appendChild(img);
        } else if (mediaItem.file.type.startsWith('video/')) {
            const video = document.createElement('video');
            url = URL.createObjectURL(mediaItem.file);
            video.src = url;
            video.muted = true;
            thumbnail.appendChild(video);
        }
        thumbnail.dataset.url = url;
        thumbnail.addEventListener('click', () => {
            graphicsModal.style.display = 'flex';
            displayMediaItems();
        });
        thumbnailQueue.appendChild(thumbnail);
    });
}

// Regroup media items
function regroupMediaItems() {
    const groupedItems = {};
    mediaItems.forEach(item => {
        if (item.group) {
            if (!groupedItems[item.group]) groupedItems[item.group] = [];
            groupedItems[item.group].push(item);
        }
    });

    const newMediaItems = [];
    const processedGroups = new Set();

    mediaItems.forEach(item => {
        if (!item.group) {
            newMediaItems.push(item);
        } else if (!processedGroups.has(item.group)) {
            newMediaItems.push(...groupedItems[item.group]);
            processedGroups.add(item.group);
        }
    });

    mediaItems = newMediaItems;
}

function displayMediaItems() {
    mediaQueue.innerHTML = '';
    const groupColors = {};
    groups.forEach((group) => {
        groupColors[group.name] = group.color;
    });

    const groupPositions = {};
    mediaItems.forEach((item, index) => {
        if (item.group) {
            if (!groupPositions[item.group]) groupPositions[item.group] = { start: index, end: index };
            else groupPositions[item.group].end = index;
        }
    });

    mediaItems.forEach((mediaItem, index) => {
        const item = document.createElement('div');
        item.className = 'media-item';
        item.dataset.index = index;
        item.dataset.group = mediaItem.group || '';
        if (mediaItem.group) {
            item.classList.add('grouped');
            item.style.borderLeftColor = groupColors[mediaItem.group] || '#ddd';
            const groupInfo = groupPositions[mediaItem.group];
            if (index === groupInfo.start) item.classList.add('grouped-first');
            else if (index === groupInfo.end) item.classList.add('grouped-last');
            else item.classList.add('grouped-middle');
        }

        const dragIcon = document.createElement('span');
        dragIcon.className = 'drag-icon';
        dragIcon.innerHTML = '⋮⋮';
        item.appendChild(dragIcon);

        const number = document.createElement('span');
        number.className = 'media-number';
        number.textContent = `${index + 1}.`;
        item.appendChild(number);

        const preview = document.createElement('div');
        preview.className = 'preview';
        let url;
        if (mediaItem.file.type.startsWith('image/')) {
            const img = document.createElement('img');
            url = URL.createObjectURL(mediaItem.file);
            img.src = url;
            preview.appendChild(img);
        } else if (mediaItem.file.type.startsWith('video/')) {
            const video = document.createElement('video');
            url = URL.createObjectURL(mediaItem.file);
            video.src = url;
            video.controls = true;
            preview.appendChild(video);
        }
        item.dataset.url = url;
        item.appendChild(preview);

        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'description';
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Description *';
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.value = mediaItem.description || '';
        descInput.required = true;
        descInput.addEventListener('input', (e) => {
            mediaItem.description = e.target.value;
        });
        descriptionDiv.appendChild(descLabel);
        descriptionDiv.appendChild(descInput);
        item.appendChild(descriptionDiv);

        const groupSelect = document.createElement('select');
        groupSelect.className = 'group-select';
        groupSelect.innerHTML = '<option value="">None</option>';
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.name;
            option.textContent = group.name;
            option.style.backgroundColor = group.color;
            if (mediaItem.group === group.name) option.selected = true;
            groupSelect.appendChild(option);
        });
        groupSelect.addEventListener('change', (e) => {
            mediaItem.group = e.target.value;
            regroupMediaItems();
            displayMediaItems();
            updateThumbnailQueueDebounced();
        });
        item.appendChild(groupSelect);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            if (item.dataset.url) URL.revokeObjectURL(item.dataset.url);
            mediaItems.splice(index, 1);
            regroupMediaItems();
            displayMediaItems();
            updateThumbnailQueueDebounced();
        });
        item.appendChild(removeBtn);

        mediaQueue.appendChild(item);
    });

    new Sortable(mediaQueue, {
        animation: 300,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        group: 'media',
        onStart: (evt) => {
            const draggedItem = mediaItems[evt.oldIndex];
            if (draggedItem.group) {
                const groupItems = mediaItems.filter(item => item.group === draggedItem.group);
                const groupIndexes = groupItems.map(item => mediaItems.indexOf(item));
                groupIndexes.forEach(idx => {
                    if (idx !== evt.oldIndex) {
                        mediaQueue.children[idx].classList.add('sortable-chosen');
                    }
                });
            }
        },
        onMove: (evt) => {
            const fromIndex = evt.dragged.dataset.index;
            const toIndex = evt.related ? parseInt(evt.related.dataset.index) : mediaItems.length - 1;
            const draggedItem = mediaItems[fromIndex];
            const targetItem = mediaItems[toIndex];
            const draggedGroup = draggedItem.group || 'none';
            const targetGroup = targetItem.group || 'none';

            if (draggedGroup !== targetGroup) {
                const groupItems = targetGroup !== 'none' ? mediaItems.filter(item => item.group === targetGroup) : [];
                if (groupItems.length > 1) {
                    const groupIndexes = groupItems.map(item => mediaItems.indexOf(item));
                    const minIndex = Math.min(...groupIndexes);
                    const maxIndex = Math.max(...groupIndexes);
                    if (toIndex > minIndex && toIndex < maxIndex) {
                        return false;
                    }
                }
            }
            return true;
        },
        onEnd: (evt) => {
            const fromIndex = evt.oldIndex;
            const toIndex = evt.newIndex;
            const draggedItem = mediaItems[fromIndex];

            if (!draggedItem.group) {
                const movedItem = mediaItems.splice(fromIndex, 1)[0];
                mediaItems.splice(toIndex, 0, movedItem);
            } else {
                const group = draggedItem.group;
                const groupItems = mediaItems.filter(item => item.group === group);
                const groupIndexes = groupItems.map(item => mediaItems.indexOf(item));
                const minIndex = Math.min(...groupIndexes);
                const maxIndex = Math.max(...groupIndexes);

                const extractedGroup = [];
                for (let i = maxIndex; i >= minIndex; i--) {
                    extractedGroup.unshift(mediaItems.splice(minIndex, 1)[0]);
                }

                let insertIndex = toIndex;
                if (toIndex > fromIndex) {
                    insertIndex -= extractedGroup.length - 1;
                }
                insertIndex = Math.max(0, Math.min(insertIndex, mediaItems.length));

                mediaItems.splice(insertIndex, 0, ...extractedGroup);
            }

            regroupMediaItems();
            displayMediaItems();
            updateThumbnailQueueDebounced();
        }
    });
}

// Release Form Modal
const releaseModal = document.getElementById('releaseModal');
const canvas = document.getElementById('releaseCanvas');
const ctx = canvas.getContext('2d');
const signBtn = document.getElementById('signBtn');
const closeModal = document.querySelector('#releaseModal .close');
let currentGuestIndex = null;
let releaseFormImg = new Image();
releaseFormImg.src = './Guest Release Form.png';

function drawForm(fields) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!releaseFormImg.complete) {
        console.log('Release form image not loaded yet');
        return;
    }
    ctx.drawImage(releaseFormImg, 0, 0, canvas.width, canvas.height);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    ctx.fillStyle = 'black';
    ctx.font = '28px "SF Pro Display"';
    ctx.fillText(fields.date || 'March 07, 2025', positions.date.x * canvasWidth, positions.date.y * canvasHeight);
    ctx.fillText(fields.name || '', positions.name.x * canvasWidth, positions.name.y * canvasHeight);
    ctx.fillText(fields.address || '', positions.address.x * canvasWidth, positions.address.y * canvasHeight);
    ctx.fillText(fields.city || '', positions.city.x * canvasWidth, positions.city.y * canvasHeight);
    ctx.fillText(fields.state || '', positions.state.x * canvasWidth, positions.state.y * canvasHeight);
    ctx.fillText(fields.zip || '', positions.zip.x * canvasWidth, positions.zip.y * canvasHeight);
    ctx.fillText(fields.cellphone || '', positions.cellphone.x * canvasWidth, positions.cellphone.y * canvasHeight);
    ctx.fillText(fields.email || '', positions.email.x * canvasWidth, positions.email.y * canvasHeight);
    ctx.fillText(fields.program || 'No Program Selected', positions.printedName.x * canvasWidth, positions.printedName.y * canvasHeight);

    ctx.font = '28px "Dancing Script"';
    ctx.fillText(fields.name || '', positions.signature.x * canvasWidth, positions.signature.y * canvasHeight);
    if (fields.isMinor || currentGuestIndex === 'mainGuardian') {
        ctx.fillText(fields.guardianSignature || '', positions.guardianSignature.x * canvasWidth, positions.guardianSignature.y * canvasHeight);
    }
}

function openReleaseModal(index) {
    currentGuestIndex = index;
    releaseModal.style.display = 'flex';

    const signatureData = signatures[index] || { data: null, fields: {} };
    const hasSignature = !!signatureData.data;

    console.log(`Opening modal for index ${index}, hasSignature: ${hasSignature}, data:`, signatureData);

    const fields = {
        date: signatureData.fields?.date || 'March 07, 2025',
        name: signatureData.fields?.name || '',
        address: signatureData.fields?.address || '',
        city: signatureData.fields?.city || '',
        state: signatureData.fields?.state || '',
        zip: signatureData.fields?.zip || '',
        cellphone: signatureData.fields?.cellphone || '',
        email: signatureData.fields?.email || '',
        guardianSignature: signatureData.fields?.guardianSignature || '',
        isMinor: signatureData.fields?.isMinor || false,
        program: document.getElementById('program').value === 'Other' ? 
            document.getElementById('otherProgram').value : 
            document.getElementById('program').value || 'No Program Selected'
    };

    document.getElementById('dateInput').value = fields.date;
    document.getElementById('nameInput').value = fields.name;
    document.getElementById('addressInput').value = fields.address;
    document.getElementById('cityInput').value = fields.city;
    document.getElementById('stateInput').value = fields.state;
    document.getElementById('zipInput').value = fields.zip;
    document.getElementById('cellphoneInput').value = fields.cellphone;
    document.getElementById('emailInput').value = fields.email;
    document.getElementById('guardianSignatureInput').value = fields.guardianSignature;
    document.getElementById('isMinorModal').checked = fields.isMinor;

    const inputs = document.querySelectorAll('.form-overlay-input');
    inputs.forEach(input => {
        input.readOnly = false;
        input.style.backgroundColor = '#fafafa';
    });
    document.getElementById('isMinorModal').disabled = false;
    document.getElementById('guardianSignatureInput').style.display = fields.isMinor ? 'block' : 'none';

    releaseFormImg.onload = () => {
        drawForm(fields);
        if (hasSignature) {
            const signedImg = new Image();
            signedImg.src = signatureData.data;
            signedImg.onload = () => ctx.drawImage(signedImg, 0, 0, canvas.width, canvas.height);
        }
        signBtn.style.display = 'inline-block';
    };
    if (releaseFormImg.complete) drawForm(fields);

    inputs.forEach(input => {
        input.removeEventListener('input', drawForm);
        input.addEventListener('input', () => {
            const updatedFields = getFormFields();
            drawForm(updatedFields);
        });
    });

    const isMinorCheckbox = document.getElementById('isMinorModal');
    const guardianInput = document.getElementById('guardianSignatureInput');
    isMinorCheckbox.removeEventListener('change', toggleGuardianField);
    isMinorCheckbox.addEventListener('change', toggleGuardianField);

    function toggleGuardianField() {
        guardianInput.style.display = isMinorCheckbox.checked ? 'block' : 'none';
        const updatedFields = getFormFields();
        drawForm(updatedFields);
    }
}

function getFormFields() {
    return {
        date: document.getElementById('dateInput').value.trim(),
        name: document.getElementById('nameInput').value.trim(),
        address: document.getElementById('addressInput').value.trim(),
        city: document.getElementById('cityInput').value.trim(),
        state: document.getElementById('stateInput').value.trim(),
        zip: document.getElementById('zipInput').value.trim(),
        cellphone: document.getElementById('cellphoneInput').value.trim(),
        email: document.getElementById('emailInput').value.trim(),
        guardianSignature: document.getElementById('guardianSignatureInput').value.trim(),
        isMinor: document.getElementById('isMinorModal').checked,
        program: document.getElementById('program').value === 'Other' ? 
            document.getElementById('otherProgram').value : 
            document.getElementById('program').value || 'No Program Selected'
    };
}

document.getElementById('mainSignBtn').addEventListener('click', () => openReleaseModal('main'));
document.getElementById('additionalGuestsContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('sign-btn')) openReleaseModal(e.target.dataset.index);
});

signBtn.addEventListener('click', () => {
    const fields = getFormFields();

    if (!fields.name) {
        alert('Please enter a name to sign the form.');
        return;
    }

    drawForm(fields);
    requestAnimationFrame(() => {
        try {
            const signedImage = canvas.toDataURL('image/png');
            signatures[currentGuestIndex] = {
                data: signedImage,
                fields: { ...fields }
            };
            localStorage.setItem('signatures', JSON.stringify(signatures));
            const checkbox = currentGuestIndex === 'main' ?
                document.getElementById('mainRelease') :
                document.querySelector(`input[name="additionalGuestRelease[${currentGuestIndex}]"]`);
            if (checkbox) {
                checkbox.checked = true;
            } else {
                console.error(`Checkbox not found for index: ${currentGuestIndex}`);
            }
            console.log('Signature saved to localStorage:', signatures[currentGuestIndex]);
            releaseModal.style.display = 'none';
        } catch (e) {
            console.error('Error exporting canvas:', e);
            alert('Failed to save the signature due to a canvas error. Please ensure the form image is served correctly.');
        }
    });
});

closeModal.addEventListener('click', () => releaseModal.style.display = 'none');
releaseModal.addEventListener('click', (e) => {
    if (e.target === releaseModal) releaseModal.style.display = 'none';
});

// Groups Manager Modal
const groupsManagerModal = document.getElementById('groupsManagerModal');
const groupsClose = document.getElementById('groupsClose');
const addGroupBtn = document.getElementById('addGroupBtn');
const groupsList = document.getElementById('groupsList');

function updateGroupsList() {
    groupsList.innerHTML = '';
    groups.forEach((group) => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';

        const colorBox = document.createElement('span');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = group.color;

        const colorSwatchPopup = document.createElement('div');
        colorSwatchPopup.className = 'color-swatch-popup';
        predefinedColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            if (group.color === color) {
                swatch.classList.add('selected');
            }
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                group.color = color;
                updateGroupsList();
                displayMediaItems();
                updateThumbnailQueueDebounced();
                colorSwatchPopup.style.display = 'none';
            });
            colorSwatchPopup.appendChild(swatch);
        });

        colorBox.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = colorSwatchPopup.style.display === 'flex';
            document.querySelectorAll('.color-swatch-popup').forEach(popup => popup.style.display = 'none');
            colorSwatchPopup.style.display = isVisible ? 'none' : 'flex';
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name;
        nameSpan.contentEditable = true;
        nameSpan.addEventListener('blur', () => {
            const newName = nameSpan.textContent.trim();
            if (newName && newName !== group.name && !groups.some(g => g.name === newName)) {
                const oldName = group.name;
                group.name = newName;
                mediaItems.forEach(item => {
                    if (item.group === oldName) item.group = newName;
                });
                updateGroupsList();
                displayMediaItems();
                updateThumbnailQueueDebounced();
            } else if (newName !== group.name) {
                nameSpan.textContent = group.name;
                alert('Group name must be unique and non-empty.');
            }
        });
        nameSpan.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameSpan.blur();
            }
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            groups = groups.filter(g => g.name !== group.name);
            mediaItems.forEach(item => {
                if (item.group === group.name) item.group = '';
            });
            updateGroupsList();
            regroupMediaItems();
            displayMediaItems();
            updateThumbnailQueueDebounced();
        });

        groupItem.appendChild(colorBox);
        groupItem.appendChild(colorSwatchPopup);
        groupItem.appendChild(nameSpan);
        groupItem.appendChild(removeBtn);
        groupsList.appendChild(groupItem);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.color-box') && !e.target.closest('.color-swatch')) {
            document.querySelectorAll('.color-swatch-popup').forEach(popup => popup.style.display = 'none');
        }
    });
}

groupsClose.addEventListener('click', () => groupsManagerModal.style.display = 'none');
groupsManagerModal.addEventListener('click', (e) => {
    if (e.target === groupsManagerModal) groupsManagerModal.style.display = 'none';
});

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    });
});

addGroupBtn.addEventListener('click', () => {
    const groupName = document.getElementById('newGroupName').value.trim();
    const selectedColor = document.querySelector('.color-option.selected');
    if (groupName && selectedColor && !groups.some(g => g.name === groupName)) {
        groups.push({ name: groupName, color: selectedColor.getAttribute('data-color') });
        document.getElementById('newGroupName').value = '';
        updateGroupsList();
        regroupMediaItems();
        displayMediaItems();
        updateThumbnailQueueDebounced();
    } else {
        alert('Please enter a unique group name and select a color.');
    }
});

displayMediaItems();
updateThumbnailQueue();

// Form Submission with Download Option
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const requiredFields = ['program', 'ministryName', 'position', 'recordingDate', 'outline', 'suggestedQuestions'];
    let isValid = true;
    requiredFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value) {
            isValid = false;
            field.reportValidity();
        }
    });
    if (document.getElementById('program').value === 'Other' && !document.getElementById('otherProgram').value) {
        isValid = false;
        document.getElementById('otherProgram').reportValidity();
    }
    if (!document.querySelector('input[name="firstRecording"]:checked')) {
        isValid = false;
        document.querySelector('input[name="firstRecording"]').reportValidity();
    }
    if (!signatures['main']) {
        isValid = false;
        alert('Please sign the main release form.');
    }
    if (document.getElementById('isMinorModal').checked && !signatures['mainGuardian']) {
        isValid = false;
        alert('Please provide a guardian signature for a minor.');
    }
    if (mediaItems.length > 0 && mediaItems.some(item => !item.description.trim())) {
        isValid = false;
        alert('All uploaded media items require a description.');
        displayMediaItems();
    }

    if (!isValid) {
        alert('Please fill all required fields and sign the release form(s).');
        return;
    }

    const formData = new FormData();
    const programValue = document.getElementById('program').value === 'Other' ? 
        document.getElementById('otherProgram').value : 
        document.getElementById('program').value;
    formData.append('program', programValue);
    formData.append('ministryName', document.getElementById('ministryName').value);
    formData.append('ministryAddress', document.getElementById('ministryAddress').value);
    formData.append('ministryWebsite', document.getElementById('ministryWebsite').value || '');
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('name', document.getElementById('name').value);
    formData.append('position', document.getElementById('position').value);
    formData.append('homeAddress', document.getElementById('homeAddress').value);
    const recordingDate = document.getElementById('recordingDate').value;
    formData.append('recordingDate', recordingDate);
    const firstRecording = document.querySelector('input[name="firstRecording"]:checked');
    if (firstRecording) formData.append('firstRecording', firstRecording.value);
    formData.append('mainRelease', signatures['main'] ? signatures['main'].data : '');
    formData.append('isMinor', document.getElementById('isMinorModal').checked);
    formData.append('guardianRelease', signatures['mainGuardian'] ? signatures['mainGuardian'].data : '');

    const additionalGuests = [];
    document.querySelectorAll('.additional-guest').forEach(guestDiv => {
        const index = guestDiv.dataset.index;
        const name = guestDiv.querySelector(`input[name="additionalGuestName[${index}]"]`).value;
        const title = guestDiv.querySelector(`input[name="additionalGuestTitle[${index}]"]`).value;
        const release = signatures[index] ? signatures[index].data : '';
        additionalGuests.push({ name, title, release });
    });
    formData.append('additionalGuests', JSON.stringify(additionalGuests));

    mediaItems.forEach((mediaItem, index) => {
        formData.append('mediaFiles[]', mediaItem.file);
        formData.append('mediaDescriptions[]', mediaItem.description);
        formData.append('mediaGroups[]', mediaItem.group);
    });

    formData.append('suggestedTitle', document.getElementById('suggestedTitle').value);
    formData.append('outline', document.getElementById('outline').value);
    formData.append('suggestedQuestions', document.getElementById('suggestedQuestions').value);

    console.log('Form data ready to submit:', formData);

    const thankYouOverlay = document.getElementById('thankYouOverlay');
    thankYouOverlay.style.display = 'flex';

    const downloadFormsBtn = document.getElementById('downloadFormsBtn');
    downloadFormsBtn.onclick = () => {
        const zip = new JSZip();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Load the logo
        const logoImg = new Image();
        logoImg.src = './3abn.png';
        logoImg.onload = () => {
            // Calculate aspect ratio and maintain it
            const logoWidth = 50; // Desired width
            const aspectRatio = logoImg.height / logoImg.width;
            const logoHeight = logoWidth * aspectRatio;
            doc.addImage(logoImg, 'PNG', 10, 10, logoWidth, logoHeight);

            // Title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('3ABN Guest Registration Form', 70, 25);

            // Public Ministry Information
            let y = 40;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Public Ministry Information', 10, y);
            y += 5;
            doc.setLineWidth(0.5);
            doc.line(10, y, 200, y);
            y += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Program: ${programValue}`, 10, y); y += 7;
            doc.text(`Ministry Name: ${document.getElementById('ministryName').value}`, 10, y); y += 7;
            doc.text(`Ministry Address: ${document.getElementById('ministryAddress').value || ''}`, 10, y); y += 7;
            doc.text(`Ministry Website: ${document.getElementById('ministryWebsite').value || ''}`, 10, y); y += 7;
            doc.text(`Email: ${document.getElementById('email').value || ''}`, 10, y); y += 7;
            doc.text(`Phone: ${document.getElementById('phone').value || ''}`, 10, y); y += 10;

            // Private Guest Information
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Private Guest Information', 10, y);
            y += 5;
            doc.line(10, y, 200, y);
            y += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${document.getElementById('name').value || ''}`, 10, y); y += 7;
            doc.text(`Position: ${document.getElementById('position').value}`, 10, y); y += 7;
            doc.text(`Home Address: ${document.getElementById('homeAddress').value || ''}`, 10, y); y += 7;
            doc.text(`Recording Date: ${recordingDate}`, 10, y); y += 10;

            // Additional Guests
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Additional Guests', 10, y);
            y += 5;
            doc.line(10, y, 200, y);
            y += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            additionalGuests.forEach((guest, idx) => {
                doc.text(`Guest ${idx + 1}:`, 10, y); y += 7;
                doc.text(`  Name: ${guest.name || ''}`, 10, y); y += 7;
                doc.text(`  Title: ${guest.title || ''}`, 10, y); y += 7;
            });
            y += 5;

            // Graphics
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Graphics', 10, y);
            y += 5;
            doc.line(10, y, 200, y);
            y += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            mediaItems.forEach((item, idx) => {
                if (y > 270) { // Check for page overflow
                    doc.addPage();
                    y = 10;
                }
                doc.text(`Item ${idx + 1}: ${item.file.name}`, 10, y); y += 7;
                const descLines = doc.splitTextToSize(`  Description: ${item.description || ''}`, 180);
                doc.text(descLines, 10, y); y += descLines.length * 7;
            });
            y += 5;

            // Program Details
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Program Details', 10, y);
            y += 5;
            doc.line(10, y, 200, y);
            y += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Suggested Title: ${document.getElementById('suggestedTitle').value || ''}`, 10, y); y += 7;
            const outlineLines = doc.splitTextToSize(`Outline: ${document.getElementById('outline').value}`, 180);
            doc.text(outlineLines, 10, y); y += outlineLines.length * 7;
            const questionsLines = doc.splitTextToSize(`Suggested Questions: ${document.getElementById('suggestedQuestions').value}`, 180);
            doc.text(questionsLines, 10, y); y += questionsLines.length * 7;

            // Add PDF to ZIP
            const pdfBlob = doc.output('blob');
            zip.file("registration_form.pdf", pdfBlob);

            // Add release forms
            Object.keys(signatures).forEach((key) => {
                const signature = signatures[key];
                const fileName = key === 'main' ? 'main_release_form.png' : 
                                key === 'mainGuardian' ? 'guardian_release_form.png' : 
                                `additional_guest_${key}_release_form.png`;
                const base64Data = signature.data.split(',')[1];
                zip.file(fileName, base64Data, { base64: true });
            });

            // Generate and download ZIP
            zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, "3abn_registration_forms.zip");
                thankYouOverlay.style.display = 'none';
            });
        };
    };
});