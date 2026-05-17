// Ujumbe huu utatokea punde tu ukifungua link. Ukiona hii, maana yake kile kitufe cha Get Started kitafanya kazi!
alert("Hongera! JavaScript sasa inasoma kikamilifu.");

const translations = {
    sw: { appName: "Sms Tamu 💖", landingDesc: "Mahali sahihi pa kupata meseji tamu za mapenzi na kuvutia.", getStartedBtn: "Anza Sasa", loginTitle: "Ingia Kwenye Akaunti", signupTitle: "Tengeneza Akaunti", loginBtn: "Ingia", signupBtn: "Jisajili", toggleToSignupText: "Hauna akaunti?", toggleToSignupLink: "Jisajili hapa", toggleToLoginText: "Unayo akaunti?", toggleToLoginLink: "Ingia hapa", navHome: "Nyumbani", navSearch: "Tafuta", navChat: "Chat", navProfile: "Wasifu", writeMessage: "Andika Meseji", selectCategory: "Chagua Kundi...", postMessageBtn: "Tuma Posti", following: "Wanaofuatiliwa", followers: "Wafuasi", editProfileBtn: "Badili Wasifu", myPosts: "Posti Zangu", liked: "Zilizopendwa", saved: "Zilizohifadhiwa", logoutBtn: "Toka (Logout)", cancelBtn: "Ghairi", saveBtn: "Hifadhi", loadingPosts: "Inapakia...", noPosts: "Hakuna posti bado. Kuwa wa kwanza kuposti!", emailPlaceholder: "Barua Pepe", passwordPlaceholder: "Nenosiri", authProcessing: "Inachakata..." },
    en: { appName: "Sms Tamu 💖", landingDesc: "The best place for sweet and romantic messages.", getStartedBtn: "Get Started", loginTitle: "Login to Account", signupTitle: "Create Account", loginBtn: "Login", signupBtn: "Sign Up", toggleToSignupText: "Don't have an account?", toggleToSignupLink: "Sign up here", toggleToLoginText: "Already have an account?", toggleToLoginLink: "Login here", navHome: "Home", navSearch: "Search", navChat: "Chat", navProfile: "Profile", writeMessage: "Write Message", selectCategory: "Select Category...", postMessageBtn: "Post Message", following: "Following", followers: "Followers", editProfileBtn: "Edit Profile", myPosts: "My Posts", liked: "Liked", saved: "Saved", logoutBtn: "Logout", cancelBtn: "Cancel", saveBtn: "Save", loadingPosts: "Loading...", noPosts: "No sweet messages yet. Be the first to post!", emailPlaceholder: "Email Address", passwordPlaceholder: "Password", authProcessing: "Processing..." }
};

let currentLang = 'sw'; 
let supabase = null;
let isLoginMode = true;
let currentUser = null;
let userProfile = { username: 'Anonymous', bio: '', avatar_url: 'https://via.placeholder.com/150' };

try {
    const supabaseUrl = 'https://wwavdbfibzbjsnnavvfj.supabase.co';
    const supabaseKey = 'sb_publishable_L1DxHGDmy2E8YVQDa3-M_g_Us4QmJQ7';
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (error) {
    console.error(error);
}

document.addEventListener("DOMContentLoaded", async () => {
    setLanguage('sw');
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionState(session);
        supabase.auth.onAuthStateChange((event, session) => handleSessionState(session));
    }
});

function handleSessionState(session) {
    if (session) {
        currentUser = session.user;
        document.getElementById('landing-section').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        fetchProfile(); fetchPosts();   
    } else {
        currentUser = null;
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('landing-section').classList.remove('hidden');
    }
}

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('btn-sw').classList.remove('active');
    document.getElementById('btn-en').classList.remove('active');
    document.getElementById(`btn-${lang}`).classList.add('active');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.innerText = translations[lang][key];
    });
    document.getElementById('email').placeholder = translations[lang].emailPlaceholder;
    document.getElementById('password').placeholder = translations[lang].passwordPlaceholder;
    document.getElementById('post-content').placeholder = (lang === 'sw') ? "Andika hapa..." : "Write here...";
}

