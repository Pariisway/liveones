THE LIVE ONES - QUICK DEPLOY & PREVIEW

1) Create a folder on your computer, e.g. "the-live-ones-site"
   Put these files inside:
     - index.html
     - styles.css
     - app.js
     - README.txt
     - .gitignore (optional)

2) Local preview (recommended: use a simple local webserver)
   - Why: some scripts (AdSense, iframes, Agora) don't run correctly when you open index.html directly (file://).
   - Option A: Use Python (very easy)
       - If you have Python 3 installed:
       - Open Terminal (Mac) or Command Prompt (Windows)
       - cd to the folder containing your files
       - Run: python -m http.server 8000
       - Open browser to: http://localhost:8000
   - Option B: Use a small app like "Live Server" in VS Code or "http-server" (Node.js)

3) Test Agora locally
   - Click "Join Voice Room" and allow microphone access.
   - You should see "You joined" status and be able to speak into mic. (Testing with one browser works; to test multiple participants, open the URL on another device or browser.)

4) AdSense notes
   - AdSense Auto Ads will still require that your site is served from a real URL (not file://).
   - AdSense may not show ads until Google has scanned and approved the site / domain.
   - If using Render or your real domain, AdSense Auto Ads will work and place ads automatically.

5) Deploy to Render (recommended, free for static sites)
   - Create a GitHub repo with the files.
   - Log into https://render.com -> New -> Static Site
   - Connect the GitHub repo, select "main" branch.
   - Build Command: leave blank
   - Publish Directory: .
   - Create the site. Render will give you a public URL like https://your-site-name.onrender.com

6) Point your DreamHost domain (optional)
   - Either host on DreamHost directly (upload via SFTP to your domain root), OR
   - Point your DreamHost DNS to Render:
     - Add a CNAME record for 'www' to your-site-name.onrender.com
     - Add the A record(s) Render instructs for the root domain (Render dashboard -> custom domains)
   - Wait ~10-30 minutes for DNS to propagate.

7) Production security for Agora
   - This setup uses no TOKEN (testing only). For production, create a small server that issues temporary tokens using your Agora App Certificate. Do NOT place your App Certificate in client-side code.

8) Need help?
   - Tell me which step you are on and I will walk you through it line-by-line.