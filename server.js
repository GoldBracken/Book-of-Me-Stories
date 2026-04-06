const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/users', (req, res) => {
  const data = readJSON(USERS_FILE);
  res.json(data.users || {});
});

app.get('/api/users/:email', (req, res) => {
  const email = req.params.email.toLowerCase();
  const data = readJSON(USERS_FILE);
  const users = data.users || {};
  const user = users[email];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const usersData = readJSON(USERS_FILE).users || {};
  const user = req.body;
  if (!user || !user.email) {
    return res.status(400).json({ error: 'Invalid user payload' });
  }
  if (usersData[user.email]) {
    return res.status(409).json({ error: 'User already exists' });
  }
  usersData[user.email] = user;
  writeJSON(USERS_FILE, { users: usersData });
  res.status(201).json(user);
});

app.put('/api/users', (req, res) => {
  const users = req.body.users;
  if (!users || typeof users !== 'object') {
    return res.status(400).json({ error: 'Invalid users payload' });
  }
  writeJSON(USERS_FILE, { users });
  res.json({ users });
});

app.delete('/api/users/:email', (req, res) => {
  const email = req.params.email.toLowerCase();
  const usersData = readJSON(USERS_FILE).users || {};
  if (!usersData[email]) {
    return res.status(404).json({ error: 'User not found' });
  }
  delete usersData[email];
  writeJSON(USERS_FILE, { users: usersData });
  res.json({ success: true });
});

app.get('/api/stories', (req, res) => {
  const data = readJSON(STORIES_FILE);
  res.json(data.stories || {});
});

app.post('/api/stories', (req, res) => {
  const storiesData = readJSON(STORIES_FILE).stories || {};
  const story = req.body;
  const key = story.id || `story-${Date.now()}`;
  storiesData[key] = { ...story, id: key };
  writeJSON(STORIES_FILE, { stories: storiesData });
  res.status(201).json(storiesData[key]);
});

app.put('/api/stories/:id', (req, res) => {
  const id = req.params.id;
  const storiesData = readJSON(STORIES_FILE).stories || {};
  if (!storiesData[id]) {
    return res.status(404).json({ error: 'Story not found' });
  }
  storiesData[id] = { ...req.body, id };
  writeJSON(STORIES_FILE, { stories: storiesData });
  res.json(storiesData[id]);
});

app.delete('/api/stories/:id', (req, res) => {
  const id = req.params.id;
  const storiesData = readJSON(STORIES_FILE).stories || {};
  if (!storiesData[id]) {
    return res.status(404).json({ error: 'Story not found' });
  }
  delete storiesData[id];
  writeJSON(STORIES_FILE, { stories: storiesData });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
