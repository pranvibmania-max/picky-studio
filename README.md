<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4eb627bf-df33-412a-92d6-84d0de944475

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the Gemini API key in a local env file or your deployment platform. The code accepts either `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`.
   - create a file named `.env.local` in the project root containing:
     ```
     VITE_GEMINI_API_KEY="your_key_here"
     ```
3. Start the development server:
   `npm run dev`

### Deploying 🔧
The project is a standard Vite/React build and can be hosted anywhere that serves static files (Vercel, Netlify, GitHub Pages, etc.).

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Make sure the environment variable is set at build time on your hosting provider.
   - on Vercel/Netlify, add `VITE_GEMINI_API_KEY` to the dashboard before deploying.
   - for GitHub Pages, you can use a GitHub Actions workflow that sets the variable.
3. Deploy the contents of the `dist` directory. Most providers automatically pick the `build` script and publish the folder.

> **Responsive design**
> The UI uses Tailwind CSS with mobile‑first utilities. Containers, forms and image previews scale down on phones; navigation tabs scroll horizontally on narrow screens. You can test responsiveness by resizing your browser or using device emulation.

Enjoy your deployable, responsive Picky Studio app!