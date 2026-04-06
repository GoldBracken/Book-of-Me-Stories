/* Main script for Book of Me Stories app */

function dropMenu() {
  const dropdown = document.getElementById('drop');
  if (dropdown) dropdown.classList.toggle('show');
}

window.onclick = function(e) {
  if (!e.target.matches('.dropbtn')) {
    const dropdowns = document.getElementsByClassName('dropdown-content');
    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('show');
    }
  }
};

let usersData = {};
let storiesData = {};

async function loadInitialData() {
  try {
    const usersResponse = await fetch('/api/users');
    if (usersResponse.ok) {
      usersData = await usersResponse.json();
    }

    const storiesResponse = await fetch('/api/stories');
    if (storiesResponse.ok) {
      storiesData = await storiesResponse.json();
    }
  } catch (e) {
    console.log('Failed to load API, falling back to data file/localStorage:', e);
    try {
      const usersFile = await fetch('data/users.json');
      if (usersFile.ok) {
        usersData = (await usersFile.json()).users || {};
      }
      const storiesFile = await fetch('data/stories.json');
      if (storiesFile.ok) {
        storiesData = (await storiesFile.json()).stories || {};
      }
    } catch (innerErr) {
      console.warn('Failed to load local file data:', innerErr);
    }
  }

  const localUsers = JSON.parse(localStorage.getItem('users') || '{}');
  if (Object.keys(localUsers).length) {
    usersData = { ...usersData, ...localUsers };
  }

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('story-')) {
      try {
        storiesData[key] = JSON.parse(localStorage.getItem(key));
      } catch (err) {
        console.warn('Invalid story JSON', key, err);
      }
    }
  });

  syncStorage();
}

function syncStorage() {
  localStorage.setItem('users', JSON.stringify(usersData));
  Object.keys(storiesData).forEach((key) => {
    localStorage.setItem(key, JSON.stringify(storiesData[key]));
  });
}

async function saveUsersData() {
  localStorage.setItem('users', JSON.stringify(usersData));

  try {
    await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: usersData })
    });
  } catch (error) {
    console.warn('Unable to persist users to backend:', error);
  }
}

