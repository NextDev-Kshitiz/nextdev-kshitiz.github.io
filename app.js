let currentUser = null;
let currentPage = 'feed';
let currentConversation = null;
let postType = 'text';
let currentCommentPostId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initializeAuth();
    setupEventListeners();
    loadInitialData();
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

    // Create Post
    document.getElementById('submitPostBtn').addEventListener('click', openPostModal);
    document.getElementById('postTypeText').addEventListener('click', () => {
        postType = 'text';
        openPostModal();
    });
    document.getElementById('postTypeProject').addEventListener('click', () => {
        postType = 'project';
        openPostModal();
    });
    document.getElementById('postTypeLink').addEventListener('click', () => {
        postType = 'link';
        openPostModal();
    });

    // Post Modal
    document.getElementById('postForm').addEventListener('submit', submitPost);

    // Profile
    document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
    document.getElementById('editProfileForm').addEventListener('submit', updateProfile);

    // Profile Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Messages
    document.getElementById('newMessageBtn').addEventListener('click', openMessageUserModal);
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
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

    // Add Project Button
    if (document.getElementById('addProjectBtn')) {
        document.getElementById('addProjectBtn').addEventListener('click', openAddProjectModal);
    }

    // Search Users
    document.getElementById('userSearchInput').addEventListener('input', searchUsers);
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
            createdAt: new Date(),
            posts: 0,
            followers: 0,
            following: 0
        };

        await firebase.firestore().collection('users').doc(result.user.uid).set(userData);
        
        currentUser = { ...result.user, ...userData };
        closeAuthModal();
        showMainApp();
        updateUserUI();
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
                createdAt: new Date(),
                posts: 0,
                followers: 0,
                following: 0
            };
            await firebase.firestore().collection('users').doc(result.user.uid).set(userData);
            currentUser = { ...result.user, ...userData };
        } else {
            currentUser = { ...result.user, ...userDoc.data() };
        }
        
        closeAuthModal();
        showMainApp();
        updateUserUI();
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
    document.getElementById('postsFeed').innerHTML = '';
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
        document.getElementById('createPostAvatar').src = avatar;
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
    switch(page) {
        case 'feed':
            loadFeed();
            break;
        case 'messages':
            loadConversations();
            break;
        case 'challenges':
            loadChallenges();
            break;
        case 'portfolio':
            loadPortfolio();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Feed Functions
async function loadFeed() {
    const feedContainer = document.getElementById('postsFeed');
    feedContainer.innerHTML = '<div class="loading">Loading posts...</div>';

    try {
        const postsSnapshot = await firebase.firestore()
            .collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        feedContainer.innerHTML = '';

        if (postsSnapshot.empty) {
            feedContainer.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: 40px;">No posts yet. Be the first to share!</p>';
            return;
        }

        for (const doc of postsSnapshot.docs) {
            const post = doc.data();
            const postCard = await createPostCard(doc.id, post);
            feedContainer.appendChild(postCard);
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedContainer.innerHTML = '<p style="color: red;">Error loading feed</p>';
    }
}

async function createPostCard(postId, post) {
    const div = document.createElement('div');
    div.className = 'post-card fade-in';

    const author = await getUserData(post.userId);
    const comments = await getPostComments(postId);
    const likes = post.likes || [];
    const isLiked = currentUser && likes.includes(currentUser.uid);

    let contentHtml = `<div class="post-content">${escapeHtml(post.content)}</div>`;

    if (post.type === 'project') {
        contentHtml += `
            <div class="post-project-card">
                <strong>${escapeHtml(post.projectName || 'Untitled Project')}</strong>
                <p>${escapeHtml(post.projectDescription || '')}</p>
                <div class="project-tags">
                    ${post.technologies ? post.technologies.split(',').map(tech => 
                        `<span class="tag">#${tech.trim()}</span>`
                    ).join('') : ''}
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    ${post.demoLink ? `<a href="${post.demoLink}" target="_blank" class="btn-secondary">View Demo</a>` : ''}
                    ${post.githubLink ? `<a href="${post.githubLink}" target="_blank" class="btn-secondary">View Code</a>` : ''}
                </div>
            </div>
        `;
    } else if (post.type === 'link') {
        contentHtml += `
            <div class="post-link-preview">
                <strong>${escapeHtml(post.linkTitle || 'Shared Link')}</strong>
                <p>${escapeHtml(post.linkDescription || '')}</p>
                <a href="${post.link}" target="_blank" style="color: var(--primary);">${post.link}</a>
            </div>
        `;
    }

    const tagsHtml = post.tags ? post.tags.split(',').map(tag => 
        `<a href="#" class="tag">#${tag.trim()}</a>`
    ).join('') : '';

    if (tagsHtml) {
        contentHtml += `<div class="project-tags">${tagsHtml}</div>`;
    }

    const timeAgo = getTimeAgo(post.createdAt);

    div.innerHTML = `
        <div class="post-header">
            <img src="${author.avatar}" alt="${author.username}" class="post-avatar">
            <div class="post-meta">
                <div class="post-author">
                    <a href="#" class="post-author-name">${author.username}</a>
                    ${post.type !== 'text' ? `<span class="post-type-badge">${post.type}</span>` : ''}
                </div>
                <span class="post-timestamp">${timeAgo}</span>
            </div>
            <div class="post-actions-menu">
                <button class="post-menu-btn">⋮</button>
                <div class="post-menu">
                    ${post.userId === currentUser.uid ? `
                        <button class="post-menu-item" onclick="deletePost('${postId}')">Delete</button>
                        <button class="post-menu-item" onclick="editPost('${postId}')">Edit</button>
                    ` : ''}
                    <button class="post-menu-item">Report</button>
                </div>
            </div>
        </div>

        ${contentHtml}

        <div class="post-footer">
            <button class="post-interaction ${isLiked ? 'liked' : ''}" onclick="toggleLike('${postId}')">
                <i class="fas fa-heart"></i>
                <span>${likes.length}</span>
            </button>
            <button class="post-interaction" onclick="openCommentModal('${postId}')">
                <i class="fas fa-comment"></i>
                <span>${comments.length}</span>
            </button>
            <button class="post-interaction" onclick="sharePost('${postId}')">
                <i class="fas fa-share"></i>
            </button>
        </div>

        <div class="comments-section">
            <button class="comments-toggle" onclick="toggleComments('${postId}')">
                View ${comments.length} comment${comments.length !== 1 ? 's' : ''}
            </button>
            <div id="comments-${postId}" style="display: none;">
                ${await renderComments(postId, comments)}
            </div>
        </div>
    `;

    // Setup menu toggle
    const menuBtn = div.querySelector('.post-menu-btn');
    const menu = div.querySelector('.post-menu');
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        menu.classList.remove('show');
    });

    return div;
}

