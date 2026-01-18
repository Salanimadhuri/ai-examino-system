# AI Examino System

A comprehensive exam management and AI-powered correction system built with Java Spring Boot and React.

## 🚀 Features

### For Teachers
- **Create Exams**: Design custom exams with multiple questions and grading criteria
- **AI Exam Correction**: Upload exam papers and student answer sheets for AI-powered grading
- **Student Management**: View student submissions and performance analytics
- **Flexible Grading**: Customizable grading scales and feedback styles
- **Multi-language Support**: Support for multiple assessment languages

### For Students
- **Take Exams**: Interactive exam interface with timer and question navigation
- **View Results**: Access detailed exam results and performance feedback
- **Profile Management**: Manage personal information and exam history

### AI Correction Features
- **Document Processing**: AWS Textract integration for text extraction from scanned papers
- **Intelligent Grading**: AWS Bedrock AI models for contextual answer evaluation
- **Multiple Feedback Styles**: Detailed, Concise, or Encouraging feedback options
- **Secure Storage**: AWS S3 integration for document storage
- **Real-time Processing**: Live progress tracking during AI correction

## 🛠️ Technology Stack

### Backend
- **Java 21**
- **Spring Boot 3**
- **Spring Data JPA**
- **MySQL Database**
- **AWS SDK v2** (S3, Textract, Bedrock)
- **Maven** for dependency management

### Frontend
- **React 18**
- **Tailwind CSS**
- **Axios** for API communication
- **React Router** for navigation

### Cloud Services
- **AWS S3** - Document storage
- **AWS Textract** - Text extraction from images/PDFs
- **AWS Bedrock** - AI-powered answer evaluation
- **AWS DynamoDB** - Session management

## 📋 Prerequisites

- Java 21 or higher
- Node.js 16+ and npm
- MySQL 8.0+
- AWS Account (for AI features)
- Maven 3.6+

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-examino-system.git
cd ai-examino-system
```

### 2. Database Setup
```sql
CREATE DATABASE examino_db;
```

### 3. Backend Configuration
Update `src/main/resources/application.properties`:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/examino_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# AWS Configuration
aws.region=your-aws-region
aws.s3.bucket-name=your-s3-bucket
```

### 4. AWS Setup
- Create an S3 bucket for document storage
- Configure AWS credentials (AWS CLI or environment variables)
- Enable Textract and Bedrock services in your AWS account

### 5. Backend Installation
```bash
# Install dependencies and run
mvn clean install
mvn spring-boot:run
```

### 6. Frontend Installation
```bash
cd frontend
npm install
npm start
```

## 🚀 Usage

### Starting the Application
1. **Backend**: Run `mvn spring-boot:run` (Port 8080)
2. **Frontend**: Run `npm start` in frontend directory (Port 3000)
3. **Access**: Open http://localhost:3000

### User Roles
- **Teachers**: Create exams, manage AI corrections, view analytics
- **Students**: Take exams, view results, manage profile

### AI Correction Workflow
1. **Exam Details**: Enter title, academic level, and grade
2. **Upload Exam Paper**: Upload question paper (PDF/Image)
3. **Upload Answer Sheets**: Upload student answer sheets
4. **Configure & Process**: Set feedback style, language, and grading scale
5. **View Results**: Review AI-generated scores and feedback

## 📁 Project Structure

```
ai-examino-system/
├── src/main/java/com/examino/ai/
│   ├── controller/          # REST API controllers
│   ├── service/            # Business logic services
│   ├── model/              # JPA entities
│   ├── repository/         # Data access layer
│   └── dto/                # Data transfer objects
├── src/main/resources/
│   └── application.properties
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── styles/         # CSS styles
│   └── public/
├── uploads/                # File storage directory
└── README.md
```

## 🎨 UI Features

- **Modern Design**: Clean, responsive interface with Tailwind CSS
- **Green Theme**: Professional green color scheme
- **Compact Layout**: Efficient use of screen space
- **Interactive Elements**: Hover effects and smooth transitions
- **Mobile Responsive**: Works on all device sizes

## 🔐 Security Features

- **Role-based Access Control**: Separate interfaces for teachers and students
- **Secure File Upload**: Validation and secure storage of documents
- **Session Management**: Secure user authentication and session handling
- **Data Validation**: Input validation on both frontend and backend

## 📊 Database Schema

### Key Entities
- **Users**: Teacher and student accounts
- **Exams**: Exam definitions and questions
- **ExamResults**: Student submissions and scores
- **ExamSessions**: Active exam sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with basic exam management
- **v1.1.0** - Added AI correction features
- **v1.2.0** - Enhanced UI and user experience
- **v1.3.0** - Added multi-language support and feedback styles

## 🙏 Acknowledgments

- AWS for cloud services integration
- Spring Boot community for excellent documentation
- React community for frontend framework
- Tailwind CSS for styling framework