function previewImage(inputElement) {
  const preview = document.getElementById('coverPreview');
  if (!preview) return;

  if (!inputElement || !inputElement.files || inputElement.files.length === 0) {
    preview.src = '';
    preview.style.display = 'none';
    return;
  }

  const file = inputElement.files[0];
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    inputElement.value = '';
    preview.src = '';
    preview.style.display = 'none';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    preview.src = event.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function getStory(key) {
  return storiesData[key] || null;
}

async function persistStory(key, data) {
  storiesData[key] = data;
  localStorage.setItem(key, JSON.stringify(data));

  const payload = { ...data, id: key };
  try {
    const putResponse = await fetch(`/api/stories/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (putResponse.status === 404) {
      // story doesn't exist yet; create new
      await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (error) {
    console.warn('Unable to persist story to backend:', error);
  }
}

async function deleteStory(key) {
  delete storiesData[key];
  localStorage.removeItem(key);

  try {
    await fetch(`/api/stories/${encodeURIComponent(key)}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.warn('Unable to delete story from backend:', error);
  }
}

function getAllStories() {
  return {...storiesData};
}

function saveDraft(e) {
  e.preventDefault();
  const form = document.getElementById('storyForm');
  if (!form) return;
  const image = document.getElementById('coverPreview')?.src || '';
  const storyData = {
    title: form.title.value,
    date: form.date.value,
    author: form.author.value,
    content: form.content.value,
    tags: form.tags.value,
    image,
    privacy: form.privacy.checked,
    savedAt: new Date().toISOString(),
    userEmail: getCurrentUser()?.email || ''
  };
  const key = 'story-' + Date.now();
  persistStory(key, storyData);

  const msg = document.getElementById('saveMsg');
  if (msg) {
    msg.textContent = 'Saved draft locally.';
    setTimeout(() => { msg.textContent = ''; }, 2500);
  }
}

function saveStory(e) {
  e.preventDefault();
  const form = document.getElementById('storyForm');
  if (!form) return;
  const image = document.getElementById('coverPreview')?.src || '';

  const key = decodeURIComponent(window.location.href.split('?')[1] || '');
  if (!key) return;

  const item = getStory(key);
  if (!item) return;

  const imageSource = image || item.image || '';

  const storyData = {
    title: form.title.value,
    date: form.date.value,
    author: form.author.value,
    content: form.content.value,
    tags: form.tags.value,
    image: imageSource,
    privacy: form.privacy.checked,
    savedAt: new Date().toISOString(),
    userEmail: getCurrentUser()?.email || ''
  };

  persistStory(key, storyData);
  const msg = document.getElementById('saveMsg');
  if (msg) {
    msg.textContent = 'Saved story locally.';
    setTimeout(() => { msg.textContent = ''; }, 2500);
  }
  window.location.href = 'viewStory.html?' + encodeURIComponent(key);
}

async function showStories() {
  if (!Object.keys(storiesData).length) {
    await loadInitialData();
    updateNavigation();
  }

  const currentUser = getCurrentUser();
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  gallery.innerHTML = '';

  const allStories = getAllStories();

  Object.keys(allStories).forEach((key) => {
    const story = allStories[key];
    const isOwner = currentUser && story.userEmail === currentUser.email;
    const isPublic = !story.privacy;

    // Show if public or if private and owner
    if (!isPublic && !isOwner) return;

    const card = document.createElement('div');
    card.className = 'gallery-item';

    const img = document.createElement('img');
    img.className = 'gallery-thumb';
    img.src = story.image || 'https://via.placeholder.com/280x200?text=No+Image';
    img.alt = story.title || 'Story image';

    const title = document.createElement('h2');
    title.className = 'gallery-title';
    const link = document.createElement('a');
    link.href = 'gallery/viewStory.html?' + encodeURIComponent(key);
    link.textContent = story.title || 'Untitled';
    title.appendChild(link);

    const content = document.createElement('div');
    content.className = 'gallery-content';
    content.appendChild(title);

    // Add delete button only for owner
    if (isOwner) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'X';
      deleteBtn.addEventListener('click', () => {
        showCustomModal('Are you sure you want to delete this story?', () => {
          deleteStory(key);
          showStories();
        });
      });
      content.appendChild(deleteBtn);
    }

    card.appendChild(img);
    card.appendChild(content);
    gallery.appendChild(card);
  });
}

async function showMyStories() {
  if (!Object.keys(storiesData).length) {
    await loadInitialData();
    updateNavigation();
  }

  const currentUser = getCurrentUser();
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  gallery.innerHTML = '';

  const allStories = getAllStories();

  Object.keys(allStories).forEach((key) => {
    const story = allStories[key];
    const isOwner = currentUser && story.userEmail === currentUser.email;
    const isPublic = !story.privacy;
    if (isOwner) {
      // Show if public or if private and owner
      if (!isPublic && !isOwner) return;

      const card = document.createElement('div');
      card.className = 'gallery-item';

      const img = document.createElement('img');
      img.className = 'gallery-thumb';
      img.src = story.image || 'https://via.placeholder.com/280x200?text=No+Image';
      img.alt = story.title || 'Story image';

      const title = document.createElement('h2');
      title.className = 'gallery-title';
      const link = document.createElement('a');
      link.href = 'gallery/viewStory.html?' + encodeURIComponent(key);
      link.textContent = story.title || 'Untitled';
      title.appendChild(link);

      const content = document.createElement('div');
      content.className = 'gallery-content';
      content.appendChild(title);

      // Add delete button only for owner
      if (isOwner) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'X';
        deleteBtn.addEventListener('click', () => {
          showCustomModal('Are you sure you want to delete this story?', () => {
            deleteStory(key);
            showStories();
          });
        });
        content.appendChild(deleteBtn);
      }

      card.appendChild(img);
      card.appendChild(content);
      gallery.appendChild(card);
    }
  });
}

async function showStory() {
  if (!Object.keys(storiesData).length) {
    await loadInitialData();
    updateNavigation();
  }

  const key = decodeURIComponent(window.location.href.split('?')[1] || '');
  if (!key) return;
  const story = getStory(key);
  if (!story) return;

  const currentUser = getCurrentUser();
  const isOwner = currentUser && story.userEmail === currentUser.email;
  if (!isOwner) {
    // Not owner, redirect to view
    window.location.href = 'viewStory.html?' + encodeURIComponent(key);
    return;
  }

  const form = document.getElementById('storyForm');
  if (!form) return;

  form.title.value = story.title || '';
  form.date.value = story.date || '';
  form.author.value = story.author || '';
  form.content.value = story.content || '';
  form.tags.value = story.tags || '';

  const preview = document.getElementById('coverPreview');
  if (preview) {
    preview.src = story.image || '';
    preview.style.display = story.image ? 'block' : 'none';
  }
}


async function displayStory() {
  if (!Object.keys(storiesData).length) {
    await loadInitialData();
    updateNavigation();
  }

  const key = decodeURIComponent(window.location.href.split('?')[1] || '');
  if (!key) return;
  const story = getStory(key);
  if (!story) return;

  const currentUser = getCurrentUser();
  const isOwner = currentUser && story.userEmail === currentUser.email;
  const isPublic = !story.privacy;

  if (!isPublic && !isOwner) {
    // Cannot view private story
    document.getElementById('storyTitle').textContent = 'Access Denied';
    document.getElementById('displayTitle').textContent = 'This story is private.';
    document.getElementById('displayDate').textContent = '';
    document.getElementById('displayAuthor').textContent = '';
    document.getElementById('displayTags').textContent = '';
    document.getElementById('displayContent').textContent = 'You do not have permission to view this story.';
    document.getElementById('displayPrivacy').textContent = '';

    const img = document.getElementById('displayImage');
    if (img) img.style.display = 'none';

    const editBtn = document.getElementById('editButton');
    if (editBtn) editBtn.style.display = 'none';
    return;
  }

  document.getElementById('storyTitle').textContent = story.title || 'Untitled';
  document.getElementById('displayTitle').textContent = story.title || '';
  document.getElementById('displayDate').textContent = story.date || '';
  document.getElementById('displayAuthor').textContent = story.author || '';
  document.getElementById('displayTags').textContent = story.tags || '';
  document.getElementById('displayContent').textContent = story.content || '';
  document.getElementById('displayPrivacy').textContent = story.privacy ? 'Private' : 'Public';

  const img = document.getElementById('displayImage');
  if (img) {
    if (story.image) {
      img.src = story.image;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }
  }

  const editBtn = document.getElementById('editButton');
  if (editBtn) {
    if (isOwner) {
      editBtn.style.display = 'inline-block';
      editBtn.onclick = () => {
        window.location.href = 'editStory.html?' + encodeURIComponent(key);
      };
    } else {
      editBtn.style.display = 'none';
    }
  }
}

function showCustomModal(message, onConfirm) {
  const modal = document.getElementById('customModal');
  const backdrop = document.getElementById('modalBackdrop');
  const messageEl = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirm');
  const cancelBtn = document.getElementById('modalCancel');
  const closeBtn = document.getElementById('closeModal');

  if (!modal || !backdrop || !messageEl || !confirmBtn || !cancelBtn || !closeBtn) return;

  messageEl.textContent = message;
  modal.style.display = 'block';
  backdrop.classList.add('show');
  backdrop.style.display = 'block';

  modal.onclick = (e) => e.stopPropagation();

  const handleConfirm = () => {
    hideModal();
    if (typeof onConfirm === 'function') onConfirm();
  };

  const handleCancel = () => {
    hideModal();
  };

  confirmBtn.onclick = handleConfirm;
  cancelBtn.onclick = handleCancel;
  closeBtn.onclick = handleCancel;
  backdrop.onclick = handleCancel;
}

function hideModal() {
  const modal = document.getElementById('customModal');
  const backdrop = document.getElementById('modalBackdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.classList.remove('show');
}

function showCustomAlert(message, onConfirm) {
  if (!confirm(message)) return;
  if (typeof onConfirm === 'function') onConfirm();
}

async function registerUser(e) {
  e.preventDefault();
  const form = document.getElementById('registerForm');
  const name = form.name.value.trim();
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const msg = document.getElementById('registerMsg');

  if (password !== confirmPassword) {
    msg.textContent = 'Passwords do not match.';
    return;
  }
  if (password.length < 6) {
    msg.textContent = 'Password must be at least 6 characters long.';
    return;
  }
  if (usersData[email]) {
    msg.textContent = 'An account with this email already exists.';
    return;
  }

  const user = { name, email, password, createdAt: new Date().toISOString() };
  
  try {
    // POST to backend to register user
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    if (response.status === 409) {
      msg.textContent = 'An account with this email already exists.';
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      msg.textContent = error.error || 'Registration failed. Please try again.';
      return;
    }

    // Also update local data
    usersData[email] = user;
    localStorage.setItem('users', JSON.stringify(usersData));
    
    msg.style.color = 'green';
    msg.textContent = 'Account created successfully! You can now login.';
    form.reset();
  } catch (error) {
    console.warn('Registration error:', error);
    // Fallback to local storage if backend is unavailable
    usersData[email] = user;
    localStorage.setItem('users', JSON.stringify(usersData));
    msg.style.color = 'green';
    msg.textContent = 'Account created successfully! You can now login.';
    form.reset();
  }
}

async function loginUser(e) {
  e.preventDefault();
  const form = document.getElementById('loginForm');
  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value;
  const msg = document.getElementById('loginMsg');

  try {
    // Fetch fresh user data from backend
    const response = await fetch('/api/users');
    if (response.ok) {
      const freshUsers = await response.json();
      usersData = freshUsers;
    }
  } catch (error) {
    console.warn('Failed to fetch user data:', error);
  }

  const user = usersData[email];
  if (!user || user.password !== password) {
    msg.textContent = 'Invalid email or password.';
    return;
  }

  localStorage.setItem('currentUser', JSON.stringify({ email: user.email, name: user.name, loginTime: new Date().toISOString() }));
  msg.style.color = 'green';
  msg.textContent = 'Login successful! Redirecting...';
  setTimeout(() => (window.location.href = 'index.html'), 1000);
}

function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function updateNavigation() {
  const nav = document.getElementById('user-nav');
  if (!nav) return;
  const user = getCurrentUser();
  if (user) {
    nav.innerHTML = `<span>Welcome, ${user.name}!</span><button onclick="logoutUser()">Logout</button>`;
  } else {
    nav.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
  }
}

/**
 * Fetches user information by email from users.json via the API
 * @param {string} email - User email to look up
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserByEmail(email) {
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      const users = await response.json();
      return users[email.toLowerCase()] || null;
    }
  } catch (error) {
    console.warn('Failed to fetch user by email:', error);
  }
  return null;
}

/**
 * Fetches all users from users.json via the API
 * @returns {Promise<Object>} All users object
 */
async function getAllUsers() {
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch all users:', error);
  }
  return {};
}

/**
 * Updates user information in users.json
 * @param {string} email - User email
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
async function updateUser(email, updates) {
  try {
    const allUsers = await getAllUsers();
    if (!allUsers[email.toLowerCase()]) {
      console.warn('User not found:', email);
      return false;
    }
    
    const updatedUser = { ...allUsers[email.toLowerCase()], ...updates };
    allUsers[email.toLowerCase()] = updatedUser;
    
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: allUsers })
    });
    
    if (response.ok) {
      usersData = allUsers;
      localStorage.setItem('users', JSON.stringify(usersData));
      return true;
    }
  } catch (error) {
    console.warn('Failed to update user:', error);
  }
  return false;
}


document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  updateNavigation();
});
