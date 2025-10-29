# ShopScout - AI-Powered Shopping Assistant

## Overview
ShopScout is a Chrome extension that enhances online shopping by providing AI-powered product analysis, price tracking, and personalized recommendations. It helps users make informed purchasing decisions by analyzing product details, price history, and reviews.

## Features

- **AI-Powered Product Analysis**: Get instant insights about products using advanced AI
- **Price History & Tracking**: View historical price data and set price alerts
- **Review Summarization**: Get concise summaries of product reviews
- **Price Comparison**: Compare prices across different retailers
- **Trust Badges**: Visual indicators of product quality and seller reliability
- **Personalized Recommendations**: AI-driven product suggestions based on your preferences
- **Secure Authentication**: Safe and secure user authentication system

## System Architecture

ShopScout is built using a modern, modular architecture with the following components:

### 1. Chrome Extension (Frontend)
- Built with React 18 and TypeScript
- Styled with TailwindCSS for responsive design
- State management using React Context API
- Chrome Extension APIs for browser integration

### 2. Backend Services

#### API Server (`/server`)
- Node.js with Express.js
- RESTful API endpoints
- Database integration with PostgreSQL (Sequelize ORM)
- Handles product data, user preferences, and analytics

#### Authentication Server (`/auth-server`)
- Dedicated authentication service
- Secure session management
- OAuth integration

### 3. AI Services
- Natural language processing for review analysis
- Price prediction algorithms
- Product recommendation engine

## Tech Stack

- **Frontend**:
  - React 18
  - TypeScript
  - TailwindCSS
  - Vite (Build Tool)
  - Chrome Extension APIs

- **Backend**:
  - Node.js
  - Express.js
  - PostgreSQL
  - Sequelize ORM

- **Authentication**:
  - JWT (JSON Web Tokens)
  - OAuth 2.0

- **Development Tools**:
  - ESLint
  - Prettier
  - TypeScript
  - npm

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)
- Chrome browser (latest version)
- PostgreSQL (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/shopscout-extension.git
   cd shopscout-extension
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server
   npm install
   
   # Install auth server dependencies
   cd ../auth-server
   npm install
   
   # Return to root directory
   cd ..
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory with the following variables:
     ```
     # Database
     DB_HOST=localhost
     DB_NAME=shopscout
     DB_USER=your_db_user
     DB_PASS=your_db_password
     
     # Auth
     JWT_SECRET=your_jwt_secret
     
     # API Keys
     OPENAI_API_KEY=your_openai_api_key
     ```

### Running the Application

1. **Start the development servers**
   ```bash
   # In separate terminal windows:
   
   # Start the main application
   npm run dev
   
   # Start the API server
   cd server && npm run dev
   
   # Start the auth server
   cd ../auth-server && npm run dev
   ```

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the `dist` directory in the project root
   - The ShopScout extension should now be available in your Chrome toolbar

## Building for Production

1. **Build the extension**
   ```bash
   npm run build:extension
   ```
   This will create a production-ready build in the `dist` directory.

2. **Deploy the backend**
   - Deploy the `server` and `auth-server` to your preferred hosting service (e.g., Heroku, AWS, etc.)
   - Update the API endpoints in the extension configuration

## Development

### Project Structure

```
shopscout/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── services/           # API and service layer
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── server/                 # API server
│   ├── config/             # Server configuration
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── services/           # Business logic
├── auth-server/            # Authentication server
│   ├── config/             # Auth configuration
│   └── routes/             # Auth routes
├── public/                 # Static assets
└── scripts/                # Build and utility scripts
```

### Code Style

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for type safety
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Keep components small and focused on a single responsibility

## Testing

Run the test suite:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)

---

Built with ❤️ by the ShopScout Team
