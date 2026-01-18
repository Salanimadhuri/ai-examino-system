const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const users = {};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = Object.values(users).find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log(`User authenticated: ${username} with role: ${user.role}`);
    res.json({
      success: true,
      message: 'Login successful',
      userId: user.userId,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      token: `token_${user.userId}_${Date.now()}`
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, role, fullName, email } = req.body;
  
  if (!['TEACHER', 'STUDENT'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role. Must be TEACHER or STUDENT' });
  }
  
  const exists = Object.values(users).find(u => u.username === username);
  
  if (exists) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }
  
  const userId = role.toLowerCase() + Date.now();
  users[userId] = { userId, username, password, role, fullName, email, results: [] };
  
  console.log(`User registered: ${username} with role: ${role}`);
  
  res.json({
    success: true,
    message: 'Registration successful',
    userId,
    username,
    role,
    fullName,
    token: `token_${userId}_${Date.now()}`
  });
});

app.get('/api/student/available-exams', (req, res) => {
  res.json([
    { examId: 'exam1', title: 'Mathematics Final', description: 'Algebra and Calculus', duration: 60 },
    { examId: 'exam2', title: 'Physics Midterm', description: 'Mechanics and Thermodynamics', duration: 90 }
  ]);
});

app.post('/api/student/submit-exam', (req, res) => {
  const { studentId, examId, answers } = req.body;
  
  const result = {
    studentId,
    examId,
    score: Math.floor(Math.random() * 40) + 60,
    feedback: 'Good performance! Keep up the excellent work.',
    createdAt: new Date().toISOString()
  };
  
  if (!users[studentId]) {
    users[studentId] = { results: [] };
  }
  if (!users[studentId].results) {
    users[studentId].results = [];
  }
  users[studentId].results.push(result);
  
  res.json(result);
});

app.get('/api/student/results/:userId', (req, res) => {
  const { userId } = req.params;
  const results = users[userId]?.results || [];
  res.json(results);
});

app.get('/api/teacher/exams/:teacherId', (req, res) => {
  res.json([]);
});

app.listen(8080, () => {
  console.log('Backend running on http://localhost:8080');
  console.log('No default users - please register new accounts');
  console.log('Roles: TEACHER or STUDENT');
});