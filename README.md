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

## Live Demo

The application is deployed and accessible via Vercel.

**Live URL:** [https://pudirectory25.vercel.app/](https://pudirectory25.vercel.app/)

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

### Submission Form
- **GitHub (Deployed in Vercel) repository URL:** [https://github.com/luwiyey/pudirectory](https://github.com/luwiyey/pudirectory) (Live demo hosted at [https://pudirectory25.vercel.app/](https://pudirectory25.vercel.app/))
- **Student Name:** Zia Louise Mariano
- **Features implemented:**
    - **Role-Based Authentication & Authorization:** Secure login system for "Admin" and "Teacher" roles using Firebase Authentication. The UI and available actions dynamically adapt based on the logged-in user's permissions.
    - **Full CRUD Functionality:** Admins have complete Create, Read, Update, and Delete capabilities for all student records.
    - **Real-time Cloud Database:** Utilizes Firebase Firestore as a backend, ensuring all data is persisted in the cloud and synchronized in real-time across all users.
    - **Advanced Data Management:**
        - **Bulk Import/Export:** Admins can bulk import new students from a JSON file and export the entire student directory to JSON.
        - **Grade Management:** Teachers can import grades for their specific classes from a JSON file and export class grade sheets.
    - **Interactive Analytics Dashboard:** A comprehensive analytics page visualizes key student metrics, including enrollment per department, course popularity, and a real-time scholarship status tracker, using the `recharts` library.
    - **Sophisticated UI & UX:**
        - **Dynamic Directory:** Features real-time search and multi-key sorting (by name, department).
        - **Hierarchical Department Browser:** An intuitive accordion-style browser to view students organized by college and department.
        - **Responsive Design:** The application is fully responsive and provides a seamless experience on both desktop and mobile devices, built with Tailwind CSS and ShadCN UI.
    - **CI/CD Pipeline:** The repository is configured with a GitHub Actions workflow for Continuous Integration, automatically running checks on every push to ensure code quality and build integrity. It is also pre-configured for deployment on Firebase App Hosting.
- **Challenges faced:**
    - **Implementing Granular Security Rules:** A significant challenge was designing and implementing Firestore Security Rules that could securely enforce different data access levels for Admins and Teachers. Ensuring that teachers could only read certain data and update specific fields (like grades), while Admins retained full control, required careful rule structuring.
    - **Managing Real-time State:** Handling real-time data from Firestore across many different components (like the directory, analytics page, and student details page) was complex. A key challenge was preventing unnecessary re-renders and infinite loops caused by changing data, which was solved by carefully memoizing Firestore queries and structuring React hooks correctly.
    - **Designing a Role-Aware UI:** Creating a clean user interface that elegantly shows or hides specific actions (like "Delete Student" or "Import Students") based on the user's role (Admin vs. Teacher) required careful state management and conditional rendering throughout the application to ensure the experience was intuitive for both user types.
