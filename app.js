// LOCAL DATA SYSTEM (No Firebase)
let currentUser = {
    uid: "local-user",
    username: "Bro",
    avatar: "https://ui-avatars.com/api/?name=Bro"
};

let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentPage = 'feed';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    showMainApp();
    setupEventListeners();
    navigateToPage('feed');
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                navigateToPage(page);
            }
        });
    });

    // Profile
    document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
    document.getElementById('editProfileForm').addEventListener('submit', updateProfile);

    // Profile Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Post Modal
    if (document.getElementById('postModal')) {
        document.getElementById('postForm').addEventListener('submit', submitPost);
    }

    // Add Skill Button
    if (document.getElementById('addSkillBtn')) {
        document.getElementById('addSkillBtn').addEventListener('click', () => {
            const skill = prompt('Enter skill name:');
            if (skill) {
                addSkill(skill);
            }
        });
    }

    // User Menu
    document.getElementById('userMenuBtn').addEventListener('click', toggleUserMenu);
    setTimeout(() => {
        document.addEventListener('click', () => {
            const menu = document.getElementById('userDropdown');
            if (menu) {
                menu.classList.remove('show');
            }
        }, { once: true });
    });
}

// UI Functions
function showMainApp() {
    document.getElementById('authModal').classList.remove('show');
    document.querySelector('.page-container').style.display = 'flex';
}

function updateUserUI() {
    const avatar = currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}`;
    document.getElementById('userAvatarNav').src = avatar;
}

function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}

// Navigation
function navigateToPage(page) {
    currentPage = page;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Load page content
    if (page === 'feed') {
        loadFeed();
    } else if (page === 'profile') {
        loadProfile();
    }
}

// ===== FEED SYSTEM =====
function loadFeed() {
    const feedContainer = document.getElementById('postsFeed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';

    if (posts.length === 0) {
        feedContainer.innerHTML = '<p style="text-align:center; color: var(--text-tertiary);">No posts yet. Be the first to post!</p>';
        return;
    }

    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post-card';

        const timeAgo = getTimeAgo(new Date(post.createdAt));
        const likeCount = post.likes ? post.likes.length : 0;
        const isLiked = post.likes && post.likes.includes(currentUser.uid);

        div.innerHTML = `
            <div class="post-header">
                <img src="${escapeHtml(post.avatar)}" class="post-avatar" alt="${escapeHtml(post.username)}">
                <div>
                    <strong>${escapeHtml(post.username)}</strong>
                    <div style="font-size: 0.85em; color: var(--text-tertiary);">${timeAgo}</div>
                </div>
            </div>

            <div class="post-content">${escapeHtml(post.content)}</div>

            ${post.tags ? `<div class="post-tags">${escapeHtml(post.tags)}</div>` : ''}

            <div class="post-footer">
                <button onclick="likePost('${post.id}')" style="background: ${isLiked ? '#ff4458' : 'transparent'}; color: ${isLiked ? 'white' : 'inherit'};">
                    ❤️ ${likeCount}
                </button>
            </div>
        `;

        feedContainer.appendChild(div);
    });
}

function submitPost(e) {
    e.preventDefault();

    const content = document.getElementById('postContent').value.trim();
    const tags = document.getElementById('postTags').value.trim();

    if (!content) {
        alert('Please write something!');
        return;
    }

    const post = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content,
        tags,
        likes: [],
        createdAt: new Date().toISOString()
    };

    posts.unshift(post);
    localStorage.setItem("posts", JSON.stringify(posts));

    document.getElementById('postContent').value = '';
    document.getElementById('postTags').value = '';

    closePostModal();
    loadFeed();
}

function likePost(id) {
    posts = posts.map(p => {
        if (p.id === id) {
            if (!p.likes) p.likes = [];
            
            if (!p.likes.includes(currentUser.uid)) {
                p.likes.push(currentUser.uid);
            } else {
                p.likes = p.likes.filter(uid => uid !== currentUser.uid);
            }
        }
        return p;
    });

    localStorage.setItem("posts", JSON.stringify(posts));
    loadFeed();
}

function openPostModal() {
    const modal = document.getElementById('postModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closePostModal() {
    const modal = document.getElementById('postModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// ===== PROFILE SYSTEM =====
function loadProfile() {
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileBio').textContent = currentUser.bio || 'No bio yet';
    document.getElementById('profileAvatar').src = currentUser.avatar;

    if (currentUser.github) {
        document.getElementById('profileGithub').href = currentUser.github;
        document.getElementById('profileGithub').style.display = 'inline-block';
    }
    if (currentUser.portfolio) {
        document.getElementById('profilePortfolio').href = currentUser.portfolio;
        document.getElementById('profilePortfolio').style.display = 'inline-block';
    }

    loadProfileSkills(currentUser.skills || []);

    // Update settings page too
    document.getElementById('settingsEmail').value = currentUser.email || '';
    document.getElementById('settingsUsername').value = currentUser.username;
}

function loadProfileSkills(skills) {
    const container = document.getElementById('skillsList');
    if (!container) return;
    
    container.innerHTML = '';

    if (!skills || skills.length === 0) {
        container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">No skills added yet</p>';
        return;
    }

    skills.forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-item';
        skillDiv.innerHTML = `
            <h4>${escapeHtml(skill)}</h4>
            <div class="skill-level">Intermediate</div>
        `;
        container.appendChild(skillDiv);
    });
}

function addSkill(skill) {
    if (!currentUser.skills) {
        currentUser.skills = [];
    }

    if (!currentUser.skills.includes(skill)) {
        currentUser.skills.push(skill);
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        loadProfile();
        alert('Skill added!');
    } else {
        alert('Skill already exists!');
    }
}

function switchTab(e) {
    const tabName = e.target.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const tabElement = document.getElementById(tabName + 'Tab');
    if (tabElement) {
        tabElement.classList.add('active');
    }
}

function openEditProfileModal() {
    document.getElementById('editUsername').value = currentUser.username || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editGithub').value = currentUser.github || '';
    document.getElementById('editPortfolio').value = currentUser.portfolio || '';
    document.getElementById('editAvatar').value = currentUser.avatar || '';
    document.getElementById('editProfileModal').classList.add('show');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

function updateProfile(e) {
    e.preventDefault();

    const updates = {
        username: document.getElementById('editUsername').value,
        bio: document.getElementById('editBio').value,
        github: document.getElementById('editGithub').value,
        portfolio: document.getElementById('editPortfolio').value,
        avatar: document.getElementById('editAvatar').value
    };

    currentUser = { ...currentUser, ...updates };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    closeEditProfileModal();
    loadProfile();
    updateUserUI();
    alert('Profile updated successfully!');
}

// ===== HELPER FUNCTIONS =====
function getTimeAgo(date) {
    if (!date) return 'now';

    const d = date instanceof Date ? date : new Date(date);
    const seconds = Math.floor((new Date() - d) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return 'just now';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return (text || '').replace(/[&<>"']/g, m => map[m]);
}
