// --- Language Dictionary ---
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

let currentLang = 'sw'; 
let supabase;
let isLoginMode = true;
let currentUser = null;
let userProfile = { username: 'Anonymous', bio: '', avatar_url: 'https://via.placeholder.com/150' };

// Initialize Supabase
try {
    const supabaseUrl = 'https://wwavdbfibzbjsnnavvfj.supabase.co';
    const supabaseKey = 'sb_publishable_L1DxHGDmy2E8YVQDa3-M_g_Us4QmJQ7';
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error("Supabase script not loaded.");
    }
} catch (error) {
    console.error("Supabase initialization error:", error);
}

// Ensure DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    window.setLanguage('sw');
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionState(session);
        
        supabase.auth.onAuthStateChange((event, session) => {
            handleSessionState(session);
        });
    }
});

// Helper functions for safe element manipulation
function safeHide(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }
function safeShow(id) { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }

function handleSessionState(session) {
    if (session) {
        currentUser = session.user;
        safeHide('landing-section');
        safeHide('auth-section');
        safeShow('main-app');
        fetchProfile(); 
        fetchPosts();   
    } else {
        currentUser = null;
        safeHide('main-app');
        safeHide('auth-section');
        safeShow('landing-section');
    }
}

// Global window functions mapped for HTML onclick attributes
window.setLanguage = function(lang) {
    currentLang = lang;
    const btnSw = document.getElementById('btn-sw');
    const btnEn = document.getElementById('btn-en');
    
    if (btnSw && btnEn) {
        btnSw.classList.remove('active');
        btnEn.classList.remove('active');
        document.getElementById(`btn-${lang}`).classList.add('active');
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const postContent = document.getElementById('post-content');

    if (emailInput) emailInput.placeholder = translations[lang].emailPlaceholder;
    if (passInput) passInput.placeholder = translations[lang].passwordPlaceholder;
    if (postContent) postContent.placeholder = (lang === 'sw') ? "Andika hapa..." : "Write here...";
};

window.showAuthSection = function() {
    safeHide('landing-section');
    safeShow('auth-section');
};

window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    safeSetText('auth-error', ''); 
    
    if (isLoginMode) {
        safeSetText('auth-title', translations[currentLang].loginTitle);
        safeSetText('auth-btn', translations[currentLang].loginBtn);
        safeSetText('toggle-text', translations[currentLang].toggleToSignupText);
        safeSetText('toggle-link', translations[currentLang].toggleToSignupLink);
    } else {
        safeSetText('auth-title', translations[currentLang].signupTitle);
        safeSetText('auth-btn', translations[currentLang].signupBtn);
        safeSetText('toggle-text', translations[currentLang].toggleToLoginText);
        safeSetText('toggle-link', translations[currentLang].toggleToLoginLink);
    }
};

window.handleAuth = async function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const authBtn = document.getElementById('auth-btn');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    
    safeSetText('auth-error', '');

    if (!email || !password) {
        safeSetText('auth-error', (currentLang === 'sw') ? "Jaza barua pepe na nenosiri." : "Provide email and password.");
        return;
    }

    if (authBtn) {
        authBtn.innerText = translations[currentLang].authProcessing;
        authBtn.disabled = true;
    }

    if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) safeSetText('auth-error', error.message);
    } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            safeSetText('auth-error', error.message);
        } else {
            alert((currentLang === 'sw') ? 'Akaunti imetengenezwa!' : 'Account created!');
            if (data.session) handleSessionState(data.session);
        }
    }
    
    if (authBtn) {
        authBtn.innerText = isLoginMode ? translations[currentLang].loginBtn : translations[currentLang].signupBtn;
        authBtn.disabled = false;
    }
};

window.logout = async function() {
    await supabase.auth.signOut();
    handleSessionState(null);
};

window.navigate = function(tabName, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (tabName !== 'add' && element) element.classList.add('active');

    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
    safeShow(`view-${tabName}`);

    if (tabName === 'home') fetchPosts();
    if (tabName === 'profile') fetchProfile();
};

async function fetchProfile() {
    if (!currentUser) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    
    if (data) {
        userProfile = data;
        updateProfileUI();
    }
}

function updateProfileUI() {
    safeSetText('profile-name', userProfile.username || 'Anonymous');
    safeSetText('profile-bio', userProfile.bio || '');
    const pImg = document.getElementById('profile-img');
    if (pImg && userProfile.avatar_url) pImg.src = userProfile.avatar_url;
}

window.openEditProfile = function() {
    const eName = document.getElementById('edit-username');
    const eBio = document.getElementById('edit-bio');
    if (eName) eName.value = userProfile.username || '';
    if (eBio) eBio.value = userProfile.bio || '';
    safeShow('edit-profile-modal');
};

window.closeEditProfile = function() {
    safeHide('edit-profile-modal');
};

window.saveProfile = async function() {
    const newName = document.getElementById('edit-username').value.trim();
    const newBio = document.getElementById('edit-bio').value.trim();

    const { error } = await supabase.from('profiles').upsert({ id: currentUser.id, username: newName, bio: newBio });
    if (!error) {
        userProfile.username = newName;
        userProfile.bio = newBio;
        updateProfileUI();
        window.closeEditProfile();
        fetchPosts(); 
    }
};

window.uploadAvatar = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    safeSetText('profile-name', (currentLang === 'sw') ? "Inapakia..." : "Uploading...");
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) return updateProfileUI(); 

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const { error: updateError } = await supabase.from('profiles').upsert({ id: currentUser.id, avatar_url: publicUrlData.publicUrl });

    if (!updateError) {
        userProfile.avatar_url = publicUrlData.publicUrl;
        updateProfileUI();
        fetchPosts();
    }
};

async function fetchPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    const { data: posts, error } = await supabase.from('posts').select(`*, profiles (username, avatar_url)`).order('created_at', { ascending: false });

    if (error || !posts) return;

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
                    <span class="post-time">${new Date(post.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="post-body">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn"><i class="fas fa-heart"></i></button>
                <button class="action-btn" onclick="navigator.clipboard.writeText('${post.content.replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
            </div>
        `;
        container.appendChild(postElement);
    });
}

window.submitPost = async function() {
    if (!currentUser) return;
    
    const categoryInput = document.getElementById('post-category');
    const contentInput = document.getElementById('post-content');
    const submitBtn = document.getElementById('submit-post-btn');

    const category = categoryInput ? categoryInput.value : '';
    const content = contentInput ? contentInput.value.trim() : '';

    if (!category || !content) return;

    if (submitBtn) {
        submitBtn.innerText = translations[currentLang].authProcessing;
        submitBtn.disabled = true;
    }

    const { error } = await supabase.from('posts').insert([{ user_id: currentUser.id, content: content, category: category }]);

    if (submitBtn) {
        submitBtn.innerText = translations[currentLang].postMessageBtn;
        submitBtn.disabled = false;
    }

    if (!error) {
        if (categoryInput) categoryInput.value = '';
        if (contentInput) contentInput.value = '';
        const homeTab = document.querySelector('.nav-item i.fa-home').parentElement;
        window.navigate('home', homeTab);
    }
};
