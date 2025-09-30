# RFP Management System - Backend

A clean and easy-to-understand Node.js Express backend for the RFP (Request for Proposal) Management System.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role-based access control
- **RFP Management**: Complete CRUD operations for RFPs with status management
- **Response System**: Suppliers can submit responses to published RFPs
- **Document Handling**: File upload/download with proper access controls
- **Security**: Comprehensive security middleware and validation
- **Clean Architecture**: Well-organized code structure with clear separation of concerns

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── rfpController.js     # RFP management logic
│   │   ├── responseController.js # Response management logic
│   │   └── documentController.js # File handling logic
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validation.js        # Input validation rules
│   ├── models/
│   │   ├── User.js              # User data model
│   │   ├── RFP.js               # RFP data model
│   │   ├── Response.js          # Response data model
│   │   └── Document.js          # Document data model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── rfp.js               # RFP routes
│   │   ├── response.js          # Response routes
│   │   └── document.js          # Document routes
│   └── server.js                # Main server file
├── uploads/                     # File upload directory
├── package.json                 # Dependencies and scripts
├── env.example                  # Environment variables template
└── README.md                    # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Step 1: Clone and Navigate

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

1. Copy the environment template:
```bash
cp env.example .env
```

2. Edit `.env` file with your configuration:
```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/rfp_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB installation
mongod

# Or if using MongoDB service
sudo systemctl start mongod
```

### Step 5: Run the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:8000`

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| GET | `/auth/me` | Get current user | Private |
| PUT | `/auth/profile` | Update profile | Private |
| PUT | `/auth/change-password` | Change password | Private |
| POST | `/auth/logout` | Logout user | Private |

### RFP Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/rfps` | Get all RFPs | Public* |
| GET | `/rfps/:id` | Get RFP by ID | Public* |
| POST | `/rfps` | Create new RFP | Buyers only |
| PUT | `/rfps/:id` | Update RFP | Owner only |
| DELETE | `/rfps/:id` | Delete RFP | Owner only |
| POST | `/rfps/:id/publish` | Publish RFP | Owner only |
| POST | `/rfps/:id/close` | Close RFP | Owner only |
| GET | `/rfps/:id/responses` | Get RFP responses | Owner only |

### Response Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/responses` | Get all responses | Private |
| GET | `/responses/:id` | Get response by ID | Private |
| POST | `/responses` | Create new response | Suppliers only |
| PUT | `/responses/:id` | Update response | Owner only |
| DELETE | `/responses/:id` | Delete response | Owner only |
| POST | `/responses/:id/submit` | Submit response | Owner only |
| POST | `/responses/:id/review` | Review response | RFP Owner only |

### Document Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/documents/upload` | Upload document | Private |
| GET | `/documents` | Get all documents | Private |
| GET | `/documents/:id` | Get document by ID | Private |
| GET | `/documents/:id/download` | Download document | Private |
| DELETE | `/documents/:id` | Delete document | Owner only |

*Public endpoints may return different data based on authentication status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **Buyer**: Can create, manage RFPs, and review responses
- **Supplier**: Can view published RFPs and submit responses

## 📝 Request/Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_buyer",
  "email": "john@company.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "role": "buyer",
  "company_name": "Tech Corp",
  "phone": "+1234567890"
}
```

### Create RFP
```bash
POST /api/rfps
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Website Development Project",
  "description": "We need a modern website for our business",
  "category": "Web Development",
  "budget_min": 5000,
  "budget_max": 15000,
  "deadline": "2024-12-31T23:59:59.000Z",
  "requirements": [
    "Responsive design",
    "SEO optimized",
    "Content management system"
  ],
  "evaluation_criteria": [
    "Technical expertise",
    "Portfolio quality",
    "Timeline feasibility"
  ]
}
```

### Submit Response
```bash
POST /api/responses
Authorization: Bearer <token>
Content-Type: application/json

{
  "rfp_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "proposal": "We can deliver a high-quality website...",
  "proposed_budget": 12000,
  "timeline": "6-8 weeks",
  "methodology": "Agile development approach...",
  "status": "submitted"
}
```

## 🔧 Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent indentation (2 spaces)
- Use async/await for asynchronous operations
- Handle errors properly with try-catch blocks

## 🛡️ Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with request rate limiting
- **Input Validation**: Comprehensive validation using express-validator
- **File Upload Security**: File type and size restrictions
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": [] // Optional validation details
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## 📊 Database Schema

### Users Collection
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  full_name: String,
  role: 'buyer' | 'supplier',
  company_name: String (optional),
  phone: String (optional),
  is_active: Boolean,
  created_at: Date,
  updated_at: Date
}
```

### RFPs Collection
```javascript
{
  title: String,
  description: String,
  category: String,
  budget_min: Number (optional),
  budget_max: Number (optional),
  deadline: Date,
  requirements: [String],
  evaluation_criteria: [String],
  terms_and_conditions: String (optional),
  status: 'draft' | 'published' | 'closed' | 'cancelled',
  created_by: ObjectId (User),
  published_at: Date (optional),
  response_count: Number,
  document_ids: [ObjectId],
  created_at: Date,
  updated_at: Date
}
```

## 🤝 Contributing

1. Follow the existing code style
2. Add comments for complex logic
3. Write tests for new features
4. Update documentation as needed

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the logs for error messages
2. Verify your environment configuration
3. Ensure MongoDB is running
4. Check that all dependencies are installed

For additional help, please refer to the error messages in the console or check the API response details.
