// Database Configuration
// Renamed the client instance to 'supabaseClient' to prevent naming collisions with the CDN script.
const supabaseUrl = 'https://ywjmtlofmiatjwaaiwmv.supabase.co';
const supabaseKey = 'sb_publishable_fEeSy7iIPnnC6boXPpxsPA_fXTjfUvQ';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Application State Management
let currentUser = null;
let isAdmin = false;
let analyticsChartInstance = null;

// DOM Elements Mapping
const UI = {
    auth: document.getElementById('auth-section'),
    dash: document.getElementById('dashboard-section'),
    admin: document.getElementById('admin-panel'),
    email: document.getElementById('email'),
    pass: document.getElementById('password'),
    musicBtn: document.getElementById('play-music-btn'),
    bgMusic: document.getElementById('bg-music')
};

// Premium Custom Toast Notification System
function showToast(msg, type = 'info') {
    const box = document.getElementById('toast-container');
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.style.borderColor = type === 'error' ? 'var(--danger)' : 'var(--neon-blue)';
    toastElement.innerText = msg;
    
    box.appendChild(toastElement);
    
    // Automatically remove the toast after 4 seconds
    setTimeout(() => { 
        toastElement.style.opacity = '0'; 
        toastElement.style.transform = 'translateX(100%)';
        setTimeout(() => toastElement.remove(), 300); 
    }, 4000);
}

// Local Music Player Control Logic
let isPlaying = false;
UI.musicBtn.addEventListener('click', () => {
    if (isPlaying) { 
        UI.bgMusic.pause(); 
        UI.musicBtn.innerText = "Play";
        UI.musicBtn.style.boxShadow = "none";
    } else { 
        UI.bgMusic.play(); 
        UI.musicBtn.innerText = "Pause";
        UI.musicBtn.style.boxShadow = "0 0 15px var(--neon-pink)";
    }
    isPlaying = !isPlaying;
});

// Real-time Authentication Observer
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) { 
        currentUser = session.user; 
        initDashboard(); 
    } else { 
        currentUser = null; 
        UI.auth.classList.remove('hidden'); 
        UI.dash.classList.add('hidden'); 
    }
});

// Event Listener: User Login
document.getElementById('login-btn').addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signInWithPassword({ 
        email: UI.email.value, 
        password: UI.pass.value 
    });
    if (error) showToast(error.message, "error");
});

// Event Listener: User Registration
document.getElementById('signup-btn').addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signUp({ 
        email: UI.email.value, 
        password: UI.pass.value 
    });
    
    if (error) {
        showToast(error.message, "error"); 
    } else {
        // Create an initial empty profile row for the new user in the database
        await supabaseClient.from('profiles').insert([{ 
            id: (await supabaseClient.auth.getUser()).data.user.id 
        }]);
        showToast("Secure Account Created! Proceed to Login.");
    }
});

// Event Listener: User Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    supabaseClient.auth.signOut();
});

// Initialize the Main Dashboard Interface
async function initDashboard() {
    UI.auth.classList.add('hidden');
    UI.dash.classList.remove('hidden');
    
    // Verify Admin Privileges using Role-Based Access Control (RBAC)
    const { data: profileData } = await supabaseClient.from('profiles').select('is_admin').eq('id', currentUser.id).single();
    isAdmin = profileData ? profileData.is_admin : false;
    
    // Display Admin Panel if authorized
    if (isAdmin) { 
        UI.admin.classList.remove('hidden'); 
        loadAnalytics(); 
    } else {
        UI.admin.classList.add('hidden');
    }
    
    // Load User Data and Network Feeds
    loadProfile(); 
    loadPublicFeed(); 
    loadUsersForDM(); 
    loadPrivateInbox();
    
    // Establish Realtime WebSocket Subscription for Live Messages
    supabaseClient.channel('public_msgs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'public_messages' }, () => {
            loadPublicFeed();
            if (isAdmin) loadAnalytics(); // Update charts dynamically for admins
        }).subscribe();
}

// Event Listener: Update User Identity / Profile
document.getElementById('save-profile-btn').addEventListener('click', async () => {
    showToast("Encrypting & Saving Identity Data...");
    
    let avatarUrl = document.getElementById('profile-img').src;
    const file = document.getElementById('avatar-upload').files[0];
    
    // Handle Avatar Image Upload to Supabase Storage
    if (file) {
        const fileName = `${currentUser.id}_${Date.now()}`;
        await supabaseClient.storage.from('avatars').upload(fileName, file, { upsert: true });
        const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
    }

    // Upsert Profile Information into Database
    const { error } = await supabaseClient.from('profiles').upsert({
        id: currentUser.id, 
        name: document.getElementById('profile-name').value,
        bio: document.getElementById('profile-bio').value, 
        avatar_url: avatarUrl,
        is_admin: isAdmin // Preserve current admin status to prevent accidental downgrade
    });
    
    if (error) {
        showToast("Error updating profile. Please try again.", "error");
    } else {
        document.getElementById('profile-img').src = avatarUrl;
        showToast("Identity Successfully Updated in the Network.");
    }
});

// Fetch and Render User Profile Data
async function loadProfile() {
    const { data } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) {
        if (data.name) document.getElementById('profile-name').value = data.name;
        if (data.bio) document.getElementById('profile-bio').value = data.bio;
        if (data.avatar_url) document.getElementById('profile-img').src = data.avatar_url;
    }
}

