let currentUser = null;
let currentPage = 'profile';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initializeAuth();
    setupEventListeners();
});

// Firebase Auth
async function initializeAuth() {
    const user = firebase.auth().currentUser;
    
    if (user) {
        currentUser = user;
        const userData = await getUserData(user.uid);
        if (userData) {
            currentUser = { ...user, ...userData };
            showMainApp();
            updateUserUI();
            navigateToPage('profile');
        }
    } else {
        showAuthModal();
    }
}

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

    // Auth
    document.getElementById('emailLoginForm').addEventListener('submit', emailLogin);
    document.getElementById('emailSignupForm').addEventListener('submit', emailSignup);
    document.getElementById('googleLoginBtn').addEventListener('click', googleLogin);
    document.getElementById('googleSignupBtn').addEventListener('click', googleSignup);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutDropdown').addEventListener('click', logout);

    // User Menu
    document.getElementById('userMenuBtn').addEventListener('click', toggleUserMenu);

    // Profile
    document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
    document.getElementById('editProfileForm').addEventListener('submit', updateProfile);

    // Profile Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Auth Tabs
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });

    // Add Skill Button
    if (document.getElementById('addSkillBtn')) {
        document.getElementById('addSkillBtn').addEventListener('click', () => {
            const skill = prompt('Enter skill name:');
            if (skill) {
                addSkill(skill);
            }
        });
    }
}

// Auth Functions
async function emailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const result = await firebase.auth().signInWithEmailAndPassword(email, password);
        currentUser = result.user;
        const userData = await getUserData(result.user.uid);
        if (userData) {
            currentUser = { ...result.user, ...userData };
        }
        closeAuthModal();
        showMainApp();
        updateUserUI();
        navigateToPage('profile');
    } catch (error) {
        alert(error.message);
    }
}

async function emailSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        const userData = {
            uid: result.user.uid,
            username: username,
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${username}`,
            bio: '',
            skills: [],
            github: '',
            portfolio: '',
            createdAt: new Date()
        };

        await firebase.firestore().collection('users').doc(result.user.uid).set(userData);
        
        currentUser = { ...result.user, ...userData };
        closeAuthModal();
        showMainApp();
        updateUserUI();
        navigateToPage('profile');
    } catch (error) {
        alert(error.message);
    }
}

async function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        currentUser = result.user;
        
        const userDoc = await firebase.firestore().collection('users').doc(result.user.uid).get();
        if (!userDoc.exists) {
            const userData = {
                uid: result.user.uid,
                username: result.user.displayName || 'User',
                email: result.user.email,
                avatar: result.user.photoURL || `https://ui-avatars.com/api/?name=${result.user.displayName}`,
                bio: '',
                skills: [],
                github: '',
                portfolio: '',
                createdAt: new Date()
            };
            await firebase.firestore().collection('users').doc(result.user.uid).set(userData);
            currentUser = { ...result.user, ...userData };
        } else {
            currentUser = { ...result.user, ...userDoc.data() };
        }
        
        closeAuthModal();
        showMainApp();
        updateUserUI();
        navigateToPage('profile');
    } catch (error) {
        alert(error.message);
    }
}

async function googleSignup() {
    await googleLogin();
}

async function logout() {
    await firebase.auth().signOut();
    currentUser = null;
    showAuthModal();
}

// UI Functions
function showAuthModal() {
    document.getElementById('authModal').classList.add('show');
    document.querySelector('.page-container').style.display = 'none';
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
    document.querySelector('.page-container').style.display = 'flex';
}

function showMainApp() {
    document.getElementById('authModal').classList.remove('show');
    document.querySelector('.page-container').style.display = 'flex';
}

function updateUserUI() {
    if (currentUser) {
        const avatar = currentUser.photoURL || currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}`;
        document.getElementById('userAvatarNav').src = avatar;
    }
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

    document.getElementById(page + 'Page').classList.add('active');

    // Load page content
    if (page === 'profile') {
        loadProfile();
    }
}

// Profile
async function loadProfile() {
    if (!currentUser) return;

    const userData = await getUserData(currentUser.uid);

    document.getElementById('profileUsername').textContent = userData.username;
    document.getElementById('profileBio').textContent = userData.bio || 'No bio yet';
    document.getElementById('profileAvatar').src = userData.avatar;

    if (userData.github) {
        document.getElementById('profileGithub').href = userData.github;
        document.getElementById('profileGithub').style.display = 'inline-block';
    }
    if (userData.portfolio) {
        document.getElementById('profilePortfolio').href = userData.portfolio;
        document.getElementById('profilePortfolio').style.display = 'inline-block';
    }

    loadProfileSkills(userData.skills);

    // Update settings page too
    document.getElementById('settingsEmail').value = userData.email;
    document.getElementById('settingsUsername').value = userData.username;
}

async function loadProfileSkills(skills) {
    const container = document.getElementById('skillsList');
    container.innerHTML = '';

    if (!skills || skills.length === 0) {
        container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">No skills added yet</p>';
        return;
    }

    skills.forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-item';
        skillDiv.innerHTML = `
            <h4>${skill}</h4>
            <div class="skill-level">Intermediate</div>
        `;
        container.appendChild(skillDiv);
    });
}

async function addSkill(skill) {
    const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
    const userData = (await userRef.get()).data();
    const skills = userData.skills || [];

    if (!skills.includes(skill)) {
        skills.push(skill);
        await userRef.update({ skills });
        loadProfile();
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
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function openEditProfileModal() {
    const userData = currentUser;
    document.getElementById('editUsername').value = userData.username || '';
    document.getElementById('editBio').value = userData.bio || '';
    document.getElementById('editGithub').value = userData.github || '';
    document.getElementById('editPortfolio').value = userData.portfolio || '';
    document.getElementById('editAvatar').value = userData.avatar || '';
    document.getElementById('editProfileModal').classList.add('show');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

async function updateProfile(e) {
    e.preventDefault();

    const updates = {
        username: document.getElementById('editUsername').value,
        bio: document.getElementById('editBio').value,
        github: document.getElementById('editGithub').value,
        portfolio: document.getElementById('editPortfolio').value,
        avatar: document.getElementById('editAvatar').value
    };

    try {
        await firebase.firestore().collection('users').doc(currentUser.uid).update(updates);
        currentUser = { ...currentUser, ...updates };
        closeEditProfileModal();
        loadProfile();
        updateUserUI();
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Error updating profile: ' + error.message);
    }
}

// Auth Tab Switching
function switchAuthTab(e) {
    const tabName = e.target.dataset.authTab;

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(tabName + 'Form').classList.add('active');
}

// Helper Functions
async function getUserData(userId) {
    try {
        const doc = await firebase.firestore().collection('users').doc(userId).get();
        return doc.data() || {};
    } catch (error) {
        console.error('Error getting user data:', error);
        return {};
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}