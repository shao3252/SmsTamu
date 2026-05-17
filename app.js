// 1. Initialize Supabase
const supabaseUrl = 'https://wwavdbfibzbjsnnavvfj.supabase.co';
const supabaseKey = 'sb_publishable_L1DxHGDmy2E8YVQDa3-M_g_Us4QmJQ7';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// State Variables
let isLoginMode = true;
let currentUser = null;
let userProfile = { username: 'Anonymous', bio: '', avatar_url: 'https://via.placeholder.com/150' };

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainApp = document.getElementById('main-app');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuthText = document.querySelector('.toggle-auth');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('auth-error');

// --- Initialization & Auth ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    handleSessionState(session);

    supabase.auth.onAuthStateChange((event, session) => {
        handleSessionState(session);
    });
}

function handleSessionState(session) {
    if (session) {
        currentUser = session.user;
        showMainApp();
        fetchProfile(); 
        fetchPosts();   
    } else {
        currentUser = null;
        showAuthSection();
    }
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    errorMsg.innerText = ''; 
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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) errorMsg.innerText = error.message;
    } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            errorMsg.innerText = error.message;
        } else {
            alert('Account created successfully! Logging you in...');
        }
    }
    authBtn.innerText = isLoginMode ? 'Login' : 'Sign Up';
    authBtn.disabled = false;
}

async function logout() {
    await supabase.auth.signOut();
}

// --- UI / Navigation ---
function showMainApp() {
    authSection.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

function showAuthSection() {
    mainApp.classList.add('hidden');
    authSection.classList.remove('hidden');
    emailInput.value = ''; passwordInput.value = '';
}

function navigate(tabName, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(tabName !== 'add') element.classList.add('active');

    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
    
    const selectedView = document.getElementById(`view-${tabName}`);
    if(selectedView) selectedView.classList.remove('hidden');

    if(tabName === 'home') fetchPosts();
    if(tabName === 'profile') fetchProfile();
}

// --- Profile Logic ---
async function fetchProfile() {
    if (!currentUser) return;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (data) {
        userProfile = data;
        updateProfileUI();
    } else if (error && error.code === 'PGRST116') {
        // Create default profile if missing
        const newProfile = { id: currentUser.id, username: 'User_' + Math.floor(Math.random() * 1000) };
        await supabase.from('profiles').insert([newProfile]);
        userProfile = newProfile;
        updateProfileUI();
    }
}

function updateProfileUI() {
    document.getElementById('profile-name').innerText = userProfile.username || 'Anonymous';
    document.getElementById('profile-bio').innerText = userProfile.bio || 'No bio yet.';
    if (userProfile.avatar_url) {
        document.getElementById('profile-img').src = userProfile.avatar_url;
    }
}

function openEditProfile() {
    document.getElementById('edit-username').value = userProfile.username || '';
    document.getElementById('edit-bio').value = userProfile.bio || '';
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function closeEditProfile() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

async function saveProfile() {
    const newName = document.getElementById('edit-username').value.trim();
    const newBio = document.getElementById('edit-bio').value.trim();

    const { error } = await supabase.from('profiles').upsert({ 
        id: currentUser.id, 
        username: newName, 
        bio: newBio 
    });

    if (error) {
        alert("Error saving profile: " + error.message);
    } else {
        userProfile.username = newName;
        userProfile.bio = newBio;
        updateProfileUI();
        closeEditProfile();
        fetchPosts(); 
    }
}

async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('profile-name').innerText = "Uploading...";
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);

    if (uploadError) {
        alert("Upload failed: " + uploadError.message);
        updateProfileUI(); 
        return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase.from('profiles').upsert({ 
        id: currentUser.id, 
        avatar_url: publicUrl 
    });

    if (!updateError) {
        userProfile.avatar_url = publicUrl;
        updateProfileUI();
        fetchPosts();
    }
}

// --- Posts Logic ---
async function fetchPosts() {
    const container = document.getElementById('posts-container');
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`*, profiles (username, avatar_url)`)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p class="error-msg">Failed to load posts.</p>`;
        return;
    }

    if (posts.length === 0) {
        container.innerHTML = `<p class="temp-text">No sweet messages yet. Be the first to post!</p>`;
        return;
    }

    container.innerHTML = '';
    
    posts.forEach(post => {
        const authorName = post.profiles?.username || 'Anonymous';
        const avatarUrl = post.profiles?.avatar_url || 'https://via.placeholder.com/150';
        
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" class="post-avatar">
                <div class="post-author-info">
                    <span class="post-author-name">${authorName} <i class="fas fa-check-circle verified-badge"></i></span>
                    <span class="post-time">${new Date(post.created_at).toLocaleDateString()} - ${post.category || 'Mengineyo'}</span>
                </div>
            </div>
            <div class="post-body">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn"><i class="fas fa-heart"></i> Like</button>
                <button class="action-btn"><i class="fas fa-comment"></i> 0</button>
                <button class="action-btn" onclick="navigator.clipboard.writeText('${post.content.replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i> Copy</button>
            </div>
        `;
        container.appendChild(postElement);
    });
}

async function submitPost() {
    if (!currentUser) return alert("You must be logged in to post.");

    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value.trim();
    const submitBtn = document.getElementById('submit-post-btn');

    if (!category || !content) return alert("Please select a category and write a message.");

    submitBtn.innerText = "Posting...";
    submitBtn.disabled = true;

    const { error } = await supabase.from('posts').insert([
        { user_id: currentUser.id, content: content, category: category }
    ]);

    submitBtn.innerText = "Post Message";
    submitBtn.disabled = false;

    if (error) {
        alert("Error posting: " + error.message);
    } else {
        document.getElementById('post-category').value = '';
        document.getElementById('post-content').value = '';
        const homeTab = document.querySelector('.nav-item i.fa-home').parentElement;
        navigate('home', homeTab);
    }
}

// Boot up
checkSession();