function showAuthSection() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-error').innerText = ''; 
    if (isLoginMode) {
        document.getElementById('auth-title').innerText = translations[currentLang].loginTitle;
        document.getElementById('auth-btn').innerText = translations[currentLang].loginBtn;
        document.getElementById('toggle-text').innerText = translations[currentLang].toggleToSignupText;
        document.getElementById('toggle-link').innerText = translations[currentLang].toggleToSignupLink;
    } else {
        document.getElementById('auth-title').innerText = translations[currentLang].signupTitle;
        document.getElementById('auth-btn').innerText = translations[currentLang].signupBtn;
        document.getElementById('toggle-text').innerText = translations[currentLang].toggleToLoginText;
        document.getElementById('toggle-link').innerText = translations[currentLang].toggleToLoginLink;
    }
}

async function handleAuth() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('auth-error');
    const authBtn = document.getElementById('auth-btn');

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
            alert((currentLang === 'sw') ? 'Akaunti imetengenezwa!' : 'Account created!');
            if (data.session) handleSessionState(data.session);
        }
    }
    
    authBtn.innerText = isLoginMode ? translations[currentLang].loginBtn : translations[currentLang].signupBtn;
    authBtn.disabled = false;
}

async function logout() { await supabase.auth.signOut(); handleSessionState(null); }

function navigate(tabName, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (tabName !== 'add') element.classList.add('active');
    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${tabName}`).classList.remove('hidden');
    if (tabName === 'home') fetchPosts();
    if (tabName === 'profile') fetchProfile();
}

async function fetchProfile() {
    if (!currentUser) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) { userProfile = data; updateProfileUI(); }
}

function updateProfileUI() {
    document.getElementById('profile-name').innerText = userProfile.username || 'Anonymous';
    document.getElementById('profile-bio').innerText = userProfile.bio || '';
    if (userProfile.avatar_url) document.getElementById('profile-img').src = userProfile.avatar_url;
}

function openEditProfile() {
    document.getElementById('edit-username').value = userProfile.username || '';
    document.getElementById('edit-bio').value = userProfile.bio || '';
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function closeEditProfile() { document.getElementById('edit-profile-modal').classList.add('hidden'); }

async function saveProfile() {
    const newName = document.getElementById('edit-username').value.trim();
    const newBio = document.getElementById('edit-bio').value.trim();
    const { error } = await supabase.from('profiles').upsert({ id: currentUser.id, username: newName, bio: newBio });
    if (!error) { userProfile.username = newName; userProfile.bio = newBio; updateProfileUI(); closeEditProfile(); fetchPosts(); }
}

async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('profile-name').innerText = (currentLang === 'sw') ? "Inapakia..." : "Uploading...";
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await supabase.from('profiles').upsert({ id: currentUser.id, avatar_url: data.publicUrl });
        userProfile.avatar_url = data.publicUrl;
        updateProfileUI(); fetchPosts();
    }
}

async function fetchPosts() {
    const container = document.getElementById('posts-container');
    const { data: posts, error } = await supabase.from('posts').select(`*, profiles (username, avatar_url)`).order('created_at', { ascending: false });
    if (error || !posts) return;
    if (posts.length === 0) { container.innerHTML = `<p class="temp-text">${translations[currentLang].noPosts}</p>`; return; }
    
    container.innerHTML = '';
    posts.forEach(post => {
        const authorName = post.profiles?.username || 'Anonymous';
        const avatarUrl = post.profiles?.avatar_url || 'https://via.placeholder.com/150';
        container.innerHTML += `
            <div class="post-card">
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
            </div>`;
    });
}

async function submitPost() {
    if (!currentUser) return;
    const category = document.getElementById('post-category').value;
    const content = document.getElementById('post-content').value.trim();
    const submitBtn = document.getElementById('submit-post-btn');
    if (!category || !content) return;

    submitBtn.innerText = translations[currentLang].authProcessing; submitBtn.disabled = true;
    const { error } = await supabase.from('posts').insert([{ user_id: currentUser.id, content: content, category: category }]);
    submitBtn.innerText = translations[currentLang].postMessageBtn; submitBtn.disabled = false;

    if (!error) {
        document.getElementById('post-category').value = ''; document.getElementById('post-content').value = '';
        navigate('home', document.querySelector('.nav-item i.fa-home').parentElement);
    }
}
