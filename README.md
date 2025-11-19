# Brainstorm Nexus

AI-powered brainstorming and idea grouping application that helps organize and categorize ideas in real-time using Google's Gemini AI.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Using Docker (Recommended)](#using-docker-recommended)
  - [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Creating a Session](#creating-a-session)
  - [User Roles](#user-roles)
  - [Admin Dashboard](#admin-dashboard)
- [Security](#security)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

Brainstorm Nexus is a collaborative brainstorming tool that leverages AI to automatically group and categorize ideas. Perfect for workshops, team meetings, and creative sessions where organizing thoughts quickly is essential.

## Features

- 🤖 **AI-Powered Grouping**: Automatic idea categorization using Google Gemini AI
- 👥 **Multi-User Support**: Teacher and student roles with different permissions
- 🔄 **Real-Time Collaboration**: Multiple users can contribute simultaneously
- 📊 **Session Management**: Create and manage multiple brainstorming sessions
- 🔐 **Secure**: Built-in authentication and security features
- 🐳 **Docker Ready**: Easy deployment with Docker and Docker Compose

## Prerequisites

- **Docker** and **Docker Compose** (for containerized deployment)
- **Node.js** 18+ and **npm** (for local development)
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

## Installation

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brainstorm-ai-grouper
   ```

2. **Configure environment variables**
   ```bash
   cp .env.production.example .env
   ```
   
   Edit `.env` and add your Google Gemini API key:
   ```env
   API_KEY=your_actual_gemini_api_key_here
   NODE_ENV=production
   ```

3. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   
   Open your browser and navigate to: `http://localhost:5016`

### Manual Setup

1. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

2. **Configure environment**
   ```bash
   # Create backend .env file
   echo "API_KEY=your_gemini_api_key" > backend/.env
   ```

3. **Build the frontend**
   ```bash
   npm run build
   ```

4. **Start the backend server**
   ```bash
   cd backend
   node server.js
   ```

5. **Access the application**
   
   Open your browser and navigate to: `http://localhost:5016`

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
- `API_KEY`: Your Google Gemini API key (required)
- `PORT`: Server port (default: 5016)

**Docker** (`.env`):
- `API_KEY`: Your Google Gemini API key (required)
- `NODE_ENV`: Environment mode (production/development)

### Security Configuration

Before deploying to production, run the security audit:

```bash
chmod +x security-audit.sh
./security-audit.sh
```

Review `SECURITY.md` for detailed security best practices.

## Usage

### Creating a Session

1. Navigate to the home page
2. Enter a session name
3. Click "Create New Session"
4. Share the generated link with participants

### User Roles

**Teacher**:
- Create and manage sessions
- View all submitted ideas
- Trigger AI-powered grouping
- Delete sessions

**Student**:
- Submit ideas to active sessions
- View grouped results
- Real-time collaboration

### Admin Dashboard

Access the admin dashboard to:
- View all sessions
- Manage session data
- Monitor system activity
- Delete old sessions

Default credentials can be set up through the application on first use.

## Security

🔒 **Important Security Notes**:

- Never commit `.env` files to version control
- Keep your Gemini API key secure
- Use HTTPS in production
- Review `SECURITY.md` before deployment
- Run `security-audit.sh` regularly

## Development

### Project Structure

```
brainstorm-ai-grouper/
├── backend/           # Express.js backend server
├── components/        # React components
├── services/          # Frontend services (Gemini, Storage)
├── views/            # Application views
├── public/           # Static assets
├── App.tsx           # Main application component
└── docker-compose.yml # Docker configuration
```

### Development Mode

```bash
# Start frontend dev server
npm run dev

# Start backend (in separate terminal)
cd backend
node server.js
```

### Building for Production

```bash
npm run build
```

## Troubleshooting

### Port Already in Use

If port 5016 is already in use:

```bash
# Find the process using the port
lsof -ti:5016 | xargs kill -9

# Or change the port in docker-compose.yml
```

### API Key Issues

- Verify your API key is valid
- Check that `.env` file exists in the backend directory
- Ensure no spaces around the `=` in environment variables

### Docker Issues

```bash
# Rebuild containers
docker-compose down
docker-compose up --build

# View logs
docker-compose logs -f
```

### Permission Errors

```bash
# Make scripts executable
chmod +x setup.sh start.sh security-audit.sh check-setup.sh
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Need Help?** Check out the [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions or [SECURITY.md](SECURITY.md) for security guidelines.
