// --- Language Configuration (i18n) ---
const translations = {
    sw: {
        appName: "Sms Tamu 💖",
        landingDesc: "Mahali sahihi pa kupata meseji tamu za mapenzi na kuvutia.",
        getStartedBtn: "Anza Sasa",
        loginTitle: "Ingia Kwenye Akaunti",
        signupTitle: "Tengeneza Akaunti",
        loginBtn: "Ingia",
        signupBtn: "Jisajili",
        toggleToSignupText: "Hauna akaunti?",
        toggleToSignupLink: "Jisajili hapa",
        toggleToLoginText: "Unayo akaunti?",
        toggleToLoginLink: "Ingia hapa",
        navHome: "Nyumbani",
        navSearch: "Tafuta",
        navChat: "Chat",
        navProfile: "Wasifu",
        writeMessage: "Andika Meseji",
        selectCategory: "Chagua Kundi...",
        postMessageBtn: "Tuma Posti",
        following: "Wanaofuatiliwa",
        followers: "Wafuasi",
        editProfileBtn: "Badili Wasifu",
        myPosts: "Posti Zangu",
        liked: "Zilizopendwa",
        saved: "Zilizohifadhiwa",
        logoutBtn: "Toka (Logout)",
        cancelBtn: "Ghairi",
        saveBtn: "Hifadhi",
        loadingPosts: "Inapakia...",
        noPosts: "Hakuna posti bado. Kuwa wa kwanza kuposti!",
        emailPlaceholder: "Barua Pepe",
        passwordPlaceholder: "Nenosiri",
        authProcessing: "Inachakata..."
    },
    en: {
        appName: "Sms Tamu 💖",
        landingDesc: "The best place for sweet and romantic messages.",
        getStartedBtn: "Get Started",
        loginTitle: "Login to Account",
        signupTitle: "Create Account",
        loginBtn: "Login",
        signupBtn: "Sign Up",
        toggleToSignupText: "Don't have an account?",
        toggleToSignupLink: "Sign up here",
        toggleToLoginText: "Already have an account?",
        toggleToLoginLink: "Login here",
        navHome: "Home",
        navSearch: "Search",
        navChat: "Chat",
        navProfile: "Profile",
        writeMessage: "Write Message",
        selectCategory: "Select Category...",
        postMessageBtn: "Post Message",
        following: "Following",
        followers: "Followers",
        editProfileBtn: "Edit Profile",
        myPosts: "My Posts",
        liked: "Liked",
        saved: "Saved",
        logoutBtn: "Logout",
        cancelBtn: "Cancel",
        saveBtn: "Save",
        loadingPosts: "Loading...",
        noPosts: "No sweet messages yet. Be the first to post!",
        emailPlaceholder: "Email Address",
        passwordPlaceholder: "Password",
        authProcessing: "Processing..."
    }
};

let currentLang = 'sw'; // Default language

function setLanguage(lang) {
    currentLang = lang;
    
    // Update active button state
    document.getElementById('btn-sw').classList.remove('active');
    document.getElementById('btn-en').classList.remove('active');
    document.getElementById(`btn-${lang}`).classList.add('active');

    // Update all text elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });

    // Update Placeholders
    document.getElementById('email').placeholder = translations[lang].emailPlaceholder;
    document.getElementById('password').placeholder = translations[lang].passwordPlaceholder;
    document.getElementById('post-content').placeholder = (lang === 'sw') ? "Andika hapa..." : "Write here...";
}

// 1. Initialize Supabase
const supabaseUrl = 'https://wwavdbfibzbjsnnavvfj.supabase.co';
const supabaseKey = 'sb_publishable_L1DxHGDmy2E8YVQDa3-M_g_Us4QmJQ7';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// State Variables
let isLoginMode = true;
let currentUser = null;
let userProfile = { username: 'Anonymous', bio: '', avatar_url: 'https://via.placeholder.com/150' };

// DOM Elements
const landingSection = document.getElementById('landing-section');
const authSection = document.getElementById('auth-section');
const mainApp = document.getElementById('main-app');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleText = document.getElementById('toggle-text');
const toggleLink = document.getElementById('toggle-link');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('auth-error');

