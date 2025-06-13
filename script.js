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
let questions = []; // Store questions in memory

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
    showWelcomeSection(); // Start by showing the welcome screen
}

function handleAccess() {
    const enteredPassword = accessPasswordInput.value.trim();

    if (enteredPassword === ACCESS_PASSWORD) {
        isAuthenticated = true;
        showMainSection();
        errorMessage.style.display = 'none';
    } else if (enteredPassword === ADMIN_PASSWORD) {
        isAuthenticated = true;
        isAdmin = true;
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
    // Show or hide upload section based on admin status
    if (isAdmin) {
        uploadSection.style.display = 'block';
    } else {
        uploadSection.style.display = 'none';
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

        // Convert file to base64 for proper storage
        const reader = new FileReader();
        reader.onload = async function(e) {
            const fileUrl = e.target.result;


            const newQuestion = {
                title: courseCode,
                description: description || 'No course name',
                file_url: fileUrl,
                file_name: file.name,
                created_at: new Date().toISOString(),
                
            };

            const { data, error } = await supabaseClient
                .from('slides')
                .insert([newQuestion]);

            if (error) {
                console.error('Insert error:', error);
                alert('Error uploading question: ' + error.message);
            } else {
                alert('Past question uploaded successfully!');
                loadQuestions();
            }
        


        // Clear form
        questionDescriptionInput.value = '';
        questionCodeInput.value = '';
        questionFileInput.value = '';

        uploadBtn.textContent = 'Upload Past Question';
        uploadBtn.disabled = false;
    };

    reader.readAsDataURL(file);

} catch (error) {
    alert('Error uploading question: ' + error.message);
    uploadBtn.textContent = 'Upload Past Question';
    uploadBtn.disabled = false;
}
}

async function loadQuestions() {
    try {
        // ✅ Make sure this is the client you created earlier
        const { data, error } = await window.supabaseClient
            .from('slides')                         // ✅ your table
            .select('*')                            // ✅ get all rows
            .order('created_at', { ascending: false }); // ✅ order newest first

        if (error) {
            throw error; // re-throw to be caught below
        }

        console.log("Slides data:", data);

        // ✅ Use correct variable name here
        const slides = data;

        // ✅ Now render them — replace with your actual render function
        displayQuestions(slides);

    } catch (error) {
        console.error('Error fetching slides:', error);
        alert('Error fetching slides: ' + error.message);
    }
}


function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    // Include searching functionality based on fetched questions from Supabase
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
        // Logic to delete question from Supabase goes here
    } catch (error) {
        alert('Error deleting past question: ' + error.message);
    }
}
