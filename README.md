ADDING HTML5 GAMES TO THE LIVE ONES ARCADE
==========================================

There are two types of games you can add:

----------------------------------------------
METHOD 1 — Embed online games via <iframe>
----------------------------------------------
1. Find a game’s embed URL (example from funhtml5games.com).
2. Open index.html.
3. Find the <div class="games-grid">.
4. Add a new iframe:

   <iframe class="game-frame"
           src="GAME_URL_HERE"
           allowfullscreen></iframe>

5. Save, commit, and push to GitHub. Render updates automatically.

----------------------------------------------
METHOD 2 — Add downloaded HTML5 games locally
----------------------------------------------
1. Create a folder inside /games, example:
/games/mygame1/

2. Put all the game's files inside (index.html, JS, assets folder, etc.)

3. Commit and push to GitHub.

4. Embed using:

   <iframe class="game-frame"
           src="games/mygame1/index.html"></iframe>

5. Render serves the game automatically.

----------------------------------------------
IMPORTANT NOTES
----------------------------------------------
• Iframes always require correct paths.
• Use allowfullscreen for games needing full screen.
• Local games must have their own index.html file.
• You can add unlimited games—just add more iframes.
