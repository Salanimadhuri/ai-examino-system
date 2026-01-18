import React, { useState } from 'react';

const ExamUpload = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [examFile, setExamFile] = useState(null);
  const [studentFiles, setStudentFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [gradingScale, setGradingScale] = useState({
    excellent: 90,
    veryGood: 80,
    good: 70,
    satisfactory: 60,
    pass: 50
  });
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');

  const steps = [
    'Select academic level',
    'Import your exam paper',
    'Upload student papers',
    'Confirm grading scale'
  ];

  const gradeOptions = {
    'Primary Education': ['1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade'],
    'Middle School': ['6th grade', '7th grade', '8th grade', '9th grade'],
    'High School': ['10th grade', '11th grade', '12th grade']
  };

  const handleGradeSelect = (level, grade) => {
    setSelectedLevel(level);
    setSelectedGrade(grade);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (type === 'exam') {
      setExamFile(files[0]);
    } else {
      setStudentFiles([...studentFiles, ...files]);
    }
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'exam') {
      setExamFile(files[0]);
    } else {
      setStudentFiles([...studentFiles, ...files]);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !selectedGrade) {
      alert('Please select a grade level');
      return;
    }
    if (currentStep === 2 && !examFile) {
      alert('Please upload exam paper');
      return;
    }
    if (currentStep === 3 && studentFiles.length === 0) {
      alert('Please upload at least one student paper');
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCreateExam = async () => {
    if (!examTitle.trim()) {
      alert('Please enter exam title');
      return;
    }
    
    const examData = {
      teacherId: localStorage.getItem('userId'),
      title: examTitle,
      description: examDescription,
      academicLevel: selectedLevel,
      grade: selectedGrade,
      duration: 60,
      gradingScale: JSON.stringify(gradingScale),
      questions: []
    };

    try {
      const response = await fetch('http://localhost:8080/api/teacher/create-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
      });
      
      if (response.ok) {
        alert('Exam created successfully!');
        window.location.reload();
      } else {
        alert('Failed to create exam');
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Error creating exam');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-green-800 rounded-2xl m-6 p-8 shadow-lg">
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index + 1 === currentStep 
                  ? 'bg-white text-green-800 font-bold' 
                  : index + 1 < currentStep 
                    ? 'bg-green-600 text-white'
                    : 'bg-green-700 text-green-300'
              }`}>
                {index + 1 < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-sm ${
                index + 1 === currentStep ? 'text-white font-medium' : 'text-green-200'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
        
        <button 
          onClick={nextStep}
          disabled={(currentStep === 1 && !selectedGrade) || (currentStep === 2 && !examFile) || (currentStep === 3 && studentFiles.length === 0)}
          className="w-full mt-12 bg-white text-green-800 py-4 px-6 rounded-2xl font-semibold hover:bg-green-50 transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Étape suivante
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12">
        {currentStep === 1 && (
          <div className="max-w-2xl">
            <p className="text-green-700 text-sm mb-2">Upload a new exam</p>
            <h1 className="text-4xl font-serif text-gray-900 mb-12">Select teaching level</h1>
            
            <div className="space-y-6">
              {Object.entries(gradeOptions).map(([level, grades]) => (
                <div key={level} className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">{level}</h3>
                  <div className="flex flex-wrap gap-3">
                    {grades.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => handleGradeSelect(level, grade)}
                        className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                          selectedGrade === grade && selectedLevel === level
                            ? 'bg-green-800 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-2xl">
            <p className="text-green-700 text-sm mb-2">Step 2 of 4</p>
            <h1 className="text-4xl font-serif text-gray-900 mb-12">Import your exam paper</h1>
            <div className="bg-white rounded-2xl p-12 shadow-sm">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'exam')}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              >
                <input 
                  type="file" 
                  id="examFile" 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(e, 'exam')}
                />
                {examFile ? (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-700 font-medium">{examFile.name}</p>
                    <button onClick={() => setExamFile(null)} className="text-red-600 text-sm mt-2">Remove</button>
                  </div>
                ) : (
                  <label htmlFor="examFile" className="cursor-pointer">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-500">Drag and drop your exam paper here or click to browse</p>
                    <p className="text-gray-400 text-sm mt-2">PDF, JPG, PNG supported</p>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-2xl">
            <p className="text-green-700 text-sm mb-2">Step 3 of 4</p>
            <h1 className="text-4xl font-serif text-gray-900 mb-12">Upload student papers</h1>
            <div className="bg-white rounded-2xl p-12 shadow-sm">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'student')}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              >
                <input 
                  type="file" 
                  id="studentFiles" 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'student')}
                />
                {studentFiles.length > 0 ? (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-700 font-medium">{studentFiles.length} file(s) uploaded</p>
                    <button onClick={() => setStudentFiles([])} className="text-red-600 text-sm mt-2">Remove all</button>
                  </div>
                ) : (
                  <label htmlFor="studentFiles" className="cursor-pointer">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-500">Drag and drop student answer sheets or click to browse</p>
                    <p className="text-gray-400 text-sm mt-2">Multiple files supported</p>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="max-w-2xl">
            <p className="text-green-700 text-sm mb-2">Step 4 of 4</p>
            <h1 className="text-4xl font-serif text-gray-900 mb-12">Confirm grading scale</h1>
            <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter exam title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Enter exam description"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Grading Scale Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-800 font-bold">A+</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Excellent</p>
                        <p className="text-sm text-gray-500">Outstanding performance</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={gradingScale.excellent}
                        onChange={(e) => setGradingScale({...gradingScale, excellent: parseInt(e.target.value)})}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-600">- 100%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-800 font-bold">A</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Very Good</p>
                        <p className="text-sm text-gray-500">Above average work</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={gradingScale.veryGood}
                        onChange={(e) => setGradingScale({...gradingScale, veryGood: parseInt(e.target.value)})}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-600">- {gradingScale.excellent - 1}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-800 font-bold">B</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Good</p>
                        <p className="text-sm text-gray-500">Satisfactory performance</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={gradingScale.good}
                        onChange={(e) => setGradingScale({...gradingScale, good: parseInt(e.target.value)})}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-600">- {gradingScale.veryGood - 1}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-800 font-bold">C</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Satisfactory</p>
                        <p className="text-sm text-gray-500">Meets requirements</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={gradingScale.satisfactory}
                        onChange={(e) => setGradingScale({...gradingScale, satisfactory: parseInt(e.target.value)})}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-600">- {gradingScale.good - 1}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-800 font-bold">D</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pass</p>
                        <p className="text-sm text-gray-500">Minimum passing grade</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={gradingScale.pass}
                        onChange={(e) => setGradingScale({...gradingScale, pass: parseInt(e.target.value)})}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-600">- {gradingScale.satisfactory - 1}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-800 font-bold">F</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Fail</p>
                        <p className="text-sm text-gray-500">Below passing grade</p>
                      </div>
                    </div>
                    <div className="text-gray-600">
                      0 - {gradingScale.pass - 1}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Academic Level:</span> {selectedLevel}</p>
                  <p><span className="font-medium">Grade:</span> {selectedGrade}</p>
                  <p><span className="font-medium">Question Paper:</span> {examFile ? examFile.name : 'Not uploaded'}</p>
                  <p><span className="font-medium">Student Papers:</span> {studentFiles.length} file(s)</p>
                </div>
              </div>

              <button
                onClick={handleCreateExam}
                disabled={!examTitle.trim()}
                className="w-full bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Exam
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamUpload;