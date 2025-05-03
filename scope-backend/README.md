# SCOPE Backend

This is the backend component of the SCOPE (Student Complaint Optimisation and Prioritization Engine) project, built with FastAPI and Python.

## Overview

The SCOPE backend provides a robust API for managing student complaints with powerful analytics, AI-driven insights, and advanced data processing capabilities. It serves as the core of the SCOPE system, handling everything from user authentication to machine learning predictions.

## Tech Stack

- **FastAPI**: High-performance web framework for building APIs
- **SQLAlchemy**: ORM for database interactions
- **Pydantic**: Data validation and settings management
- **Langchain**: Framework for building applications with LLMs
- **Google Gemini**: Advanced AI model for natural language processing
- **PyTorch/Transformers**: Machine learning framework for text classification

The system uses a multi-task deep learning model based on DistilBERT to simultaneously classify complaints by genre (category) and priority level. This backend service provides RESTful APIs for processing individual complaints or batch processing multiple complaints.

The application also includes a RAG-based LLM chatbot powered by Google's Gemini API and Langchain, which can help staff efficiently analyze and manage complaints.

## Features

- **Automatic Complaint Classification**: Uses DistilBERT to classify complaints by category and urgency
- **User Authentication**: JWT-based authentication with role-based access control
- **RESTful API**: Comprehensive API for complaint management
- **Analytics Dashboard**: Track trends and statistics across complaint categories
- **RAG-based Chatbot**: AI assistant to help staff analyze and manage complaints
- **Database Integration**: SQLAlchemy ORM for persistent storage

## Project Structure

```
scope-backend/
├── app/
│   ├── api/
│   │   ├── dependencies/ - Authentication and dependency injection
│   │   └── routes/ - API endpoints
│   ├── chatbot/ - RAG-based LLM chatbot implementation
│   ├── core/ - Core configuration and security
│   ├── db/ - Database configuration
│   ├── ml/ - Machine learning model integration
│   ├── models/ - Domain models and schemas
│   └── services/ - Business logic services
├── data/ - Sample data for testing
├── model/ - Trained ML model files
├── notebooks/ - Jupyter notebooks for EDA and model development
└── scripts/ - Utility scripts for data loading etc.
```

## Prerequisites

- Python 3.9+ 
- Google API Key (for Gemini API)

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/yourusername/scope-backend.git
cd scope-backend
```

### 2. Create a virtual environment and install dependencies

```sh
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set up environment variables

Copy the example environment file and update it with your settings:

```sh
cp app/.env.example .env
```

Edit the `.env` file to include your Google API key and other settings.

### 4. Seed the database with sample data

```sh
python scripts/seed_data.py data/complaints-small.csv
```

### 5. Start the server

```sh
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

### 6. Access API documentation

Open your browser and navigate to http://localhost:8000/docs to view the Swagger UI documentation.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login to get access token

### Complaints
- `GET /api/v1/complaints` - List all complaints
- `POST /api/v1/complaints` - Create a new complaint
- `GET /api/v1/complaints/{id}` - Get a specific complaint
- `PUT /api/v1/complaints/{id}` - Update a complaint
- `DELETE /api/v1/complaints/{id}` - Delete a complaint
- `POST /api/v1/complaints/classify` - Classify a complaint text without creating it

### Chatbot
- `POST /api/v1/chatbot/chat` - Interact with the SCOPE assistant

### Analytics
- `GET /api/v1/analytics/trends` - Get complaint trends and statistics
- `GET /api/v1/analytics/priority` - Get high priority complaints
- `GET /api/v1/analytics/topics` - Get common topics from complaints
- `GET /api/v1/analytics/response-times` - Get response time statistics

### Users
- `GET /api/v1/users` - List all users (admin only)
- `POST /api/v1/users` - Create a new user (admin only)
- `GET /api/v1/users/{id}` - Get a specific user (admin only)
- `PUT /api/v1/users/{id}` - Update a user (admin only)
- `DELETE /api/v1/users/{id}` - Delete a user (admin only)

## Default Users

- Admin: admin@example.com / adminpassword
- Staff: staff@example.com / staffpassword
- Student: student@example.com / studentpassword

## Future Enhancements

- Integration with front-end dashboard
- Email notifications for high-priority complaints
- More sophisticated analytics and reporting
- Enhanced chatbot capabilities with more tools

## License

[MIT License](LICENSE)
