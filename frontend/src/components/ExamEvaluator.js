import React, { useState } from 'react';
import axios from 'axios';

const ExamEvaluator = () => {
  const [file, setFile] = useState(null);
  const [rubric, setRubric] = useState('');
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultRubric = JSON.stringify({
    "question": "What is photosynthesis?",
    "maxScore": 100,
    "criteria": [
      "Definition of photosynthesis (25 points)",
      "Mention of chlorophyll (25 points)",
      "Light and carbon dioxide process (25 points)",
      "Production of glucose and oxygen (25 points)"
    ]
  }, null, 2);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a PNG or JPEG image file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an exam scan image');
      return;
    }

    if (!rubric.trim()) {
      setError('Please provide a grading rubric');
      return;
    }

    try {
      JSON.parse(rubric);
    } catch (err) {
      setError('Please provide a valid JSON rubric');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rubric', rubric);
    if (studentId.trim()) {
      formData.append('studentId', studentId);
    }

    try {
      const response = await axios.post('http://localhost:8080/api/evaluate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error evaluating exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setRubric('');
    setStudentId('');
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Upload Exam Scan
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID (Optional)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter student ID or leave blank for auto-generation"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Scan Image *
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Rubric Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grading Rubric (JSON) *
              </label>
              <textarea
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder={defaultRubric}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                rows="10"
                required
              />
              <button
                type="button"
                onClick={() => setRubric(defaultRubric)}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Use sample rubric
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Evaluating...' : 'Evaluate Exam'}
            </button>
          </form>
        </div>

        {/* Right Panel - Results */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Evaluation Results
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="ml-4 text-gray-600">Processing exam scan...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Score</h3>
                  <span className={`text-3xl font-bold ${
                    result.score >= 70 ? 'text-green-600' : 
                    result.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.score}/100
                  </span>
                </div>
              </div>

              {/* Student ID */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Student ID</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md font-mono">
                  {result.studentId}
                </p>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Feedback</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-blue-800 whitespace-pre-wrap">{result.feedback}</p>
                </div>
              </div>

              {/* Extracted Text */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Extracted Text</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-40 overflow-y-auto">
                  <p className="text-gray-700 text-sm font-mono whitespace-pre-wrap">
                    {result.extractedText || 'No text extracted'}
                  </p>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetForm}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Evaluate Another Exam
              </button>
            </div>
          )}

          {!loading && !result && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">Upload an exam scan to see evaluation results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamEvaluator;