# CS CRM Dashboard Documentation

Welcome to the CS CRM Dashboard documentation. This repository contains comprehensive documentation for the CS CRM Dashboard application, a customer relationship management system built with React, TypeScript, and Firebase.

## Documentation Overview

This documentation is organized into several key sections:

1. **[Architecture Overview](ARCHITECTURE.md)**: High-level overview of the system architecture, including components, interactions, and deployment.

2. **[Component Structure](COMPONENT_STRUCTURE.md)**: Detailed breakdown of the application's component hierarchy, responsibilities, and relationships.

3. **[Data Model](DATA_MODEL.md)**: Comprehensive documentation of the Firestore database structure, collections, documents, and relationships.

4. **[API Documentation](API_DOCUMENTATION.md)**: Details on available APIs, endpoints, request/response formats, and authentication requirements.

5. **[Security Architecture](SECURITY.md)**: Overview of security measures, including authentication, authorization, data security, and compliance.

## Getting Started

If you're new to the CS CRM Dashboard, we recommend reading the documentation in the following order:

1. Start with the [Architecture Overview](ARCHITECTURE.md) to understand the high-level system design.
2. Review the [Component Structure](COMPONENT_STRUCTURE.md) to understand how the frontend is organized.
3. Explore the [Data Model](DATA_MODEL.md) to understand how data is stored and structured.
4. Refer to the [API Documentation](API_DOCUMENTATION.md) for details on available APIs and how to use them.
5. Finally, review the [Security Architecture](SECURITY.md) to understand the security measures in place.

## Contributing to Documentation

When contributing to this documentation, please follow these guidelines:

1. Use Markdown for all documentation files.
2. Keep the documentation up-to-date with code changes.
3. Use clear, concise language and provide examples where appropriate.
4. Include diagrams and visual aids when they help clarify complex concepts.
5. Follow the existing structure and formatting conventions.

## Documentation Maintenance

This documentation is maintained by the CS CRM Dashboard development team. If you find any issues or have suggestions for improvements, please create an issue in the repository.

## License

This documentation is licensed under the same license as the CS CRM Dashboard application.

## 🚀 Features

- **Authentication System**: Secure login with role-based access control (Admin, HR, User)
- **User Management**: Create, update, and delete users with different roles and capabilities
- **Dashboard Analytics**: Visual representation of key metrics and activities
- **Activity Monitoring**: Real-time tracking of user activities and status
- **HR Management**: 
  - Document management
  - Payslip distribution
  - Holiday tracking
  - Contract management
- **Knowledge Base**: Centralized repository for company information and guides
- **Request System**: Holiday and special request management with approval workflows
- **Team Calendar**: Schedule management for team members

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Material UI
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **State Management**: React Context API
- **Routing**: React Router
- **Data Visualization**: Recharts
- **PDF Generation**: jsPDF
- **Form Handling**: Native React forms

## 📁 Project Structure

The project follows a component-based architecture with the following main directories:

```
src/
├── components/       # UI components organized by feature
│   ├── admin/        # Admin-specific components
│   ├── dashboard/    # Dashboard components
│   ├── hr/           # HR-specific components
│   ├── knowledgeBase/ # Knowledge base components
│   ├── layout/       # Layout components (sidebar, header)
│   └── routes/       # Route-related components
├── contexts/         # React contexts for state management
├── firebase/         # Firebase configuration and utilities
├── pages/            # Top-level page components
├── scripts/          # Utility scripts for migrations, etc.
├── services/         # Service modules for data operations
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js v16+
- npm or yarn
- Firebase account

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crm-dashboard.git
   cd crm-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## 🔒 Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Set up Storage
5. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
6. Deploy Storage rules:
   ```bash
   firebase deploy --only storage:rules
   ```

## 🚢 Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- Soufiane Sebbane - Project Lead & Developer 