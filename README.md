# Nuren Group Corporate Website

This project is a React-based corporate website for Nuren Group, built with Vite, Tailwind CSS, and Framer Motion.

## Deployment on Netlify

To deploy this project on Netlify, follow these steps:

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket).
2. **Connect your repository to Netlify**:
   - Log in to [Netlify](https://www.netlify.com/).
   - Click "Add new site" > "Import an existing project".
   - Select your Git provider and the repository.
3. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - (These settings are already provided in the `netlify.toml` file).
4. **Set Environment Variables**:
   - Go to "Site settings" > "Environment variables".
   - Add `GEMINI_API_KEY` with your actual Gemini API key.
5. **Deploy**: Click "Deploy site".

## Project Structure

- `src/App.tsx`: Main application component containing all sections (Hero, Products, Newsroom, etc.).
- `src/index.css`: Global styles including Tailwind CSS imports and theme configuration.
- `netlify.toml`: Configuration for Netlify deployment, including build settings and SPA redirects.
- `vite.config.ts`: Vite configuration with environment variable handling and aliases.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
