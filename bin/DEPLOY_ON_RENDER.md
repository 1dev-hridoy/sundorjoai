# Deploying SundorjoAI to Render (Full Stack)

This guide outlines the steps to deploy your full-stack React + Node.js application to [Render](https://render.com).

Since your application uses a Node.js backend (`server.cjs`) to handle API requests and serve the frontend, you must deploy it as a **Web Service**, not a Static Site.

## Prerequisites
- A [Render account](https://render.com).
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket).
- A MongoDB database (Render offers managed Redis/Postgres, but for Mongo you might use MongoDB Atlas or a Docker service. For simplicity, assume MongoDB Atlas string is available).

## Deployment Steps

1.  **Log in to Render** and go to your **Dashboard**.
2.  Click on the **"New +"** button and select **"Web Service"**.
3.  **Connect your repository**:
    - Search for your repository (`prompt2app-reactjs` or your repo name) and select "Connect".
4.  **Configure the service settings**:
    - **Name**: Choose a name (e.g., `sundorjo-ai`).
    - **Region**: Choose the one closest to your users.
    - **Branch**: `main`.
    - **Root Directory**: Leave blank.
    - **Runtime**: **Node**
    - **Build Command**: `npm install && npm run build`
        - *This installs dependencies and builds the React frontend to the `dist` folder.*
    - **Start Command**: `npm run server`
        - *This starts `server.cjs`, which serves the API and the React files.*
5.  **Environment Variables**:
    - You **MUST** add these for the app to work:
    - `NODE_ENV`: `production` (To ensure the server serves the `dist` folder).
    - `MONGO_URI`: Your MongoDB connection string.
    - `SESSION_SECRET`: A long random string for session security.
    - Add any other secrets from your `.env` file (e.g., `CLOUDINARY_CLOUD_NAME`).

6.  **IMPORTANT: Update API URL in Code**
    - Before pushing your code, you must update the `API_URL` variable in your frontend code to match your Render URL (instead of `http://localhost:3000`).
    - **Files to change**:
        - `src/lib/auth.ts`
        - `src/lib/syntex.ts`
    - Change `const API_URL = "http://localhost:3000";` to:
      ```typescript
      // Use empty string for relative paths since frontend & backend are on same domain
      const API_URL = ""; 
      ```
    - Alternatively, set it to your full Render URL (e.g., `https://sundorjo-ai.onrender.com`), but relative path `""` is safer and easier.

7.  Click **"Create Web Service"**.

## Verification
- Watch the logs. You should see "Server running on http://localhost:..." (Render changes the port internally).
- Once "Live", click the URL. Your updated "Skin Care AI" home page should appear.

## Troubleshooting
- **Frontend not loading?** Ensure `npm run build` ran successfully and created the `dist` folder.
- **Database errors?** Check your `MONGO_URI` in the Environment Variables.
- **"Internal Server Error"?** Check the Render logs for backend crashes.
