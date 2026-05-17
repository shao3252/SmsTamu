// 1. Initialize Supabase
const supabaseUrl = 'https://wwavdbfibzbjsnnavvfj.supabase.co';
const supabaseKey = 'sb_publishable_L1DxHGDmy2E8YVQDa3-M_g_Us4QmJQ7';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// State Variables
let isLoginMode = true;

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainApp = document.getElementById('main-app');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuthText = document.querySelector('.toggle-auth');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('auth-error');

// 2. Session Check
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        showMainApp();
    } else {
        showAuthSection();
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') showMainApp();
        if (event === 'SIGNED_OUT') showAuthSection();
    });
}

// 3. Toggle Login/Signup Mode
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    errorMsg.innerText = ''; // Clear errors
    
    if (isLoginMode) {
        authTitle.innerText = 'Login to Account';
        authBtn.innerText = 'Login';
        toggleAuthText.innerText = 'Don\'t have an account? Sign up here.';
    } else {
        authTitle.innerText = 'Create Account';
        authBtn.innerText = 'Sign Up';
        toggleAuthText.innerText = 'Already have an account? Login here.';
    }
}

// 4. Handle Authentication
async function handleAuth() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    errorMsg.innerText = '';

    if (!email || !password) {
        errorMsg.innerText = 'Please provide both email and password.';
        return;
    }

    authBtn.innerText = 'Processing...';
    authBtn.disabled = true;

    if (isLoginMode) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) errorMsg.innerText = "Error: " + error.message;
    } else {
        // Sign Up
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            errorMsg.innerText = "Error: " + error.message;
        } else {
            alert('Account created successfully! Logging you in...');
        }
    }

    authBtn.innerText = isLoginMode ? 'Login' : 'Sign Up';
    authBtn.disabled = false;
}

// 5. Logout
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
}

// 6. Navigation Logic
function navigate(tabName, element) {
    // Remove 'active' class from all icons
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Add 'active' to the clicked icon, except the add button
    if(tabName !== 'add') {
        element.classList.add('active');
    }

    console.log("Navigating to:", tabName);
}

// 7. UI Helpers
function showMainApp() {
    authSection.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

function showAuthSection() {
    mainApp.classList.add('hidden');
    authSection.classList.remove('hidden');
    emailInput.value = '';
    passwordInput.value = '';
}

// Initialize
checkSession();

// --- Navigation Logic Enhancement ---
function navigate(tabName, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    if(tabName !== 'add') {
        element.classList.add('active');
    }

    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
    
    // Show selected view
    const selectedView = document.getElementById(`view-${tabName}`);
    if(selectedView) {
        selectedView.classList.remove('hidden');
    }

    // If navigating to home, refresh posts
    if(tabName === 'home') {
        fetchPosts();
    }
}

// --- Posts CRUD Logic ---
let currentUser = null;

// Listen to auth state to grab user ID
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        fetchPosts(); // Fetch posts when logged in
    } else {
        currentUser = null;
    }
});

// Fetch posts from Supabase
async function fetchPosts() {
    const container = document.getElementById('posts-container');
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching posts:", error);
        container.innerHTML = `<p class="error-msg">Failed to load posts.</p>`;
        return;
    }

    if (posts.length === 0) {
        container.innerHTML = `<p class="temp-text">No sweet messages yet. Be the first to post!</p>`;
        return;
    }

    container.innerHTML = ''; // Clear loading text
    
    posts.forEach(post => {
        // Generating a dummy avatar letter from User ID since we don't have Profiles yet
        const avatarLetter = "U"; 
        
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${avatarLetter}</div>
                <div class="post-author-info">
                    <span class="post-author-name">User <i class="fas fa-check-circle verified-badge"></i></span>
                    <span class="post-time">${new Date(post.created_at).toLocaleDateString()} - ${post.category || 'Mengineyo'}</span>
                </div>
            </div>
            <div class="post-body">
                ${post.content}
            </div>
            <div class="post-actions">
                <button class="action-btn"><i class="fas fa-heart"></i> Like</button>
                <button class="action-btn"><i class="fas fa-comment"></i> 0</button>
                <button class="action-btn" onclick="navigator.clipboard.writeText('${post.content}')"><i class="fas fa-copy"></i> Copy</button>
            </div>
        `;
        container.appendChild(postElement);
    });
}

// Submit a new post
async function submitPost() {
    if (!currentUser) {
        alert("You must be logged in to post.");
        return;
    }

    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value.trim();
    const submitBtn = document.getElementById('submit-post-btn');

    if (!category || !content) {
        alert("Please select a category and write a message.");
        return;
    }

    submitBtn.innerText = "Posting...";
    submitBtn.disabled = true;

    const { error } = await supabase
        .from('posts')
        .insert([
            { 
                user_id: currentUser.id, 
                content: content, 
                category: category 
            }
        ]);

    submitBtn.innerText = "Post Message";
    submitBtn.disabled = false;

    if (error) {
        alert("Error posting: " + error.message);
    } else {
        // Clear form and go back to home feed
        document.getElementById('post-category').value = '';
        document.getElementById('post-content').value = '';
        
        const homeTab = document.querySelector('.nav-item i.fa-home').parentElement;
        navigate('home', homeTab);
    }
}
