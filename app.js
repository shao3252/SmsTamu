
// Supabase Configuration na Credentials Mpya
const supabaseUrl = 'https://ywjmtlofmiatjwaaiwmv.supabase.co';
const supabaseKey = 'sb_publishable_fEeSy7iIPnnC6boXPpxsPA_fXTjfUvQ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// State Management
let currentUser = null;
let isAdmin = false;
let analyticsChartInstance = null;

const UI = {
    auth: document.getElementById('auth-section'),
    dash: document.getElementById('dashboard-section'),
    admin: document.getElementById('admin-panel'),
    email: document.getElementById('email'),
    pass: document.getElementById('password'),
    musicBtn: document.getElementById('play-music-btn'),
    bgMusic: document.getElementById('bg-music')
};

// Premium Toast System
function showToast(msg, type = 'info') {
    const box = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderColor = type === 'error' ? 'var(--danger)' : 'var(--neon-blue)';
    t.innerText = msg;
    box.appendChild(t);
    setTimeout(() => { 
        t.style.opacity = '0'; 
        t.style.transform = 'translateX(100%)';
        setTimeout(() => t.remove(), 300); 
    }, 4000);
}

// Local Music Player
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

// Auth Observer
supabase.auth.onAuthStateChange((event, session) => {
    if (session) { 
        currentUser = session.user; 
        initDash(); 
    } else { 
        currentUser = null; 
        UI.auth.classList.remove('hidden'); 
        UI.dash.classList.add('hidden'); 
    }
});

// Login / Signup Functions
document.getElementById('login-btn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: UI.email.value, password: UI.pass.value });
    if (error) showToast(error.message, "error");
});

document.getElementById('signup-btn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signUp({ email: UI.email.value, password: UI.pass.value });
    if (error) showToast(error.message, "error"); 
    else {
        // Create initial profile row
        await supabase.from('profiles').insert([{ id: (await supabase.auth.getUser()).data.user.id }]);
        showToast("Secure Account Created! Proceed to Login.");
    }
});

document.getElementById('logout-btn').addEventListener('click', () => supabase.auth.signOut());

// Dashboard Initialization
async function initDash() {
    UI.auth.classList.add('hidden');
    UI.dash.classList.remove('hidden');
    
    // Check Admin Role from Database (RBAC)
    const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', currentUser.id).single();
    isAdmin = profileData ? profileData.is_admin : false;
    
    if (isAdmin) { 
        UI.admin.classList.remove('hidden'); 
        loadAnalytics(); 
    } else {
        UI.admin.classList.add('hidden');
    }
    
    loadProfile(); 
    loadFeed(); 
    loadUsersForDM(); 
    loadDMs();
    
    // Realtime Sync
    supabase.channel('public_msgs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'public_messages' }, () => {
            loadFeed();
            if(isAdmin) loadAnalytics();
        }).subscribe();
}

// Profile Logic
document.getElementById('save-profile-btn').addEventListener('click', async () => {
    showToast("Encrypting & Saving Data...");
    let avatarUrl = document.getElementById('profile-img').src;
    const file = document.getElementById('avatar-upload').files[0];
    
    if (file) {
        const fileName = `${currentUser.id}_${Date.now()}`;
        await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
    }

    const { error } = await supabase.from('profiles').upsert({
        id: currentUser.id, 
        name: document.getElementById('profile-name').value,
        bio: document.getElementById('profile-bio').value, 
        avatar_url: avatarUrl,
        is_admin: isAdmin // Preserve current status
    });
    
    if(error) showToast("Error updating profile", "error");
    else {
        document.getElementById('profile-img').src = avatarUrl;
        showToast("Identity Updated Successfully");
    }
});

async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) {
        if(data.name) document.getElementById('profile-name').value = data.name;
        if(data.bio) document.getElementById('profile-bio').value = data.bio;
        if(data.avatar_url) document.getElementById('profile-img').src = data.avatar_url;
    }
}