async function renderComments(postId, comments) {
    if (comments.length === 0) {
        return '<p style="color: var(--text-tertiary); font-size: 13px;">No comments yet. Be the first!</p>';
    }

    let html = '';
    for (const comment of comments) {
        const author = await getUserData(comment.userId);
        const timeAgo = getTimeAgo(comment.createdAt);

        html += `
            <div class="comment">
                <img src="${author.avatar}" alt="${author.username}" class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-author">${author.username}</div>
                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                    <div class="comment-meta">
                        <span>${timeAgo}</span>
                    </div>
                    <div class="comment-actions">
                        <button class="comment-action-btn" onclick="likeComment('${postId}', '${comment.id}')">
                            <i class="fas fa-heart"></i> Like
                        </button>
                        <button class="comment-action-btn" onclick="replyComment('${postId}', '${comment.id}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="nested-replies">
                            ${comment.replies.map(reply => `
                                <div class="comment">
                                    <img src="${reply.avatar}" alt="${reply.username}" class="comment-avatar">
                                    <div class="comment-content">
                                        <div class="comment-author">${reply.username}</div>
                                        <div class="comment-text">${escapeHtml(reply.text)}</div>
                                        <div class="comment-meta">
                                            <span>${getTimeAgo(reply.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    return html;
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv) {
        commentsDiv.style.display = commentsDiv.style.display === 'none' ? 'block' : 'none';
    }
}

async function toggleLike(postId) {
    if (!currentUser) return;

    const postRef = firebase.firestore().collection('posts').doc(postId);
    const post = (await postRef.get()).data();
    let likes = post.likes || [];

    if (likes.includes(currentUser.uid)) {
        likes = likes.filter(id => id !== currentUser.uid);
    } else {
        likes.push(currentUser.uid);
    }

    await postRef.update({ likes });
    loadFeed();
}

function openCommentModal(postId) {
    currentCommentPostId = postId;
    document.getElementById('commentModal').classList.add('show');
}

function closeCommentModal() {
    document.getElementById('commentModal').classList.remove('show');
    currentCommentPostId = null;
}

document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('commentContent').value;

    if (!text.trim() || !currentCommentPostId) return;

    const comment = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        text: text,
        createdAt: new Date(),
        likes: [],
        replies: []
    };

    const postRef = firebase.firestore().collection('posts').doc(currentCommentPostId);
    const post = (await postRef.get()).data();
    const comments = post.comments || [];
    comments.push(comment);

    await postRef.update({ comments });

    document.getElementById('commentContent').value = '';
    closeCommentModal();
    loadFeed();
});

