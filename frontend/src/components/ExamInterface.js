import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExamInterface = ({ examId, onComplete, user }) => {
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8080/api/student/exam/${examId}`);
      setExam(response.data);
      setTimeLeft(response.data.duration * 60);
    } catch (error) {
      console.error('Error fetching exam:', error);
      // Fallback to mock data
      const mockExam = {
        examId,
        title: 'Sample Exam',
        duration: 60,
        questions: [
          { questionId: '1', questionText: 'What is 2 + 2?', type: 'MCQ', marks: 5 },
          { questionId: '2', questionText: 'What is the capital of France?', type: 'MCQ', marks: 5 },
          { questionId: '3', questionText: 'What is 10 * 5?', type: 'MCQ', marks: 5 }
        ]
      };
      setExam(mockExam);
      setTimeLeft(mockExam.duration * 60);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      submitExam();
    }
  }, [timeLeft]);

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const submitExam = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post('http://localhost:8080/api/student/submit-exam', {
        studentId: user.userId,
        examId,
        answers
      });
      alert(`Exam submitted! Score: ${response.data.score}%`);
      onComplete();
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Error submitting exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return 'text-red-600 bg-red-50 border-red-200'; // 5 minutes
    if (timeLeft <= 600) return 'text-orange-600 bg-orange-50 border-orange-200'; // 10 minutes
    return 'text-primary-600 bg-primary-50 border-primary-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading exam...</h3>
          <p className="text-gray-600">Please wait while we prepare your exam</p>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Question {currentQuestion + 1} of {exam.questions.length} • {answeredCount} answered
              </p>
            </div>
            <div className={`px-4 py-2 rounded-xl border font-mono text-lg font-semibold ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-32">
              <h3 className="font-medium text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {exam.questions.map((_, index) => {
                  const isAnswered = answers[exam.questions[index].questionId];
                  const isCurrent = currentQuestion === index;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isCurrent
                          ? 'bg-primary-600 text-white shadow-sm'
                          : isAnswered
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Answered:</span>
                    <span className="font-medium">{answeredCount}/{exam.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">{exam.questions.length - answeredCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="card p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    Question {currentQuestion + 1}
                  </span>
                  <span className="text-sm text-gray-500">
                    {exam.questions[currentQuestion]?.marks || 0} marks
                  </span>
                </div>
                <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                  {exam.questions[currentQuestion]?.questionText || 'Loading question...'}
                </h2>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Answer:
                </label>
                <textarea
                  value={answers[exam.questions[currentQuestion]?.questionId] || ''}
                  onChange={(e) => handleAnswer(exam.questions[currentQuestion]?.questionId, e.target.value)}
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-none"
                  placeholder="Type your answer here..."
                />
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex space-x-3">
                  {currentQuestion === exam.questions.length - 1 ? (
                    <button
                      onClick={submitExam}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </div>
                      ) : (
                        'Submit Exam'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                      className="btn-primary"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;