// --- Initialization & Auth ---
async function checkSession() {
    setLanguage('sw'); // Apply default language on load
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        handleSessionState(session);
    } else {
        // Show landing page if not logged in
        landingSection.classList.remove('hidden');
        authSection.classList.add('hidden');
        mainApp.classList.add('hidden');
    }

    supabase.auth.onAuthStateChange((event, session) => {
        handleSessionState(session);
    });
}

function handleSessionState(session) {
    if (session) {
        currentUser = session.user;
        landingSection.classList.add('hidden');
        authSection.classList.add('hidden');
        mainApp.classList.remove('hidden');
        fetchProfile(); 
        fetchPosts();   
    } else {
        currentUser = null;
    }
}

function showAuthSection() {
    landingSection.classList.add('hidden');
    authSection.classList.remove('hidden');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    errorMsg.innerText = ''; 
    
    if (isLoginMode) {
        authTitle.innerText = translations[currentLang].loginTitle;
        authBtn.innerText = translations[currentLang].loginBtn;
        toggleText.innerText = translations[currentLang].toggleToSignupText;
        toggleLink.innerText = translations[currentLang].toggleToSignupLink;
    } else {
        authTitle.innerText = translations[currentLang].signupTitle;
        authBtn.innerText = translations[currentLang].signupBtn;
        toggleText.innerText = translations[currentLang].toggleToLoginText;
        toggleLink.innerText = translations[currentLang].toggleToLoginLink;
    }
}

async function handleAuth() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    errorMsg.innerText = '';

    if (!email || !password) {
        errorMsg.innerText = (currentLang === 'sw') ? "Jaza barua pepe na nenosiri." : "Provide email and password.";
        return;
    }

    authBtn.innerText = translations[currentLang].authProcessing;
    authBtn.disabled = true;

    if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) errorMsg.innerText = error.message;
    } else {
        // Sign up logic fix
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            errorMsg.innerText = error.message;
        } else {
            const successMsg = (currentLang === 'sw') ? 'Akaunti imetengenezwa! Unaingia...' : 'Account created! Logging in...';
            alert(successMsg);
            
            // Auto login if email confirmation is off in Supabase
            if (data.session) {
                handleSessionState(data.session);
            } else {
                errorMsg.innerText = (currentLang === 'sw') ? 'Tafadhali thibitisha barua pepe yako (Check email).' : 'Please verify your email address.';
            }
        }
    }
    
    authBtn.innerText = isLoginMode ? translations[currentLang].loginBtn : translations[currentLang].signupBtn;
    authBtn.disabled = false;
}

async function logout() {
    await supabase.auth.signOut();
    mainApp.classList.add('hidden');
    landingSection.classList.remove('hidden');
}

// --- Navigation ---
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
        const newProfile = { id: currentUser.id, username: 'User_' + Math.floor(Math.random() * 1000) };
        await supabase.from('profiles').insert([newProfile]);
        userProfile = newProfile;
        updateProfileUI();
    }
}

function updateProfileUI() {
    document.getElementById('profile-name').innerText = userProfile.username || 'Anonymous';
    document.getElementById('profile-bio').innerText = userProfile.bio || '';
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

    document.getElementById('profile-name').innerText = (currentLang === 'sw') ? "Inapakia..." : "Uploading...";
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
        container.innerHTML = `<p class="error-msg">Failed to load.</p>`;
        return;
    }

    if (posts.length === 0) {
        container.innerHTML = `<p class="temp-text">${translations[currentLang].noPosts}</p>`;
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
                <button class="action-btn"><i class="fas fa-heart"></i></button>
                <button class="action-btn"><i class="fas fa-comment"></i></button>
                <button class="action-btn" onclick="navigator.clipboard.writeText('${post.content.replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
            </div>
        `;
        container.appendChild(postElement);
    });
}

async function submitPost() {
    if (!currentUser) return;

    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value.trim();
    const submitBtn = document.getElementById('submit-post-btn');

    if (!category || !content) return;

    submitBtn.innerText = translations[currentLang].authProcessing;
    submitBtn.disabled = true;

    const { error } = await supabase.from('posts').insert([
        { user_id: currentUser.id, content: content, category: category }
    ]);

    submitBtn.innerText = translations[currentLang].postMessageBtn;
    submitBtn.disabled = false;

    if (!error) {
        document.getElementById('post-category').value = '';
        document.getElementById('post-content').value = '';
        const homeTab = document.querySelector('.nav-item i.fa-home').parentElement;
        navigate('home', homeTab);
    }
}

// Boot up
checkSession();
