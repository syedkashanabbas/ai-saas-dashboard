# 8Solve AI - SaaS Admin Dashboard

A comprehensive multi-tenant SaaS admin dashboard built with modern web technologies. This application serves as a reusable template for AI SaaS platforms, featuring robust authentication, role-based access control, dynamic UI components, and a scalable architecture.

## 🚀 Features

### Core Functionality
- **JWT-based Authentication** with refresh token mechanism
- **Multi-tenant Architecture** supporting multiple organizations
- **Role-Based Access Control (RBAC)** with four distinct roles:
  - Super Admin: Full system access
  - Admin: Tenant administration
  - Manager: Team management
  - User: Basic dashboard access
- **Dynamic Sidebar & Header** that auto-generates based on user role
- **Theme Switcher** with light/dark mode support
- **Real-time Notification System** with read/unread status
- **Responsive Design** optimized for desktop and mobile devices

### Technical Features
- **Clean Architecture** with separation of concerns
- **Modular Components** for easy reusability
- **State Management** using Zustand
- **API Integration** with Axios and React Query
- **Form Validation** with comprehensive error handling
- **Security Best Practices** including rate limiting and CORS
- **Database Optimization** with proper indexing and relationships

## 🛠 Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for beautiful, accessible components
- **React Router** for client-side routing
- **Zustand** for state management
- **React Query** for server state management
- **Axios** for HTTP requests
- **Lucide React** for icons

### Backend
- **Node.js** with Express framework
- **MySQL** database with connection pooling
- **JWT** for authentication and authorization
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Morgan** for request logging
- **Express Rate Limit** for API protection
- **Express Validator** for input validation

## 📁 Project Structure

```
ai-saas-dashboard/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── contexts/       # React contexts for state management
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout components
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── utils/          # Helper utilities
│   ├── .env                # Environment variables
│   ├── package.json        # Dependencies and scripts
│   └── vite.config.js      # Vite configuration
├── backend/                 # Node.js backend application
│   ├── config/             # Configuration files
│   ├── database/           # Database schema and seeds
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route handlers
│   ├── .env                # Environment variables
│   ├── index.js            # Main server file
│   └── package.json        # Dependencies and scripts
└── README.md               # This file
```

## 🚦 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** or **pnpm** package manager
- **MySQL** (version 8.0 or higher)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/syedkashanabbas/ai-saas-dashboard.git
   cd ai-saas-dashboard
   ```

2. **Set up the database**
   
   Create a new MySQL database:
   ```sql
   CREATE DATABASE ai_saas_dashboard;
   ```

   Import the database schema:
   ```bash
   mysql -u root -p ai_saas_dashboard < backend/database/schema.sql
   ```

   Seed the database with initial data:
   ```bash
   mysql -u root -p ai_saas_dashboard < backend/database/seed.sql
   ```

3. **Configure environment variables**

   Backend configuration (`backend/.env`):
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ai_saas_dashboard

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

   Frontend configuration (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Install dependencies**

   Backend:
   ```bash
   cd backend
   npm install
   ```

   Frontend:
   ```bash
   cd frontend
   pnpm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will be available at `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   pnpm run dev
   ```
   The frontend will be available at `http://localhost:5173`

3. **Access the application**
   
   Open your browser and navigate to `http://localhost:5173`. You can log in using the demo credentials provided on the login page.

## 👥 Demo Credentials

The application comes with pre-seeded demo accounts for testing different user roles:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Super Admin | superadmin@8solve.ai | admin123 | Full system access, can manage all tenants and users |
| Admin | admin@8solve.ai | admin123 | Tenant administration, can manage users within organization |
| Manager | manager@8solve.ai | manager123 | Team management, can view team data and reports |
| User | user@8solve.ai | user123 | Basic access, limited to personal dashboard and profile |

## 🔧 Configuration

### Environment Variables

#### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | 5000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `DB_HOST` | MySQL host | localhost | Yes |
| `DB_USER` | MySQL username | root | Yes |
| `DB_PASSWORD` | MySQL password | | Yes |
| `DB_NAME` | Database name | ai_saas_dashboard | Yes |
| `JWT_SECRET` | JWT signing secret | | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | | Yes |
| `JWT_EXPIRE` | Access token expiry | 15m | No |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | 7d | No |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 | No |

#### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api | Yes |

### Database Configuration

The application uses MySQL with the following key tables:

- **tenants**: Organizations/companies using the platform
- **roles**: User roles with associated permissions
- **users**: User accounts linked to tenants and roles
- **notifications**: System and user notifications
- **refresh_tokens**: JWT refresh token storage
- **user_sessions**: Active user session tracking

### Security Configuration

The backend implements several security measures:

- **Rate Limiting**: 100 requests per 15-minute window per IP
- **CORS Protection**: Configured for frontend domain
- **Helmet**: Security headers for Express
- **JWT Tokens**: Secure authentication with refresh mechanism
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express validator for all endpoints
- **SQL Injection Protection**: Parameterized queries

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive access/refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role_name": "Admin",
    "permissions": {...}
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/logout
Logout user and invalidate refresh token.

#### GET /api/auth/me
Get current user profile information.

### User Management Endpoints

#### GET /api/users
Get paginated list of users with filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term for name/email
- `roleId`: Filter by role ID
- `status`: Filter by user status

#### GET /api/users/:id
Get specific user by ID.

#### PUT /api/users/:id
Update user information.

#### DELETE /api/users/:id
Delete user account.

### Tenant Management Endpoints

#### GET /api/tenants
Get paginated list of tenants (Super Admin only).

#### POST /api/tenants
Create new tenant organization.

#### PUT /api/tenants/:id
Update tenant information.

#### DELETE /api/tenants/:id
Delete tenant organization.

### Notification Endpoints

#### GET /api/notifications
Get user's notifications with pagination.

#### POST /api/notifications
Create new notification.

#### PATCH /api/notifications/:id/read
Mark notification as read.

#### DELETE /api/notifications/:id
Delete notification.

## 🎨 UI Components

The frontend uses shadcn/ui components for a consistent, accessible design system:

### Core Components
- **Button**: Various styles and sizes
- **Card**: Content containers with headers
- **Input**: Form input fields
- **Badge**: Status indicators
- **Avatar**: User profile images
- **Dropdown Menu**: Context menus
- **Popover**: Overlay content
- **Scroll Area**: Scrollable content regions
- **Separator**: Visual dividers
- **Tooltip**: Hover information

### Layout Components
- **Sidebar**: Collapsible navigation menu
- **Header**: Top navigation with user actions
- **Dashboard Layout**: Main application layout

### Custom Components
- **Theme Switcher**: Light/dark mode toggle
- **Notification Center**: Real-time notification display
- **Role-based Navigation**: Dynamic menu generation
- **Protected Routes**: Authentication guards

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with automatic token refresh
- Role-based access control with granular permissions
- Secure password hashing using bcrypt
- Session management with token blacklisting

### API Security
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- Security headers via Helmet middleware

### Frontend Security
- Protected routes with authentication guards
- Secure token storage in localStorage
- Automatic logout on token expiration
- XSS protection through React's built-in sanitization

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   pnpm run build
   ```

2. **Configure production environment**
   Update environment variables for production:
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure production database
   - Set proper CORS origins

3. **Start production server**
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment (Optional)

Create `Dockerfile` for containerized deployment:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment-specific Configuration

- **Development**: Hot reloading, detailed error messages
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, security hardening

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
pnpm test
```

### Test Coverage

The application includes:
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for user workflows

## 📈 Performance Optimization

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle size optimization with Vite
- Caching strategies for API responses

### Backend Optimizations
- Database connection pooling
- Query optimization with proper indexing
- Response compression
- Caching for frequently accessed data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration for code style
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the demo credentials for testing

## 🙏 Acknowledgments

- [React](https://reactjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [MySQL](https://mysql.com/) for the database
- [Vite](https://vitejs.dev/) for the build tool

---

**Built with ❤️ by the 8Solve AI Team**

