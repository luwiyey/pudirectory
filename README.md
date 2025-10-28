# PU Directory
**Repository:** github.com/luwiyey/pudirectory
**Deployment target:** Firebase App Hosting (with GitHub Actions CI)

This repository contains the source code for the PU Directory, a modern Student Information System (SIS) built on a cloud-native stack. It demonstrates professional-grade architecture, feature implementation, and CI/CD practices.

## Features & Rubric Compliance

This section outlines the core features of the application, corresponding to a standard project rubric for a cloud-native web application.

- **Professional-Grade Architecture & Stack**
    - **Framework:** Next.js 15 (App Router) with React Server Components.
    - **Language:** TypeScript for type safety and maintainability.
    - **Backend:** Firebase (Firestore, Authentication) for a scalable, serverless backend.
    - **Styling:** Tailwind CSS with ShadCN UI for a modern, responsive component-based design.
    - **CI/CD:** Automated build and test pipeline using GitHub Actions.

- **Core Application Features (CRUD & Data Management)**
    - **Authentication:** Secure, role-based access control (Admin vs. Teacher) using Firebase Authentication.
    - **Data Persistence:** Student records are stored and managed in Firebase Firestore.
    - **CRUD Operations:** Full Create, Read, Update, and Delete functionality for student records (Admin-only).
    - **Data Import/Export:** Admins can bulk import students from a JSON file and export all student data to JSON. Teachers can import/export grades for their classes.

- **Advanced Features**
    - **Interactive Dashboard:** An analytics dashboard visualizes student data (demographics, course popularity) using `recharts`.
    - **Dynamic UI:** The interface includes real-time search, sorting, and a hierarchical department browser for an enhanced user experience.

## Local Development Quickstart

### Prerequisites
- Node.js (v20 or later)
- npm (or yarn/pnpm)
- A Firebase project with Email/Password sign-in enabled.

### 1. Clone the repository
```bash
git clone https://github.com/luwiyey/pudirectory.git
cd pudirectory
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
- Update the Firebase configuration in `src/firebase/config.ts` with your own project's credentials.

### 4. Run the development server
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000) by default.

## User Accounts for Testing

To test the application's role-based features, you must first create the following users in your **Firebase Authentication** console:

- **Admin Account:**
  - **Email:** `admin@panpacificu.edu.ph`
  - **Password:** `ecoast2324`

- **Teacher Account:**
  - **Email:** `teacher@panpacificu.edu.ph`
  - **Password:** `ecoast2324`


## CI/CD Pipeline

This project is configured with a GitHub Actions workflow (`.github/workflows/ci.yml`) that automates testing and deployment.
- **On every push/pull_request to `main`:** The CI pipeline runs linting, type checking, and a production build to ensure code quality and integrity.
- **Firebase App Hosting Integration:** The `apphosting.yaml` file configures the environment for automatic deployments from the connected GitHub repository.

## Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Authentication:** Firebase Authentication
- **Styling:** Tailwind CSS & ShadCN UI
- **Data Validation:** Zod
- **Charting:** Recharts
- **Icons:** Lucide React

## Submission

### Prerequisites
1. GitHub account
2. Local development environment (VS Code, Git, etc.)

### Submission Instructions

#### Final Repository Check
1. Ensure all code is pushed to GitHub.
2. Verify README is complete and professional.
3. Confirm all features are working as expected.

#### Submission Form
- **GitHub repository URL:** __________________
- **Student Name:** __________________________
- **Features implemented:** ___________________
- **Challenges faced:** _______________________
