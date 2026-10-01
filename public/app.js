// DOM elements
const dreamForm = document.getElementById('dreamForm');
const dreamText = document.getElementById('dreamText');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const dreamsContainer = document.getElementById('dreamsContainer');

// Load dreams on page load
document.addEventListener('DOMContentLoaded', loadDreams); 

// Form submission
dreamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dream = dreamText.value.trim();
    if (!dream) return;

    // Clear previous errors
    clearErrorMessage();

    // Disable form while submitting
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        const response = await fetch('/api/dreams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dream_text: dream }),
        });
const data = await response.json();

        if (!response.ok) {
            showErrorMessage(data.error || 'Failed to process your dream. Please try again.');
            return;
        }
        
        // Clear form
        dreamText.value = '';
        
        // Reload dreams
        await loadDreams();

    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Network error. Please check your connection and try again.');
    } finally {
        // Re-enable form
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        
    }
});

// Load all dreams
async function loadDreams() {
    try {
        const response = await fetch('/api/dreams');
        if (!response.ok) {
            throw new Error('Failed to fetch dreams');
        }

        const dreams = await response.json();
        displayDreams(dreams);
        console.log('dreams loaded');
    } catch (error) {
        console.error('Error:', error);
        dreamsContainer.innerHTML = '<p class="error">Failed to load dreams. Please refresh the page.</p>';
    }
}

// Display dreams in the DOM
function displayDreams(dreams) {
    if (dreams.length === 0) {
        dreamsContainer.innerHTML = '<p class="empty">No dreams yet. Start by recording your first dream!</p>';
        return;
    }

    dreamsContainer.innerHTML = dreams.map(dream => {
        const interpretation = escapeHtml(dream.interpretation);
        const truncationLength = 300;
        const shouldTruncate = interpretation.length > truncationLength;
        const truncatedInterpretation = shouldTruncate ? interpretation.substring(0, truncationLength) + '...' : interpretation;

        return `
        <div class="dream-card" data-id="${dream.id}">
            <div class="dream-header">
                <span class="dream-date">${formatDate(dream.created_at)}</span>
                <button class="delete-btn">Delete</button>
            </div>
            <div class="dream-text">
                <strong>Dream:</strong> ${escapeHtml(dream.dream_text)}
            </div>
            <div class="interpretation">
                <h3>💭 Interpretation</h3>
                <div class="interpretation-text interpretation-expandable" data-full="${interpretation}" data-truncated="${truncatedInterpretation}" data-expanded="false">
                    ${truncatedInterpretation}
                </div>
                ${shouldTruncate ? `<button class="read-more-btn">Read More</button>` : ''}
            </div>
        </div>
    `;
    }).join('');

    dreamsContainer.querySelectorAll('.delete-btn').forEach(btn => {
        const card = btn.closest('.dream-card');
        btn.addEventListener('click', () => deleteDream(card.dataset.id));
    });

    dreamsContainer.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', toggleInterpretation);
    });
}

// Delete a dream
async function deleteDream(id) {
    if (!confirm('Are you sure you want to delete this dream?')) {
        return;
    }

    try {
        const response = await fetch(`/api/dreams/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete dream');
        }
        
        await loadDreams();
        console.log('dream deleted');
    } catch (error) {
        console.error('Error:', error);
    }
}
 
// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle interpretation expand/collapse
function toggleInterpretation(event) {
    event.preventDefault();
    const btn = event.target;
    const interpretationDiv = btn.previousElementSibling;
    const isExpanded = interpretationDiv.dataset.expanded === 'true';
    
    if (isExpanded) {
        interpretationDiv.textContent = interpretationDiv.dataset.truncated;
        interpretationDiv.dataset.expanded = 'false';
        btn.textContent = 'Read More';
    } else {
        interpretationDiv.textContent = interpretationDiv.dataset.full;
        interpretationDiv.dataset.expanded = 'true';
        btn.textContent = 'Read Less';
    }
}

// Show error message to user
function showErrorMessage(message) {
    const errorContainer = document.getElementById('errorContainer') || createErrorContainer();
    errorContainer.innerHTML = `
        <div class="error-alert">
            <strong>⚠️ Error:</strong> ${escapeHtml(message)}
            <button class="close-error">×</button>
        </div>
    `;
    errorContainer.style.display = 'block';
    errorContainer.querySelector('.close-error').addEventListener('click', clearErrorMessage);
}

// Clear error message
function clearErrorMessage() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
}

// Create error container if it doesn't exist
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'errorContainer';
    container.style.display = 'none';
    const addDreamSection = document.querySelector('.add-dream');
    addDreamSection.parentNode.insertBefore(container, addDreamSection);
    return container;
}