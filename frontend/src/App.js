import React, { useState } from 'react';
import axios from 'axios';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ExamUpload from './components/ExamUpload';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [showExamUpload, setShowExamUpload] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('sessionId', userData.token);
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await axios.post(`http://localhost:8080/api/auth/logout?sessionId=${sessionId}`);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    setShowExamUpload(false);
    localStorage.removeItem('sessionId');
  };

  // Check for existing session on app start
  React.useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      axios.get(`http://localhost:8080/api/auth/validate-session?sessionId=${sessionId}`)
        .then(response => {
          if (response.data.success) {
            setUser(response.data);
          } else {
            localStorage.removeItem('sessionId');
          }
        })
        .catch(() => {
          localStorage.removeItem('sessionId');
        });
    }
  }, []);

  if (showExamUpload) {
    return (
      <div>
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={() => setShowExamUpload(false)}
            className="btn-secondary shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
        <ExamUpload />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Examino</h1>
                <p className="text-xs text-gray-500">Academic Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showProfile ? (
          <div className="card p-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-semibold text-primary-600">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{user.fullName}</h3>
              <p className="text-gray-600 capitalize">{user.role.toLowerCase()}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-gray-900">{user.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              
              {user.role === 'STUDENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Level</label>
                    <p className="text-gray-900">{user.academicLevel}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <p className="text-gray-900">{user.grade}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowProfile(false)}
                className="w-full btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          user.role === 'TEACHER' ? (
            <TeacherDashboard user={user} />
          ) : (
            <StudentDashboard user={user} />
          )
        )}
      </main>
    </div>
  );
}

export default App;