async function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        await firebase.firestore().collection('posts').doc(postId).delete();
        loadFeed();
    }
}

function editPost(postId) {
    alert('Edit feature coming soon');
}

function sharePost(postId) {
    if (navigator.share) {
        navigator.share({
            title: 'Check this out on Nexus',
            url: window.location.href
        });
    }
}

// Post Creation
function openPostModal() {
    const modal = document.getElementById('postModal');
    modal.classList.add('show');
    
    document.getElementById('postModalTitle').textContent = 
        postType === 'text' ? 'Create Post' : 
        postType === 'project' ? 'Showcase Project' : 
        'Share Link';

    let fieldsHtml = '';
    if (postType === 'project') {
        fieldsHtml = `
            <div class="form-group">
                <label>Project Name</label>
                <input type="text" id="projectName" required>
            </div>
            <div class="form-group">
                <label>Project Description</label>
                <textarea id="projectDescription" required></textarea>
            </div>
            <div class="form-group">
                <label>Technologies Used</label>
                <input type="text" id="technologies" placeholder="React, Node.js, MongoDB...">
            </div>
            <div class="form-group">
                <label>Demo Link</label>
                <input type="url" id="demoLink">
            </div>
            <div class="form-group">
                <label>GitHub Link</label>
                <input type="url" id="githubLink">
            </div>
        `;
    } else if (postType === 'link') {
        fieldsHtml = `
            <div class="form-group">
                <label>Link</label>
                <input type="url" id="link" required>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="linkTitle" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="linkDescription"></textarea>
            </div>
        `;
    }

    document.getElementById('postTypeFields').innerHTML = fieldsHtml;
}

function closePostModal() {
    document.getElementById('postModal').classList.remove('show');
}

async function submitPost(e) {
    e.preventDefault();

    if (!currentUser) {
        alert('Please login first');
        return;
    }

    const content = document.getElementById('postContent').value;
    const tags = document.getElementById('postTags').value;

    if (!content.trim()) {
        alert('Please enter some content');
        return;
    }

    const post = {
        userId: currentUser.uid,
        content: content,
        type: postType,
        tags: tags,
        likes: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };

    if (postType === 'project') {
        post.projectName = document.getElementById('projectName').value;
        post.projectDescription = document.getElementById('projectDescription').value;
        post.technologies = document.getElementById('technologies').value;
        post.demoLink = document.getElementById('demoLink').value;
        post.githubLink = document.getElementById('githubLink').value;
    } else if (postType === 'link') {
        post.link = document.getElementById('link').value;
        post.linkTitle = document.getElementById('linkTitle').value;
        post.linkDescription = document.getElementById('linkDescription').value;
    }

    try {
        await firebase.firestore().collection('posts').add(post);
        
        // Update user post count
        const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
        const userData = (await userRef.get()).data();
        await userRef.update({
            posts: (userData.posts || 0) + 1
        });

        document.getElementById('postContent').value = '';
        document.getElementById('postTags').value = '';
        closePostModal();
        loadFeed();
    } catch (error) {
        alert('Error creating post: ' + error.message);
    }
}

