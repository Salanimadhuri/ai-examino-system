import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExamInterface from './ExamInterface';

const StudentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('exams');
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    if (results.length >= 0) {
      loadExams();
    }
  }, [results]);

  const startExam = (examId) => {
    setActiveExam(examId);
  };

  const completeExam = () => {
    setActiveExam(null);
    setActiveTab('results');
    loadResults();
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/api/student/available-exams?studentId=${user.userId}`);
      const completedExamIds = results.map(r => r.examId);
      // Filter out AI correction exams and completed exams
      const availableExams = response.data.filter(exam => 
        !completedExamIds.includes(exam.examId) && 
        exam.description !== "AI Corrected Exam"
      );
      setExams(availableExams);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/student/results/' + user.userId);
      setResults(response.data);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  if (activeExam) {
    return <ExamInterface examId={activeExam} onComplete={completeExam} user={user} />;
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="card p-1.5">
        <nav className="flex space-x-1.5">
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeTab === 'exams' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Available Exams
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeTab === 'results' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            My Results
          </button>
        </nav>
      </div>

      {/* Available Exams Tab */}
      {activeTab === 'exams' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Available Exams</h2>
            <p className="text-gray-600">Select an exam to begin your assessment</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Loading exams...</span>
              </div>
            </div>
          ) : exams.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <div key={exam.examId} className="card card-hover group">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center transition-colors duration-200">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{exam.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{exam.duration} min</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{exam.questions?.length || 0} questions</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startExam(exam.examId)}
                      className="w-full btn-primary"
                    >
                      Start Exam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams available</h3>
              <p className="text-gray-500">Check back later for new exams</p>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="card">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-3xl font-semibold text-gray-900">Exam Results</h2>
            <p className="text-gray-600 mt-1">View your completed exam results and performance</p>
          </div>
          
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Exam Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => {
                    const [totalQ, answeredQ, examTitle] = result.extractedText.split('|');
                    const getGradeColor = (score) => {
                      if (score >= 90) return 'bg-green-100 text-green-800';
                      if (score >= 80) return 'bg-blue-100 text-blue-800';
                      if (score >= 70) return 'bg-yellow-100 text-yellow-800';
                      if (score >= 60) return 'bg-orange-100 text-orange-800';
                      return 'bg-red-100 text-red-800';
                    };
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{examTitle || 'Exam'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-2xl font-semibold text-primary-600">{result.score}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.score)}`}>
                            {result.feedback}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exam results yet</h3>
              <p className="text-gray-500">Complete an exam to see your results here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;