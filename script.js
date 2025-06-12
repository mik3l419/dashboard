// Simple password-based authentication
const ACCESS_PASSWORD = 'GCTU';
const ADMIN_PASSWORD = '1234'; // Admin password for upload access

// DOM elements
const welcomeSection = document.getElementById('welcome-section');
const mainSection = document.getElementById('main-section');
const accessPasswordInput = document.getElementById('access-password');
const accessBtn = document.getElementById('access-btn');
const errorMessage = document.getElementById('error-message');
const logoutBtn = document.getElementById('logout-btn');
const uploadSection = document.getElementById('upload-section');

const questionDescriptionInput = document.getElementById('question-description');
const questionCodeInput = document.getElementById('question-code');
const questionFileInput = document.getElementById('question-file');
const uploadBtn = document.getElementById('upload-btn');
const questionsContainer = document.getElementById('questions-container');
const searchInput = document.getElementById('search-input');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Authentication state
let isAuthenticated = false;
let isAdmin = false;
let questions = []; // Store questions in memory for demo
let filteredQuestions = []; // Store filtered questions

// Event listeners
accessBtn.addEventListener('click', handleAccess);
logoutBtn.addEventListener('click', handleLogout);
uploadBtn.addEventListener('click', handleUpload);
searchInput.addEventListener('input', handleSearch);

// Tab navigation
tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// Allow Enter key for password input
accessPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleAccess();
    }
});

// Initialize app
init();

function init() {
    // Check if user was previously authenticated (using localStorage)
    const wasAuthenticated = localStorage.getItem('authenticated') === 'true';
    if (wasAuthenticated) {
        showMainSection();
    } else {
        showWelcomeSection();
    }

    // Load demo questions
    loadDemoQuestions();
}

function handleAccess() {
    const enteredPassword = accessPasswordInput.value.trim();

    if (enteredPassword === ACCESS_PASSWORD) {
        isAuthenticated = true;
        localStorage.setItem('authenticated', 'true');
        showMainSection();
        errorMessage.style.display = 'none';
    } else {
        errorMessage.textContent = 'Incorrect password. Please try again.';
        errorMessage.style.display = 'block';
        accessPasswordInput.value = '';
        accessPasswordInput.focus();
    }
}

function handleLogout() {
    isAuthenticated = false;
    isAdmin = false;
    localStorage.removeItem('authenticated');
    showWelcomeSection();
    accessPasswordInput.value = '';
}

function showWelcomeSection() {
    welcomeSection.style.display = 'flex';
    mainSection.style.display = 'none';
    accessPasswordInput.focus();
}

function showMainSection() {
    welcomeSection.style.display = 'none';
    mainSection.style.display = 'block';
    switchTab('home'); // Show home tab by default
}

