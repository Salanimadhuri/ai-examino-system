import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
    academicLevel: '',
    grade: '',
    questions: []
  });
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    expectedAnswer: '',
    marks: 10
  });
  const [aiCorrectionForm, setAiCorrectionForm] = useState({
    title: '',
    academicLevel: '',
    grade: '',
    examPaper: null,
    answerSheets: [],
    gradingScale: { A: 90, B: 80, C: 70, D: 60, F: 0 },
    feedbackStyle: '',
    assessmentLanguage: 'English'
  });
  const [correctionResults, setCorrectionResults] = useState([]);
  const [studentPapers, setStudentPapers] = useState([{ id: 1, file: null, grade: '' }]);
  const [aiCorrectionHistory, setAiCorrectionHistory] = useState([]);
  const [credits, setCredits] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStep, setAiStep] = useState(1);
  const [selectedExamResults, setSelectedExamResults] = useState(null);
  const [examResults, setExamResults] = useState([]);

  useEffect(() => {
    loadExams();
    loadAiCorrectionHistory();
  }, [user.userId]);

  const loadAiCorrectionHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/teacher/exams/' + user.userId);
      // Get only AI correction exams for history
      const aiExams = response.data.filter(exam => exam.description === "AI Corrected Exam");
      setAiCorrectionHistory(aiExams);
    } catch (error) {
      console.error('Error loading AI correction history:', error);
    }
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/teacher/exams/' + user.userId);
      // Filter out AI correction exams from My Exams tab
      const regularExams = response.data.filter(exam => exam.description !== "AI Corrected Exam");
      setExams(regularExams);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('http://localhost:8080/api/teacher/create-exam', {
        ...examForm,
        teacherId: user.userId
      });
      setExamForm({ title: '', description: '', duration: 60, academicLevel: '', grade: '', questions: [] });
      loadExams();
      alert('Exam created successfully!');
    } catch (error) {
      alert('Error creating exam');
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await axios.delete(`http://localhost:8080/api/teacher/delete-exam/${examId}`);
        loadExams();
        alert('Exam deleted successfully!');
      } catch (error) {
        alert('Error deleting exam');
      }
    }
  };

  const loadExamResults = async (examId, isAiCorrection = false) => {
    try {
      console.log('Loading results for examId:', examId, 'isAiCorrection:', isAiCorrection);
      const response = await axios.get(`http://localhost:8080/api/teacher/results/${examId}`);
      console.log('API response:', response.data);
      
      if (response.data.length === 0) {
        if (isAiCorrection) {
          alert('No AI correction results found for this exam.');
        } else {
          alert('No student submissions found for this exam yet.');
        }
        return;
      }
      
      const resultsWithNames = await Promise.all(response.data.map(async (result) => {
        try {
          // For AI corrections, the studentId might be synthetic or the student name might be in extractedText
          if (isAiCorrection && result.extractedText) {
            const parts = result.extractedText.split('|');
            const studentName = parts[2] || `Student ${result.studentId}`;
            return { ...result, studentName };
          } else {
            const userResponse = await axios.get(`http://localhost:8080/api/auth/user/${result.studentId}`);
            return { ...result, studentName: userResponse.data.fullName || userResponse.data.username };
          }
        } catch (error) {
          return { ...result, studentName: isAiCorrection ? `Student ${result.studentId}` : 'Unknown Student' };
        }
      }));
      setExamResults(resultsWithNames);
      setSelectedExamResults(examId);
    } catch (error) {
      console.error('Error loading results:', error);
      if (error.response?.status === 404) {
        alert('No results found for this exam');
      } else {
        alert('Error loading exam results. Please try again.');
      }
    }
  };

  const closeResultsModal = () => {
    setSelectedExamResults(null);
    setExamResults([]);
  };

  const addQuestion = () => {
    if (newQuestion.questionText && newQuestion.expectedAnswer) {
      setExamForm({
        ...examForm,
        questions: [...examForm.questions, { ...newQuestion, questionId: Date.now().toString(), type: 'TEXT' }]
      });
      setNewQuestion({ questionText: '', expectedAnswer: '', marks: 10 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="card p-1.5">
        <nav className="flex space-x-1.5">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeTab === 'create' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Create Exam
          </button>
          <button
            onClick={() => setActiveTab('ai-correction')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeTab === 'ai-correction' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            AI Exam Correction
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
              activeTab === 'exams' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            My Exams
          </button>
        </nav>
      </div>

      {/* Create Exam Tab */}
      {activeTab === 'create' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create New Exam</h2>
            <p className="text-gray-600">Set up a new exam with questions and grading criteria</p>
          </div>
          
          <form onSubmit={handleCreateExam} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                <input
                  type="text"
                  placeholder="Enter exam title"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={examForm.duration}
                  onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                <select
                  value={examForm.academicLevel}
                  onChange={(e) => setExamForm({ ...examForm, academicLevel: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Academic Level</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Higher Secondary">Higher Secondary</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade/Year</label>
                <select
                  value={examForm.grade}
                  onChange={(e) => setExamForm({ ...examForm, grade: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Grade/Year</option>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter exam description"
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                className="input-field"
                rows="3"
              />
            </div>

            {/* Add Questions Section */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-medium text-gray-900 mb-6">Add Questions</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                    <input
                      type="text"
                      placeholder="Enter question text"
                      value={newQuestion.questionText}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newQuestion.marks}
                      onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Answer</label>
                  <textarea
                    placeholder="Enter expected answer"
                    value={newQuestion.expectedAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                    className="input-field"
                    rows="2"
                  />
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="btn-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            {examForm.questions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Questions ({examForm.questions.length}):</h4>
                <div className="space-y-3">
                  {examForm.questions.map((q, index) => (
                    <div key={index} className="flex justify-between items-start bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{q.questionText}</p>
                        <p className="text-sm text-gray-600">Marks: {q.marks}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = examForm.questions.filter((_, i) => i !== index);
                          setExamForm({ ...examForm, questions: updated });
                        }}
                        className="text-red-600 hover:text-red-800 font-medium ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={examForm.questions.length === 0 || loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Exam...
                </div>
              ) : (
                'Create Exam'
              )}
            </button>
          </form>
        </div>
      )}

      {/* AI Correction Tab */}
      {activeTab === 'ai-correction' && (
        <div className="min-h-screen bg-gray-50 flex">
          {/* Left Sidebar */}
          <div className="w-80 bg-primary-800 rounded-2xl m-6 p-8 shadow-lg">
            <div className="mb-8">
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Remaining Credits</p>
                <p className="text-3xl font-semibold text-primary-800">{credits}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {['Exam details', 'Upload exam paper', 'Upload answer sheets', 'Configure feedback & grading'].map((step, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    idx + 1 === aiStep 
                      ? 'bg-white text-primary-800 font-semibold' 
                      : idx + 1 < aiStep 
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-700 text-primary-300'
                  }`}>
                    {idx + 1 < aiStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-sm ${
                    idx + 1 === aiStep ? 'text-white font-medium' : 'text-primary-200'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (aiStep === 1 && (!aiCorrectionForm.title || !aiCorrectionForm.academicLevel || !aiCorrectionForm.grade)) {
                  alert('Please fill all exam details');
                  return;
                }
                if (aiStep === 2 && !aiCorrectionForm.examPaper) {
                  alert('Please upload exam paper');
                  return;
                }
                if (aiStep === 3 && aiCorrectionForm.answerSheets.length === 0) {
                  alert('Please upload answer sheets');
                  return;
                }
                if (aiStep === 4 && (!aiCorrectionForm.feedbackStyle || !aiCorrectionForm.assessmentLanguage)) {
                  alert('Please select feedback style and assessment language');
                  return;
                }
                if (aiStep < 4) {
                  setAiStep(aiStep + 1);
                } else {
                  setIsProcessing(true);
                  const formData = new FormData();
                  formData.append('teacherId', user.userId);
                  formData.append('title', aiCorrectionForm.title);
                  formData.append('academicLevel', aiCorrectionForm.academicLevel);
                  formData.append('grade', aiCorrectionForm.grade);
                  formData.append('examPaper', aiCorrectionForm.examPaper);
                  aiCorrectionForm.answerSheets.forEach(file => formData.append('answerSheets', file));
                  formData.append('gradingScale', JSON.stringify(aiCorrectionForm.gradingScale));
                  formData.append('feedbackStyle', aiCorrectionForm.feedbackStyle);
                  formData.append('assessmentLanguage', aiCorrectionForm.assessmentLanguage);
                  
                  axios.post('http://localhost:8080/api/teacher/ai-correct-exam', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  }).then(response => {
                    setCorrectionResults(response.data.results);
                    setCredits(response.data.remainingCredits);
                    loadExams();
                    alert('Exam correction completed and exam created!');
                  }).catch(error => {
                    alert('Error processing exam: ' + error.message);
                  }).finally(() => {
                    setIsProcessing(false);
                  });
                }
              }}
              disabled={isProcessing || 
                (aiStep === 1 && (!aiCorrectionForm.title || !aiCorrectionForm.academicLevel || !aiCorrectionForm.grade)) ||
                (aiStep === 2 && !aiCorrectionForm.examPaper) ||
                (aiStep === 3 && aiCorrectionForm.answerSheets.length === 0) ||
                (aiStep === 4 && (!aiCorrectionForm.feedbackStyle || !aiCorrectionForm.assessmentLanguage))}
              className="w-full mt-12 bg-white text-primary-800 py-4 px-6 rounded-2xl font-semibold hover:bg-gray-50 transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                aiStep === 4 ? 'Confirm Grading Scale & Start AI Correction' : 'Next Step'
              )}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-12">
            <div className="mb-8">
              <p className="text-primary-600 text-sm font-medium mb-2">Step {aiStep} of 4</p>
              <h1 className="text-4xl font-semibold text-gray-900 mb-4">
                {aiStep === 1 ? 'Enter exam details' :
                 aiStep === 2 ? 'Upload exam paper' :
                 aiStep === 3 ? 'Upload student answer sheets' :
                 'Configure feedback and grading'}
              </h1>
              <p className="text-gray-600">
                {aiStep === 1 ? 'Provide basic information about your exam' :
                 aiStep === 2 ? 'Upload the question paper for AI analysis' :
                 aiStep === 3 ? 'Upload student answer sheets for correction' :
                 'Choose feedback style, language, and set grading criteria'}
              </p>
            </div>

            <div className="space-y-6">
              {/* Step 1: Exam Details */}
              {aiStep === 1 && (
                <div className="card p-8">
                  <h3 className="text-xl font-medium text-gray-900 mb-6">Exam Details</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                      <input
                        type="text"
                        placeholder="Enter exam title"
                        value={aiCorrectionForm.title}
                        onChange={(e) => setAiCorrectionForm({ ...aiCorrectionForm, title: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                        <select
                          value={aiCorrectionForm.academicLevel}
                          onChange={(e) => setAiCorrectionForm({ ...aiCorrectionForm, academicLevel: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Select Level</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Higher Secondary">Higher Secondary</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Postgraduate">Postgraduate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade/Year</label>
                        <select
                          value={aiCorrectionForm.grade}
                          onChange={(e) => setAiCorrectionForm({ ...aiCorrectionForm, grade: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Select Grade</option>
                          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Upload Exam Paper */}
              {aiStep === 2 && (
                <div className="card p-8">
                  <h3 className="text-xl font-medium text-gray-900 mb-6">Upload Exam Paper</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      id="examPaperUpload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setAiCorrectionForm({ ...aiCorrectionForm, examPaper: e.target.files[0] })}
                    />
                    {aiCorrectionForm.examPaper ? (
                      <div>
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">{aiCorrectionForm.examPaper.name}</p>
                        <button 
                          onClick={() => setAiCorrectionForm({ ...aiCorrectionForm, examPaper: null })} 
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="examPaperUpload" className="cursor-pointer">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-gray-700 font-medium mb-2">Drag and drop your exam paper or click to browse</p>
                        <p className="text-gray-500 text-sm">PDF, JPG, PNG supported</p>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Upload Answer Sheets */}
              {aiStep === 3 && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="card p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-medium text-gray-900">Upload student papers</h3>
                      <div className="flex space-x-3">
                        <button className="btn-secondary text-sm">Validate copies</button>
                        <button 
                          onClick={() => setStudentPapers([...studentPapers, { id: Date.now(), file: null, grade: aiCorrectionForm.grade }])}
                          className="btn-primary text-sm"
                        >
                          Add student papers
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600">Upload papers for grading</p>
                  </div>

                  {/* Student Papers List */}
                  <div className="space-y-4">
                    {studentPapers.map((paper, index) => (
                      <div key={paper.id} className="card p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-900">Paper #{index + 1}</h4>
                          {studentPapers.length > 1 && (
                            <button 
                              onClick={() => setStudentPapers(studentPapers.filter(p => p.id !== paper.id))}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                            <input
                              type="text"
                              value={paper.grade || aiCorrectionForm.grade}
                              onChange={(e) => {
                                const updated = studentPapers.map(p => 
                                  p.id === paper.id ? { ...p, grade: e.target.value } : p
                                );
                                setStudentPapers(updated);
                              }}
                              className="input-field"
                              placeholder="7th grade"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Status</label>
                            <p className="text-sm text-gray-500 py-2">
                              {paper.file ? `File: ${paper.file.name}` : 'No file uploaded'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                            <input
                              type="file"
                              id={`paperUpload-${paper.id}`}
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const updated = studentPapers.map(p => 
                                    p.id === paper.id ? { ...p, file } : p
                                  );
                                  setStudentPapers(updated);
                                  // Update aiCorrectionForm.answerSheets
                                  const allFiles = updated.filter(p => p.file).map(p => p.file);
                                  setAiCorrectionForm({ ...aiCorrectionForm, answerSheets: allFiles });
                                }
                              }}
                            />
                            
                            {paper.file ? (
                              <div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-2">{paper.file.name}</p>
                                <button 
                                  onClick={() => {
                                    const updated = studentPapers.map(p => 
                                      p.id === paper.id ? { ...p, file: null } : p
                                    );
                                    setStudentPapers(updated);
                                    const allFiles = updated.filter(p => p.file).map(p => p.file);
                                    setAiCorrectionForm({ ...aiCorrectionForm, answerSheets: allFiles });
                                  }}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove file
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">No file chosen</p>
                                <div className="flex flex-col items-center space-y-3">
                                  <button
                                    onClick={() => document.getElementById(`paperUpload-${paper.id}`).click()}
                                    className="btn-primary text-sm"
                                  >
                                    Add a file to the paper
                                  </button>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <span>or</span>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Use your phone</p>
                                    <p className="text-xs text-gray-500">To scan your documents</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Paper Button */}
                  <div className="text-center">
                    <button 
                      onClick={() => setStudentPapers([...studentPapers, { id: Date.now(), file: null, grade: aiCorrectionForm.grade }])}
                      className="btn-secondary"
                    >
                      Add a paper
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Feedback Style, Language & Grading Scale */}
              {aiStep === 4 && (
                <div className="space-y-8">
                  {/* Choose Feedback Style */}
                  <div className="card p-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-6">Choose a feedback style</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'detailed', name: 'Detailed', desc: 'Comprehensive feedback with explanations' },
                        { id: 'concise', name: 'Concise', desc: 'Brief and to-the-point feedback' },
                        { id: 'encouraging', name: 'Encouraging', desc: 'Positive and motivational feedback' }
                      ].map((style) => (
                        <div
                          key={style.id}
                          onClick={() => setAiCorrectionForm({ ...aiCorrectionForm, feedbackStyle: style.id })}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            aiCorrectionForm.feedbackStyle === style.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <h4 className="font-medium text-gray-900 mb-2">{style.name}</h4>
                          <p className="text-sm text-gray-600">{style.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Language of Assessment */}
                  <div className="card p-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-6">Language of assessment</h3>
                    <select
                      value={aiCorrectionForm.assessmentLanguage}
                      onChange={(e) => setAiCorrectionForm({ ...aiCorrectionForm, assessmentLanguage: e.target.value })}
                      className="input-field max-w-xs"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>

                  {/* Confirm Exam Grading Scale */}
                  <div className="card p-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-6">Confirm exam grading scale</h3>
                    <div className="space-y-4">
                      {Object.entries(aiCorrectionForm.gradingScale).map(([grade, threshold]) => (
                        <div key={grade} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              grade === 'A' ? 'bg-green-100' :
                              grade === 'B' ? 'bg-blue-100' :
                              grade === 'C' ? 'bg-yellow-100' :
                              grade === 'D' ? 'bg-orange-100' : 'bg-red-100'
                            }`}>
                              <span className={`font-semibold ${
                                grade === 'A' ? 'text-green-700' :
                                grade === 'B' ? 'text-blue-700' :
                                grade === 'C' ? 'text-yellow-700' :
                                grade === 'D' ? 'text-orange-700' : 'text-red-700'
                              }`}>{grade}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {grade === 'A' ? 'Excellent' : 
                                 grade === 'B' ? 'Very Good' : 
                                 grade === 'C' ? 'Good' : 
                                 grade === 'D' ? 'Satisfactory' : 'Fail'}
                              </p>
                              <p className="text-sm text-gray-600">Grade {grade}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={threshold}
                              onChange={(e) => setAiCorrectionForm({
                                ...aiCorrectionForm,
                                gradingScale: { ...aiCorrectionForm.gradingScale, [grade]: parseInt(e.target.value) }
                              })}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              max="100"
                            />
                            <span className="text-gray-600 font-medium">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setIsProcessing(true);
                          const formData = new FormData();
                          formData.append('teacherId', user.userId);
                          formData.append('title', aiCorrectionForm.title);
                          formData.append('academicLevel', aiCorrectionForm.academicLevel);
                          formData.append('grade', aiCorrectionForm.grade);
                          formData.append('examPaper', aiCorrectionForm.examPaper);
                          aiCorrectionForm.answerSheets.forEach(file => formData.append('answerSheets', file));
                          formData.append('gradingScale', JSON.stringify(aiCorrectionForm.gradingScale));
                          formData.append('feedbackStyle', aiCorrectionForm.feedbackStyle);
                          formData.append('assessmentLanguage', aiCorrectionForm.assessmentLanguage);
                          
                          axios.post('http://localhost:8080/api/teacher/ai-correct-exam', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          }).then(response => {
                            setCorrectionResults(response.data.results);
                            setCredits(response.data.remainingCredits);
                            loadExams();
                            loadAiCorrectionHistory();
                            alert('Exam correction completed and exam created!');
                          }).catch(error => {
                            alert('Error processing exam: ' + error.message);
                          }).finally(() => {
                            setIsProcessing(false);
                          });
                        }}
                        disabled={isProcessing || !aiCorrectionForm.feedbackStyle || !aiCorrectionForm.assessmentLanguage}
                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing AI Correction...
                          </div>
                        ) : (
                          'Confirm Grading Scale & Start AI Correction'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Correction History */}
              {aiCorrectionHistory.length > 0 && (
                <div className="card p-8">
                  <h3 className="text-xl font-medium text-gray-900 mb-6">AI Correction History</h3>
                  <div className="space-y-4">
                    {aiCorrectionHistory.map((exam) => (
                      <div key={exam.examId} className="card card-hover p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-900 mb-2">{exam.title}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Level:</span>
                                <span className="ml-2 font-medium">{exam.academicLevel}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Grade:</span>
                                <span className="ml-2 font-medium">{exam.grade}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <span className="ml-2 font-medium">{new Date(exam.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Questions:</span>
                                <span className="ml-2 font-medium">{exam.questions?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-6 flex space-x-2">
                            <button 
                              onClick={() => {
                                console.log('View Results clicked for exam:', exam.examId);
                                // Check if we have temporary correction results for this exam
                                if (correctionResults.length > 0 && exam.title) {
                                  // Use temporary results if available
                                  const tempResults = correctionResults.map((result, idx) => ({
                                    studentName: result.studentName || `Student ${idx + 1}`,
                                    score: result.score,
                                    grade: result.grade,
                                    feedback: result.grade === 'A' ? 'Excellent' : 
                                             result.grade === 'B' ? 'Very Good' : 
                                             result.grade === 'C' ? 'Good' : 
                                             result.grade === 'D' ? 'Satisfactory' : 'Needs Improvement'
                                  }));
                                  setExamResults(tempResults);
                                  setSelectedExamResults(exam.examId);
                                } else {
                                  // Try to load from database
                                  loadExamResults(exam.examId, true);
                                }
                              }}
                              className="btn-primary text-sm"
                            >
                              View Results
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this AI correction?')) {
                                  deleteExam(exam.examId);
                                  loadAiCorrectionHistory(); // Refresh the AI correction history
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded-lg transition-colors duration-200 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {correctionResults.length > 0 && (
                <div className="card p-8">
                  <h3 className="text-xl font-medium text-gray-900 mb-6">Correction Results</h3>
                  <div className="space-y-3">
                    {correctionResults.map((result, idx) => (
                      <div key={idx} className="card card-hover p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{result.studentName || `Student ${idx + 1}`}</p>
                          <p className="text-sm text-gray-600">Score: {result.score}% - Grade: {result.grade}</p>
                        </div>
                        <button 
                          onClick={() => {
                            // Create a mock exam result for the modal
                            const mockResult = {
                              studentName: result.studentName || `Student ${idx + 1}`,
                              score: result.score,
                              grade: result.grade,
                              feedback: result.grade === 'A' ? 'Excellent' : 
                                       result.grade === 'B' ? 'Very Good' : 
                                       result.grade === 'C' ? 'Good' : 
                                       result.grade === 'D' ? 'Satisfactory' : 'Needs Improvement'
                            };
                            setExamResults([mockResult]);
                            setSelectedExamResults('temp-results');
                          }}
                          className="btn-secondary"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Exams Tab */}
      {activeTab === 'exams' && (
        <div className="card p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Exams</h2>
            <p className="text-gray-600">Manage your created exams and view student results</p>
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
            <div className="grid gap-6">
              {exams.map((exam) => (
                <div key={exam.examId} className="card card-hover p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-gray-900 mb-2">{exam.title}</h3>
                      <p className="text-gray-600 mb-4">{exam.description}</p>
                    </div>
                    <div className="ml-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {exam.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{exam.duration} min</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Level</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{exam.academicLevel}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grade</p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{exam.grade}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questions</p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{exam.questions ? exam.questions.length : 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Created on {new Date(exam.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => loadExamResults(exam.examId)}
                        className="btn-primary"
                      >
                        View Results
                      </button>
                      <button 
                        onClick={() => deleteExam(exam.examId)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exams created yet</h3>
              <p className="text-gray-500 mb-6">Create your first exam to get started</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="btn-primary"
              >
                Create Exam
              </button>
            </div>
          )}
          
          {/* Results Modal */}
          {selectedExamResults && examResults.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">Exam Results</h3>
                    <p className="text-gray-600 mt-1">Student performance overview</p>
                  </div>
                  <button 
                    onClick={closeResultsModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-auto max-h-[60vh]">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {examResults.map((result, idx) => {
                        const getGradeColor = (grade) => {
                          if (grade === 'A+' || grade === 'A') return 'bg-green-100 text-green-800';
                          if (grade === 'B') return 'bg-blue-100 text-blue-800';
                          if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
                          if (grade === 'D') return 'bg-orange-100 text-orange-800';
                          return 'bg-red-100 text-red-800';
                        };
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-primary-600">
                                    {(result.studentName || `Student ${idx + 1}`).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {result.studentName || `Student ${idx + 1}`}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-2xl font-semibold text-primary-600">{result.score}%</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                                {result.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {result.feedback}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Total submissions: {examResults.length}
                    </div>
                    <button 
                      onClick={closeResultsModal}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;