// Messages Functions
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '<div class="loading">Loading conversations...</div>';

    try {
        const snapshot = await firebase.firestore()
            .collection('conversations')
            .where('participants', 'array-contains', currentUser.uid)
            .orderBy('lastMessageTime', 'desc')
            .get();

        conversationsList.innerHTML = '';

        if (snapshot.empty) {
            conversationsList.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-tertiary);">No conversations yet</p>';
            return;
        }

        for (const doc of snapshot.docs) {
            const conversation = doc.data();
            const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
            const otherUser = await getUserData(otherUserId);

            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.innerHTML = `
                <div class="conversation-header-info">
                    <img src="${otherUser.avatar}" alt="${otherUser.username}" class="conversation-avatar">
                    <div class="conversation-info">
                        <div class="conversation-name">${otherUser.username}</div>
                        <div class="conversation-preview">${conversation.lastMessage || 'No messages yet'}</div>
                    </div>
                    <div class="conversation-time">${getTimeAgo(conversation.lastMessageTime)}</div>
                </div>
            `;

            item.addEventListener('click', () => openConversation(doc.id, otherUser));
            conversationsList.appendChild(item);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

async function openConversation(conversationId, otherUser) {
    currentConversation = { id: conversationId, user: otherUser };

    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Show chat
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'flex';

    // Update chat header
    document.getElementById('chatUserAvatar').src = otherUser.avatar;
    document.getElementById('chatUserName').textContent = otherUser.username;

    // Load messages
    loadMessages(conversationId);
}

async function loadMessages(conversationId) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';

    try {
        const snapshot = await firebase.firestore()
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .get();

        for (const doc of snapshot.docs) {
            const message = doc.data();
            const isSent = message.senderId === currentUser.uid;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message-group ${isSent ? 'sent' : ''}`;
            messageDiv.innerHTML = `
                ${!isSent ? `<img src="${currentConversation.user.avatar}" alt="User" class="message-avatar">` : ''}
                <div>
                    <div class="message">${escapeHtml(message.text)}</div>
                    <div class="message-time">${new Date(message.createdAt.toDate()).toLocaleTimeString()}</div>
                </div>
            `;

            messagesContainer.appendChild(messageDiv);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text || !currentConversation) return;

    try {
        const conversationRef = firebase.firestore()
            .collection('conversations')
            .doc(currentConversation.id);

        await conversationRef.collection('messages').add({
            senderId: currentUser.uid,
            text: text,
            createdAt: new Date()
        });

        await conversationRef.update({
            lastMessage: text,
            lastMessageTime: new Date()
        });

        input.value = '';
        loadMessages(currentConversation.id);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function openMessageUserModal() {
    document.getElementById('messageUserModal').classList.add('show');
}

function closeMessageUserModal() {
    document.getElementById('messageUserModal').classList.remove('show');
}

async function searchUsers() {
    const query = document.getElementById('userSearchInput').value.toLowerCase();
    const resultsContainer = document.getElementById('userSearchResults');

    if (query.length === 0) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        const snapshot = await firebase.firestore()
            .collection('users')
            .limit(10)
            .get();

        const results = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => 
                user.username.toLowerCase().includes(query) && 
                user.id !== currentUser.uid
            );

        resultsContainer.innerHTML = results.map(user => `
            <div class="user-search-result" onclick="startConversation('${user.id}', '${user.username}')">
                <img src="${user.avatar}" alt="${user.username}">
                <div class="user-search-info">
                    <div class="user-search-name">${user.username}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

async function startConversation(userId, username) {
    try {
        const participants = [currentUser.uid, userId].sort();
        const conversationQuery = await firebase.firestore()
            .collection('conversations')
            .where('participants', '==', participants)
            .get();

        let conversationId;
        if (conversationQuery.empty) {
            const newConversation = await firebase.firestore()
                .collection('conversations')
                .add({
                    participants: participants,
                    lastMessage: '',
                    lastMessageTime: new Date()
                });
            conversationId = newConversation.id;
        } else {
            conversationId = conversationQuery.docs[0].id;
        }

        closeMessageUserModal();
        navigateToPage('messages');
        const otherUser = await getUserData(userId);
        openConversation(conversationId, otherUser);
    } catch (error) {
        console.error('Error starting conversation:', error);
    }
}

// Challenges
async function loadChallenges() {
    const container = document.getElementById('challengesGrid');
    container.innerHTML = '<div class="loading">Loading challenges...</div>';

    try {
        const snapshot = await firebase.firestore()
            .collection('challenges')
            .orderBy('createdAt', 'desc')
            .get();

        container.innerHTML = '';

        const challenges = [
            {
                id: '1',
                title: 'Build a Weather App',
                description: 'Create a responsive weather application using any API and framework of your choice.',
                difficulty: 'Intermediate',
                participants: 245,
                deadline: 'Next Sunday'
            },
            {
                id: '2',
                title: 'Create a Todo List',
                description: 'Build a feature-rich todo application with local storage or backend integration.',
                difficulty: 'Beginner',
                participants: 512,
                deadline: 'Next Sunday'
            },
            {
                id: '3',
                title: 'E-commerce Platform',
                description: 'Build a complete e-commerce platform with product listing, cart, and checkout.',
                difficulty: 'Advanced',
                participants: 89,
                deadline: 'Next Sunday'
            }
        ];

        challenges.forEach(challenge => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            card.innerHTML = `
                <span class="challenge-difficulty">${challenge.difficulty}</span>
                <h3>${challenge.title}</h3>
                <p>${challenge.description}</p>
                <div class="challenge-meta">
                    <div class="challenge-participants">
                        <i class="fas fa-users"></i> ${challenge.participants} participants
                    </div>
                    <div>
                        <i class="fas fa-calendar"></i> ${challenge.deadline}
                    </div>
                </div>
                <button class="btn-primary" style="width: 100%;">
                    <i class="fas fa-arrow-right"></i> View Challenge
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading challenges:', error);
    }
}

// Portfolio
async function loadPortfolio() {
    const container = document.getElementById('portfolioGrid');
    container.innerHTML = '<div class="loading">Loading portfolio...</div>';

    try {
        const snapshot = await firebase.firestore()
            .collection('portfolio')
            .orderBy('createdAt', 'desc')
            .get();

        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-tertiary); padding: 40px;">No projects yet</p>';
            return;
        }

        snapshot.forEach(doc => {
            const project = doc.data();
            const card = document.createElement('div');
            card.className = 'portfolio-card';
            card.innerHTML = `
                <div class="portfolio-card-image"></div>
                <div class="portfolio-card-content">
                    <h3 class="portfolio-card-title">${project.title}</h3>
                    <p class="portfolio-card-description">${project.description}</p>
                    <div class="portfolio-technologies">
                        ${project.technologies ? project.technologies.split(',').map(tech => 
                            `<span class="tech-tag">${tech.trim()}</span>`
                        ).join('') : ''}
                    </div>
                    <div class="portfolio-card-links">
                        ${project.demoLink ? `<a href="${project.demoLink}" target="_blank" class="portfolio-link-btn"><i class="fas fa-globe"></i> Demo</a>` : ''}
                        ${project.githubLink ? `<a href="${project.githubLink}" target="_blank" class="portfolio-link-btn"><i class="fab fa-github"></i> Code</a>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
}

function openAddProjectModal() {
    alert('Add project feature coming soon');
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
    loadProfilePosts();
    loadAchievements();

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

async function loadProfilePosts() {
    const container = document.getElementById('userPostsList');
    container.innerHTML = '<div class="loading">Loading posts...</div>';

    try {
        const snapshot = await firebase.firestore()
            .collection('posts')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">No posts yet</p>';
            return;
        }

        for (const doc of snapshot.docs) {
            const post = doc.data();
            const postCard = await createPostCard(doc.id, post);
            container.appendChild(postCard);
        }
    } catch (error) {
        console.error('Error loading profile posts:', error);
    }
}

async function loadAchievements() {
    const container = document.getElementById('achievementsGrid');
    container.innerHTML = '';

    const achievements = [
        { icon: '⭐', name: 'First Post', description: 'Posted for the first time' },
        { icon: '🔥', name: '7 Day Streak', description: 'Posted for 7 consecutive days' },
        { icon: '💬', name: 'Helpful', description: 'Received 10 helpful comments' },
        { icon: '🚀', name: 'Launch Pro', description: 'Shared 5 projects' }
    ];

    achievements.forEach(achievement => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
        `;
        container.appendChild(item);
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

async function getPostComments(postId) {
    try {
        const doc = await firebase.firestore().collection('posts').doc(postId).get();
        return doc.data().comments || [];
    } catch (error) {
        return [];
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date.toDate()) / 1000);
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
    return Math.floor(seconds) + ' seconds ago';
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

function loadInitialData() {
    loadFeed();
    loadCommunityStats();
    loadActiveMembers();
}

async function loadCommunityStats() {
    try {
        const usersSnapshot = await firebase.firestore().collection('users').get();
        document.getElementById('activeMembersCount').textContent = usersSnapshot.size;

        const postsSnapshot = await firebase.firestore().collection('posts').get();
        const today = new Date().toDateString();
        const todayPosts = postsSnapshot.docs.filter(doc => {
            const postDate = doc.data().createdAt.toDate().toDateString();
            return postDate === today;
        });
        document.getElementById('postsTodayCount').textContent = todayPosts.length;

        const portfolioSnapshot = await firebase.firestore().collection('portfolio').get();
        document.getElementById('newProjectsCount').textContent = portfolioSnapshot.size;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadActiveMembers() {
    const container = document.getElementById('activeMembersList');
    container.innerHTML = '';

    try {
        const snapshot = await firebase.firestore()
            .collection('users')
            .limit(5)
            .get();

        snapshot.forEach(doc => {
            const user = doc.data();
            const item = document.createElement('div');
            item.className = 'member-item';
            item.innerHTML = `
                <img src="${user.avatar}" alt="${user.username}" class="member-avatar">
                <div class="member-info">
                    <div class="member-name">${user.username}</div>
                    <div class="member-status">${user.posts || 0} posts</div>
                </div>
            `;
            item.addEventListener('click', () => {
                alert(`View ${user.username}'s profile`);
            });
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading active members:', error);
    }
}

function likeComment(postId, commentId) {
    alert('Comment like feature coming soon');
}

function replyComment(postId, commentId) {
    alert('Reply feature coming soon');
}