function switchTab(tabName) {
    // Remove active class from all tabs and contents
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}-tab`);
    
    if (selectedTab && selectedContent) {
        selectedTab.classList.add('active');
        selectedContent.classList.add('active');
        
        // If switching to past questions tab, check admin access and load questions
        if (tabName === 'past-questions') {
            checkAdminAccess();
            loadQuestions();
        }
    }
}

function checkAdminAccess() {
    // Only ask for admin password if not already admin
    if (!isAdmin) {
        const adminPassword = prompt('Enter admin password to access upload features (or click Cancel to continue as viewer):');
        
        if (adminPassword === ADMIN_PASSWORD) {
            isAdmin = true;
            uploadSection.style.display = 'block';
            alert('Admin access granted! You can now upload and delete questions.');
        } else if (adminPassword !== null) {
            // User entered wrong password
            alert('Incorrect admin password. You can view questions but cannot upload or delete.');
            isAdmin = false;
            uploadSection.style.display = 'none';
        } else {
            // User clicked cancel
            isAdmin = false;
            uploadSection.style.display = 'none';
        }
    } else {
        // Already admin, show upload section
        uploadSection.style.display = 'block';
    }
}

async function handleUpload() {
    

    if (!isAdmin) {
        alert('Admin access required to upload questions');
        return;
    }

    const description = questionDescriptionInput.value.trim();
    const courseCode = questionCodeInput.value.trim();
    const file = questionFileInput.files[0];

    if (!courseCode || !file) {
        alert('Please enter a Course Code and select a file');
        return;
    }

    try {
        uploadBtn.textContent = 'Uploading...';
        uploadBtn.disabled = true;

        // Create file URL (for demo purposes, we'll use object URL)
        const fileUrl = URL.createObjectURL(file);

        // Create new question object
        const newQuestion = {
            id: Date.now(), // Simple ID generation
            title: courseCode,
            description: description || 'No course name',
            file_url: fileUrl,
            file_name: file.name,
            created_at: new Date().toISOString()
        };

        // Add to questions array
        questions.unshift(newQuestion);

        // Save to localStorage for persistence
        localStorage.setItem('questions', JSON.stringify(questions));

        // Clear form
        questionDescriptionInput.value = '';
        questionCodeInput.value = '';
        questionFileInput.value = '';

        alert('Past question uploaded successfully!');
        loadQuestions();

    } catch (error) {
        alert('Error uploading question: ' + error.message);
    } finally {
        uploadBtn.textContent = 'Upload Past Question';
        uploadBtn.disabled = false;
    }
}

function loadDemoQuestions() {
    // Load questions from localStorage if available
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
        questions = JSON.parse(savedQuestions);
    } else {
        // Initialize with some demo questions
        questions = [
            {
                id: 1,
                title: 'CS101',
                description: 'Introduction to Computer Science',
                file_url: 'data:text/plain;base64,VGhpcyBpcyBhIGRlbW8gZmlsZQ==',
                file_name: 'cs101_past_question.pdf',
                created_at: '2024-01-15T10:00:00Z'
            },
            {
                id: 2,
                title: 'MATH201',
                description: 'Calculus II',
                file_url: 'data:text/plain;base64,VGhpcyBpcyBhbm90aGVyIGRlbW8gZmlsZQ==',
                file_name: 'math201_exam.pdf',
                created_at: '2024-01-10T14:30:00Z'
            }
        ];
        localStorage.setItem('questions', JSON.stringify(questions));
    }
}

function loadQuestions() {
    if (!isAuthenticated) return;

    filteredQuestions = questions;
    displayQuestions(filteredQuestions);
}

function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredQuestions = questions;
    } else {
        filteredQuestions = questions.filter(question => 
            question.title.toLowerCase().includes(searchTerm) ||
            question.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayQuestions(filteredQuestions);
}

function displayQuestions(questionsList) {
    if (questionsList.length === 0) {
        questionsContainer.innerHTML = '<p>No past questions uploaded yet.</p>';
        return;
    }

    questionsContainer.innerHTML = questionsList.map(question => `
        <div class="question-card">
            ${isImageFile(question.file_name) ? 
                `<img src="${question.file_url}" alt="${question.title}" class="question-image" onerror="this.style.display='none'">` : 
                '<div class="question-placeholder">📄 ' + escapeHtml(question.file_name) + '</div>'
            }
            <h3>${escapeHtml(question.title)}</h3>
            <p><strong>Course:</strong> ${escapeHtml(question.description)}</p>
            <p><small>Uploaded: ${new Date(question.created_at).toLocaleDateString()}</small></p>
            <div class="question-actions">
                <button class="view-btn" onclick="viewQuestion('${question.file_url}')">View</button>
                ${isAdmin ? `<button class="delete-btn" onclick="deleteQuestion(${question.id})">Delete</button>` : ''}
            </div>
        </div>
    `).join('');
}

function isImageFile(fileName) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = fileName.split('.').pop().toLowerCase();
    return imageExtensions.includes(extension);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function viewQuestion(url) {
    window.open(url, '_blank');
}

function deleteQuestion(questionId) {
    if (!isAuthenticated) {
        alert('Please authenticate first');
        return;
    }

    if (!isAdmin) {
        alert('Admin access required to delete questions');
        return;
    }

    if (!confirm('Are you sure you want to delete this past question?')) {
        return;
    }

    try {
        // Remove from questions array
        questions = questions.filter(q => q.id !== questionId);

        // Update localStorage
        localStorage.setItem('questions', JSON.stringify(questions));

        alert('Past question deleted successfully!');
        loadQuestions();
    } catch (error) {
        alert('Error deleting past question: ' + error.message);
    }
}
