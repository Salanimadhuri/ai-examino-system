import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    academicLevel: '',
    grade: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post('http://localhost:8080' + endpoint, {
        ...formData,
        role: userType
      });
      
      if (response.data.success) {
        onLogin(response.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection failed - backend not running');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Examino</h1>
            <p className="text-xl text-gray-600">Choose your role to get started</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => setUserType('TEACHER')}
              className="card card-hover p-8 cursor-pointer group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 group-hover:bg-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">Teacher</h2>
                <p className="text-gray-600">Create exams, upload answer sheets, and view AI-powered evaluations</p>
              </div>
            </div>
            
            <div 
              onClick={() => setUserType('STUDENT')}
              className="card card-hover p-8 cursor-pointer group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 group-hover:bg-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">Student</h2>
                <p className="text-gray-600">Take exams online and view your results with detailed feedback</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <button
          onClick={() => setUserType(null)}
          className="mb-6 text-primary-600 hover:text-primary-700 flex items-center font-medium transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {userType === 'TEACHER' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                )}
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {userType === 'TEACHER' ? 'Teacher' : 'Student'} {isLogin ? 'Login' : 'Sign Up'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-field"
                required
              />
            </div>
            
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                
                {userType === 'STUDENT' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                      <select
                        value={formData.academicLevel}
                        onChange={(e) => setFormData({...formData, academicLevel: e.target.value, grade: ''})}
                        className="input-field"
                        required
                      >
                        <option value="">Select Academic Level</option>
                        <option value="Primary">Primary School</option>
                        <option value="Middle">Middle School</option>
                        <option value="High">High School</option>
                      </select>
                    </div>
                    
                    {formData.academicLevel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                        <select
                          value={formData.grade}
                          onChange={(e) => setFormData({...formData, grade: e.target.value})}
                          className="input-field"
                          required
                        >
                          <option value="">Select Grade</option>
                          {formData.academicLevel === 'Primary' && [
                            <option key="1" value="Grade 1">Grade 1</option>,
                            <option key="2" value="Grade 2">Grade 2</option>,
                            <option key="3" value="Grade 3">Grade 3</option>,
                            <option key="4" value="Grade 4">Grade 4</option>,
                            <option key="5" value="Grade 5">Grade 5</option>
                          ]}
                          {formData.academicLevel === 'Middle' && [
                            <option key="6" value="Grade 6">Grade 6</option>,
                            <option key="7" value="Grade 7">Grade 7</option>,
                            <option key="8" value="Grade 8">Grade 8</option>
                          ]}
                          {formData.academicLevel === 'High' && [
                            <option key="9" value="Grade 9">Grade 9</option>,
                            <option key="10" value="Grade 10">Grade 10</option>,
                            <option key="11" value="Grade 11">Grade 11</option>,
                            <option key="12" value="Grade 12">Grade 12</option>
                          ]}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
            >
              {isLogin ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
