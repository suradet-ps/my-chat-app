# Real-time Chat Application

### _A feature-rich, real-time chat application built with Vue 3, Vite, and Pinia, powered by a Supabase backend._

This repository contains a complete, real-time chat application demonstrating a modern frontend stack. The app provides 1-on-1 messaging functionality, user authentication, profile management, and a clean, responsive interface styled with Tailwind CSS.

The entire backend is powered by **Supabase**, handling everything from authentication and user profiles to high-performance real-time messaging via its Broadcast feature.

## ✨ Features

-   **Supabase Backend:** Leverages Supabase for authentication, user profiles (database), and real-time messaging.
-   **Magic Link Authentication:** Secure, passwordless login using Supabase's `signInWithOtp` feature. Users receive a link in their email to sign in.
-   **High-Performance Real-time:** Uses **Supabase Broadcast** to push new messages directly to clients, minimizing database reads and ensuring low latency.
-   **Optimistic UI:** Messages appear instantly in the UI upon sending for a fluid, responsive user experience, while the data is synchronized in the background.
-   **1-on-1 Conversations:** Users can view a list of their existing conversations and start new chats with any other registered user.
-   **Unified Search:** A single search bar allows users to filter their existing conversations and discover new users to start a chat with.
-   **Profile Management:** An account page where users can update their display name.
-   **Modern Frontend Stack:** Built with Vue 3 (Composition API), Vite, Pinia for centralized state management, and Vue Router.
-   **Clean UI:** Styled with Tailwind CSS and uses `lucide-vue-next` for crisp, modern icons.

## 🛠️ Built With the Tools and Technologies:

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" alt="Vue.js">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logo=pinia&logoColor=black" alt="Pinia">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
</p>

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

-   Node.js (v18 or higher)
-   npm (or any other package manager)
-   A free Supabase account ([signup here](https://supabase.com/))

### Supabase Setup

1.  Create a new project in Supabase.
2.  Go to the **SQL Editor** and run the following SQL to create the necessary tables and policies. (You will need to create a `schema.sql` file in your project with this content).
    -   `profiles` table for user data.
    -   `conversations`, `participants`, and `messages` tables for chat functionality.
    -   Row Level Security (RLS) policies to ensure users can only access their own data.
    -   A PostgreSQL function (`create_or_get_conversation`) to handle starting new chats.
3.  Go to **Project Settings > API** to find your Project URL and `anon` public key.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/suradet-ps/my-chat-app.git
    cd my-chat-app
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your Supabase credentials.
    ```env
    VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📜 Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the app for production.
-   `npm run preview`: Previews the production build locally.