// Event Listener: Broadcast a Public Message
document.getElementById('post-btn').addEventListener('click', async () => {
    const text = document.getElementById('new-message').value.trim();
    if (!text) return showToast("Transmission failed: Cannot broadcast an empty signal.", "error");
    
    await supabaseClient.from('public_messages').insert([{ 
        user_id: currentUser.id, 
        user_email: currentUser.email, 
        message: text 
    }]);
    
    document.getElementById('new-message').value = "";
});

// Fetch and Render the Global Public Feed
async function loadPublicFeed() {
    const { data } = await supabaseClient.from('public_messages').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('messages-list');
    list.innerHTML = "";
    
    if (!data || data.length === 0) {
        list.innerHTML = "<p style='color: var(--text-muted);'>The network is quiet. Be the first to broadcast a signal.</p>";
        return;
    }

    data.forEach(msg => {
        let html = `
            <div class="message-item">
                <div class="message-header">
                    <strong>@${msg.user_email.split('@')[0]}</strong>
                    <span>${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p style="margin-bottom: 10px;">${msg.message}</p>
                <button class="like-btn" onclick="likeMessage(${msg.id}, ${msg.likes_count || 0})">❤️ Pulse (${msg.likes_count || 0})</button>
        `;
        
        // Inject Purge Data button exclusively for System Admins or the Original Author
        if (isAdmin || msg.user_id === currentUser.id) {
            html += `<br><button class="btn-danger" style="margin-top:10px; font-size:12px; padding: 4px 12px;" onclick="purgeMessageData(${msg.id})">Purge Data</button>`;
        }
        
        html += `</div>`;
        list.insertAdjacentHTML('beforeend', html);
    });
}

// Global Function: Add a Like (Pulse) to a Message
window.likeMessage = async function(id, currentLikes) {
    await supabaseClient.from('public_messages').update({ likes_count: currentLikes + 1 }).eq('id', id);
};

// Global Function: Delete a Message from the Database
window.purgeMessageData = async function(id) { 
    if (confirm("WARNING: Are you sure you want to permanently initiate a data purge?")) {
        await supabaseClient.from('public_messages').delete().eq('id', id); 
    }
};

// Populate Dropdown for Direct Messaging
async function loadUsersForDM() {
    const { data } = await supabaseClient.from('profiles').select('id, name');
    const select = document.getElementById('dm-user-select');
    select.innerHTML = '<option value="">Select an agent...</option>';
    
    if (data) {
        data.forEach(user => {
            // Prevent users from sending DMs to themselves
            if (user.id !== currentUser.id) {
                const displayName = user.name || 'Agent_' + user.id.substring(0, 4);
                select.innerHTML += `<option value="${user.id}">${displayName}</option>`;
            }
        });
    }
}

// Event Listener: Send a Direct Message
document.getElementById('send-dm-btn').addEventListener('click', async () => {
    const receiverId = document.getElementById('dm-user-select').value;
    const messageText = document.getElementById('dm-message').value.trim();
    
    if (!receiverId || !messageText) return showToast("Transmission failed: Parameters are incomplete.", "error");

    await supabaseClient.from('private_messages').insert([{ 
        sender_id: currentUser.id, 
        receiver_id: receiverId, 
        sender_email: currentUser.email, 
        message: messageText 
    }]);
    
    document.getElementById('dm-message').value = "";
    showToast("Secure Transmission Sent Successfully!");
    loadPrivateInbox();
});

// Fetch and Render Private Direct Messages
async function loadPrivateInbox() {
    // Query messages where the current user is either the sender OR the receiver
    const { data } = await supabaseClient.from('private_messages')
        .select('*')
        .or(`receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });
        
    const inbox = document.getElementById('inbox-list');
    inbox.innerHTML = "";
    
    if (data && data.length > 0) {
        data.forEach(dm => {
            const isMe = dm.sender_id === currentUser.id;
            const prefixLabel = isMe ? "Transmitted OUT:" : `Signal IN from @${dm.sender_email.split('@')[0]}:`;
            
            inbox.innerHTML += `
                <div class="message-item dm-item">
                    <div class="message-header"><strong>${prefixLabel}</strong></div>
                    <p>${dm.message}</p>
                </div>
            `;
        });
    } else {
        inbox.innerHTML = "<p style='font-size: 12px; color: var(--text-muted);'>Inbox is currently empty.</p>";
    }
}

// Admin Chart.js Analytics Engine Initialization
async function loadAnalytics() {
    if (!isAdmin) return;
    
    const { data } = await supabaseClient.from('public_messages').select('created_at');
    if (!data) return;

    // Aggregate message counts by Date
    const dateCounts = {};
    data.forEach(msg => {
        const dateString = new Date(msg.created_at).toLocaleDateString();
        dateCounts[dateString] = (dateCounts[dateString] || 0) + 1;
    });

    const chartLabels = Object.keys(dateCounts);
    const chartDataValues = Object.values(dateCounts);
    const canvasContext = document.getElementById('analyticsChart').getContext('2d');
    
    // Destroy previous chart instance to prevent overlay glitches during realtime updates
    if (analyticsChartInstance) analyticsChartInstance.destroy();

    analyticsChartInstance = new Chart(canvasContext, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Network Broadcasts / Day',
                data: chartDataValues,
                borderColor: '#00f3ff', 
                backgroundColor: 'rgba(0, 243, 255, 0.15)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff007f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#e2e8f0'} },
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#e2e8f0'} }
            },
            plugins: { legend: { labels: { color: '#e2e8f0', font: { family: 'Poppins' } } } }
        }
    });
}
