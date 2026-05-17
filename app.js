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