// Public Feed & Likes
document.getElementById('post-btn').addEventListener('click', async () => {
    const text = document.getElementById('new-message').value.trim();
    if(!text) return showToast("Cannot broadcast empty signal", "error");
    
    await supabase.from('public_messages').insert([{ 
        user_id: currentUser.id, 
        user_email: currentUser.email, 
        message: text 
    }]);
    document.getElementById('new-message').value = "";
});

async function loadFeed() {
    const { data } = await supabase.from('public_messages').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('messages-list');
    list.innerHTML = "";
    
    if(!data || data.length === 0) {
        list.innerHTML = "<p style='color: var(--text-muted);'>Network is quiet. Be the first to broadcast.</p>";
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
        if (isAdmin || msg.user_id === currentUser.id) {
            html += `<br><button class="btn-danger" style="margin-top:10px; font-size:12px; padding: 4px 12px;" onclick="delMsg(${msg.id})">Purge Data</button>`;
        }
        html += `</div>`;
        list.insertAdjacentHTML('beforeend', html);
    });
}

window.likeMessage = async function(id, currentLikes) {
    await supabase.from('public_messages').update({ likes_count: currentLikes + 1 }).eq('id', id);
};

window.delMsg = async function(id) { 
    if(confirm("Initiate data purge?")) {
        await supabase.from('public_messages').delete().eq('id', id); 
    }
};

// Direct Messaging (DMs)
async function loadUsersForDM() {
    const { data } = await supabase.from('profiles').select('id, name');
    const select = document.getElementById('dm-user-select');
    select.innerHTML = '<option value="">Select an agent...</option>';
    if(data) {
        data.forEach(u => {
            if(u.id !== currentUser.id) select.innerHTML += `<option value="${u.id}">${u.name || 'Agent_' + u.id.substring(0,4)}</option>`;
        });
    }
}

document.getElementById('send-dm-btn').addEventListener('click', async () => {
    const recId = document.getElementById('dm-user-select').value;
    const msg = document.getElementById('dm-message').value.trim();
    if(!recId || !msg) return showToast("Transmission parameters incomplete", "error");

    await supabase.from('private_messages').insert([{ 
        sender_id: currentUser.id, 
        receiver_id: recId, 
        sender_email: currentUser.email, 
        message: msg 
    }]);
    document.getElementById('dm-message').value = "";
    showToast("Secure Transmission Sent!");
    loadDMs();
});

async function loadDMs() {
    const { data } = await supabase.from('private_messages')
        .select('*').or(`receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });
        
    const inbox = document.getElementById('inbox-list');
    inbox.innerHTML = "";
    
    if(data && data.length > 0) {
        data.forEach(dm => {
            const isMe = dm.sender_id === currentUser.id;
            const prefix = isMe ? "Transmitted OUT:" : `Signal IN from @${dm.sender_email.split('@')[0]}:`;
            inbox.innerHTML += `
                <div class="message-item dm-item">
                    <div class="message-header"><strong>${prefix}</strong></div>
                    <p>${dm.message}</p>
                </div>
            `;
        });
    } else {
        inbox.innerHTML = "<p style='font-size: 12px; color: var(--text-muted);'>Inbox empty.</p>";
    }
}

// Admin Analytics Engine
async function loadAnalytics() {
    if (!isAdmin) return;
    const { data } = await supabase.from('public_messages').select('created_at');
    if (!data) return;

    const dateCounts = {};
    data.forEach(msg => {
        const d = new Date(msg.created_at).toLocaleDateString();
        dateCounts[d] = (dateCounts[d] || 0) + 1;
    });

    const labels = Object.keys(dateCounts);
    const chartData = Object.values(dateCounts);
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    
    if (analyticsChartInstance) analyticsChartInstance.destroy();

    analyticsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Network Broadcasts / Day',
                data: chartData,
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
            plugins: { legend: { labels: { color: '#e2e8f0' } } }
        }
    });
}
