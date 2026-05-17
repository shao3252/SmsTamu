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

// Function to handle language switching safely
window.setLanguage = function(lang) {
    currentLang = lang;
    
    // Update active button state safely
    const btnSw = document.getElementById('btn-sw');
    const btnEn = document.getElementById('btn-en');
    
    if (btnSw && btnEn) {
        btnSw.classList.remove('active');
        btnEn.classList.remove('active');
        document.getElementById(`btn-${lang}`).classList.add('active');
    }

    // Update all text elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });

    // Update Placeholders safely
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const postContent = document.getElementById('post-content');

    if (emailInput) emailInput.placeholder = translations[lang].emailPlaceholder;
    if (passInput) passInput.placeholder = translations[lang].passwordPlaceholder;
    if (postContent) postContent.placeholder = (lang === 'sw') ? "Andika hapa..." : "Write here...";
};

// --- Initialization Variables ---
let supabase;
let isLoginMode = true;
let currentUser = null;
let userProfile = { username: 'Anonymous', bio: '', avatar_url: 'https://via.placeholder.com/150' };

// Initialize Supabase safely
try {
    const supabaseUrl = 'https://wwavdbfibzbjsnnavvfj.supabase.co';
    const supabaseKey = 'sb_publishable_L1DxHGDmy2E8YVQDa3-M_g_Us4QmJQ7';
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} catch (error) {
    console.error("Supabase Connection Error:", error);
    alert("Kuna shida ya kuunganisha na Database. Hakikisha una internet.");
}

// --- Auth UI Toggling ---
window.showAuthSection = function() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
};

window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    const errorMsg = document.getElementById('auth-error');
    if (errorMsg) errorMsg.innerText = ''; 
    
    const authTitle = document.getElementById('auth-title');
    const authBtn = document.getElementById('auth-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');

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
};

window.handleAuth = async function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('auth-error');
    const authBtn = document.getElementById('auth-btn');

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
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            errorMsg.innerText = error.message;
        } else {
            const successMsg = (currentLang === 'sw') ? 'Akaunti imetengenezwa! Unaingia...' : 'Account created! Logging in...';
            alert(successMsg);
            if (data.session) {
                handleSessionState(data.session);
            } else {
                errorMsg.innerText = (currentLang === 'sw') ? 'Thibitisha email yako.' : 'Please verify your email.';
            }
        }
    }
    
    authBtn.innerText = isLoginMode ? translations[currentLang].loginBtn : translations[currentLang].signupBtn;
    authBtn.disabled = false;
};

window.logout = async function() {
    await supabase.auth.signOut();
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('landing-section').classList.remove('hidden');
};

// --- Session Handling ---
function handleSessionState(session) {
    if (session) {
        currentUser = session.user;
        document.getElementById('landing-section').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        fetchProfile(); 
        fetchPosts();   
    } else {
        currentUser = null;
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('landing-section').classList.remove('hidden');
    }
}

// Ensure DOM is fully loaded before checking session or applying language
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Set Default Language Safely
    setLanguage('sw');

    // 2. Check User Session
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionState(session);

        supabase.auth.onAuthStateChange((event, session) => {
            handleSessionState(session);
        });
    }
});

// --- Navigation ---
window.navigate = function(tabName, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(tabName !== 'add') element.classList.add('active');

    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
    
    const selectedView = document.getElementById(`view-${tabName}`);
    if(selectedView) selectedView.classList.remove('hidden');

    if(tabName === 'home') fetchPosts();
    if(tabName === 'profile') fetchProfile();
};

// --- Profile & Database Logic ---
async function fetchProfile() {
    if (!currentUser) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();

    if (data) {
        userProfile = data;
        updateProfileUI();
    } else if (error && error.code === 'PGRST116') {
        const newProfile = { id: currentUser.id, username: 'User_' + Math.floor(Math.random() * 100) };
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

window.openEditProfile = function() {
    document.getElementById('edit-username').value = userProfile.username || '';
    document.getElementById('edit-bio').value = userProfile.bio || '';
    document.getElementById('edit-profile-modal').classList.remove('hidden');
};

window.closeEditProfile = function() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
};

window.saveProfile = async function() {
    const newName = document.getElementById('edit-username').value.trim();
    const newBio = document.getElementById('edit-bio').value.trim();

    const { error } = await supabase.from('profiles').upsert({ id: currentUser.id, username: newName, bio: newBio });
    if (!error) {
        userProfile.username = newName;
        userProfile.bio = newBio;
        updateProfileUI();
        closeEditProfile();
        fetchPosts(); 
    }
};

window.uploadAvatar = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('profile-name').innerText = (currentLang === 'sw') ? "Inapakia..." : "Uploading...";
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
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value.trim();
    const submitBtn = document.getElementById('submit-post-btn');

    if (!category || !content) return;

    submitBtn.innerText = translations[currentLang].authProcessing;
    submitBtn.disabled = true;

    const { error } = await supabase.from('posts').insert([{ user_id: currentUser.id, content: content, category: category }]);

    submitBtn.innerText = translations[currentLang].postMessageBtn;
    submitBtn.disabled = false;

    if (!error) {
        document.getElementById('post-category').value = '';
        document.getElementById('post-content').value = '';
        const homeTab = document.querySelector('.nav-item i.fa-home').parentElement;
        window.navigate('home', homeTab);
    }
};
