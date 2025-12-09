#!/bin/bash
echo "🚀 DEPLOYING DASHBOARD FIXES"
echo "============================"

echo "Step 1: Stashing any local changes..."
git stash

echo "Step 2: Pulling latest from GitHub..."
git pull origin main --rebase

echo "Step 3: Applying dashboard fix..."
# Create the fixed dashboard file again
cat > dashboard.html << 'DASHBOARD_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-adsense-account" content="ca-pub-1184595877548269">
    <title>Dashboard | WhisperChat</title>
    
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1184595877548269" crossorigin="anonymous"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="styles.css">
    <style>
        .dashboard {
            padding: 100px 0 50px;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
        }
        
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 30px;
        }
        
        .dashboard-sidebar {
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--radius);
            padding: 20px;
            height: fit-content;
            position: sticky;
            top: 100px;
        }
        
        .user-profile {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 20px;
        }
        
        .user-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(108, 99, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 36px;
            color: var(--primary);
            position: relative;
            cursor: pointer;
            overflow: hidden;
        }
        
        .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .user-avatar .upload-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        
        .user-avatar:hover .upload-overlay {
            display: flex;
        }
        
        .user-name {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .user-role {
            display: inline-block;
            background: rgba(108, 99, 255, 0.2);
            color: var(--primary);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .sidebar-nav {
            list-style: none;
            margin-bottom: 30px;
        }
        
        .sidebar-nav li {
            margin-bottom: 10px;
        }
        
        .sidebar-nav a {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 15px;
            color: var(--gray);
            text-decoration: none;
            border-radius: 8px;
            transition: var(--transition);
        }
        
        .sidebar-nav a:hover, .sidebar-nav a.active {
            background: rgba(108, 99, 255, 0.1);
            color: white;
        }
        
        .sidebar-nav a i {
            width: 20px;
            text-align: center;
        }
        
        .quick-stats {
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--radius);
            padding: 20px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .stat-item:last-child {
            border-bottom: none;
        }
        
        .stat-label {
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .stat-value {
            font-weight: 600;
            color: white;
        }
        
        .dashboard-content {
            display: grid;
            gap: 30px;
        }
        
        .dashboard-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--radius);
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .card-header h2 {
            font-size: 1.5rem;
            color: white;
        }
        
        .coins-balance {
            background: var(--gradient);
            padding: 20px;
            border-radius: var(--radius);
            color: white;
            text-align: center;
        }
        
        .coins-balance .balance-label {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 5px;
        }
        
        .coins-balance .balance-amount {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .mode-switch {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        
        .mode-option {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid transparent;
            border-radius: var(--radius);
            padding: 25px;
            text-align: center;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .mode-option.active {
            border-color: var(--primary);
            background: rgba(108, 99, 255, 0.1);
        }
        
        .mode-option i {
            font-size: 40px;
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .mode-option h3 {
            margin-bottom: 10px;
        }
        
        .mode-option p {
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .availability-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: var(--radius);
            margin: 30px 0;
        }
        
        .toggle-label {
            font-weight: 600;
            color: white;
        }
        
        .toggle-description {
            color: var(--gray);
            font-size: 0.9rem;
            margin-top: 10px;
        }
        
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--gray-dark);
            transition: .4s;
            border-radius: 34px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: var(--primary);
        }
        
        input:checked + .slider:before {
            transform: translateX(30px);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: var(--radius);
            text-align: center;
        }
        
        .stat-card i {
            font-size: 30px;
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .stat-card .value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
            background: var(--gradient);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        
        .stat-card .label {
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .recent-calls {
            margin-top: 30px;
        }
        
        .call-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .call-user {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .call-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(108, 99, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary);
        }
        
        .call-info h4 {
            margin-bottom: 5px;
        }
        
        .call-info p {
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .call-status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .status-completed {
            background: rgba(72, 187, 120, 0.2);
            color: var(--success);
        }
        
        .status-missed {
            background: rgba(245, 101, 101, 0.2);
            color: var(--danger);
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: white;
            font-weight: 500;
        }
        
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            font-size: 16px;
            transition: var(--transition);
        }
        
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(108, 99, 255, 0.05);
        }
        
        .btn-save {
            margin-top: 20px;
        }
        
        /* Loading overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 26, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 5px solid rgba(108, 99, 255, 0.3);
            border-top: 5px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
            .dashboard-container {
                grid-template-columns: 1fr;
            }
            
            .dashboard-sidebar {
                position: static;
            }
        }
        
        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .mode-switch {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .dashboard-card {
                padding: 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .card-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
        <h3>Loading Dashboard...</h3>
        <p>Please wait while we check your authentication</p>
    </div>
    
    <!-- Navigation -->
    <nav class="navbar" style="display: none;" id="mainNav">
        <div class="nav-container">
            <div class="nav-brand">
                <i class="fas fa-comment-dots"></i>
                <span>WhisperChat</span>
            </div>
            
            <div class="nav-menu">
                <a href="index.html" class="nav-link">Home</a>
                <a href="index.html#whispers" class="nav-link">Whispers</a>
                <a href="index.html#how-it-works" class="nav-link">How It Works</a>
                <a href="index.html#pricing" class="nav-link">Buy Coins</a>
            </div>
            
            <div class="nav-actions">
                <button id="logoutBtn" class="btn-outline">Log Out</button>
                <button id="buyCoinsBtn" class="btn-primary">Buy Coins</button>
            </div>
            
            <button class="mobile-menu-btn">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </nav>

    <!-- Dashboard -->
    <section class="dashboard" style="display: none;" id="dashboardMain">
        <div class="dashboard-container">
            <!-- Sidebar -->
            <aside class="dashboard-sidebar">
                <div class="user-profile">
                    <div class="user-avatar" id="userAvatar">
                        <i class="fas fa-user-circle"></i>
                        <div class="upload-overlay">
                            <i class="fas fa-camera"></i>
                        </div>
                    </div>
                    <div class="user-name" id="userName">Loading...</div>
                    <div class="user-role" id="userRole">Caller</div>
                </div>
                
                <ul class="sidebar-nav">
                    <li><a href="#overview" class="active" data-section="overview">
                        <i class="fas fa-chart-line"></i> Overview
                    </a></li>
                    <li><a href="#profile" data-section="profile">
                        <i class="fas fa-user-edit"></i> Edit Profile
                    </a></li>
                    <li><a href="#calls" data-section="calls">
                        <i class="fas fa-phone-alt"></i> Call History
                    </a></li>
                    <li><a href="#earnings" data-section="earnings">
                        <i class="fas fa-wallet"></i> Earnings
                    </a></li>
                    <li><a href="#settings" data-section="settings">
                        <i class="fas fa-cog"></i> Settings
                    </a></li>
                    <li><a href="#help" data-section="help">
                        <i class="fas fa-question-circle"></i> Help
                    </a></li>
                </ul>
                
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-label">Your Rating</span>
                        <span class="stat-value" id="userRating">5.0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Member Since</span>
                        <span class="stat-value" id="memberSince">2024</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Response Rate</span>
                        <span class="stat-value" id="responseRate">100%</span>
                    </div>
                </div>
            </aside>
            
            <!-- Main Content -->
            <main class="dashboard-content">
                <!-- Overview Section -->
                <div class="dashboard-card" id="overviewSection">
                    <div class="card-header">
                        <h2>Dashboard Overview</h2>
                        <div class="coins-balance">
                            <div class="balance-label">Whisper Coins</div>
                            <div class="balance-amount" id="coinsBalance">0</div>
                            <button class="btn-secondary btn-small" id="quickBuyCoins">
                                <i class="fas fa-plus"></i> Buy More
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mode Selection -->
                    <div class="mode-section">
                        <h3>Your Current Mode</h3>
                        <div class="mode-switch">
                            <div class="mode-option active" id="whisperMode">
                                <i class="fas fa-ear-listen"></i>
                                <h3>Whisper Mode</h3>
                                <p>Receive calls and earn $12 per call</p>
                            </div>
                            <div class="mode-option" id="callerMode">
                                <i class="fas fa-phone-alt"></i>
                                <h3>Caller Mode</h3>
                                <p>Make calls to whispers (1 coin each)</p>
                            </div>
                        </div>
                        
                        <!-- Availability Toggle -->
                        <div class="availability-toggle" id="availabilitySection">
                            <div>
                                <div class="toggle-label">Available for Calls</div>
                                <p class="toggle-description" id="availabilityDescription">
                                    When available, other users can connect with you instantly
                                </p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="availabilityToggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <button class="btn-primary btn-block" id="saveModeBtn">
                            <i class="fas fa-save"></i> Save Mode Settings
                        </button>
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <i class="fas fa-phone-alt"></i>
                            <div class="value" id="totalCalls">0</div>
                            <div class="label">Total Calls</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-clock"></i>
                            <div class="value" id="totalMinutes">0</div>
                            <div class="label">Minutes Talked</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-wallet"></i>
                            <div class="value" id="totalEarnings">$0</div>
                            <div class="label">Total Earnings</div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-star"></i>
                            <div class="value" id="avgRating">5.0</div>
                            <div class="label">Average Rating</div>
                        </div>
                    </div>
                </div>
                
                <!-- Profile Section (Hidden by default) -->
                <div class="dashboard-card" id="profileSection" style="display: none;">
                    <div class="card-header">
                        <h2>Edit Profile</h2>
                    </div>
                    
                    <form id="profileForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="editDisplayName">Display Name</label>
                                <input type="text" id="editDisplayName" placeholder="Your public name">
                            </div>
                            
                            <div class="form-group">
                                <label for="editCategory">Category</label>
                                <select id="editCategory">
                                    <option value="lifestyle">Lifestyle</option>
                                    <option value="fitness">Fitness</option>
                                    <option value="gaming">Gaming</option>
                                    <option value="music">Music</option>
                                    <option value="art">Art</option>
                                    <option value="education">Education</option>
                                    <option value="business">Business</option>
                                    <option value="entertainment">Entertainment</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editBio">Bio</label>
                            <textarea id="editBio" placeholder="Tell potential callers about yourself..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Social Links</label>
                            <div class="form-grid">
                                <input type="url" id="editInstagram" placeholder="Instagram URL">
                                <input type="url" id="editTwitter" placeholder="Twitter URL">
                                <input type="url" id="editTikTok" placeholder="TikTok URL">
                                <input type="url" id="editYouTube" placeholder="YouTube URL">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Payment Information (For Whispers Only)</label>
                            <div class="form-grid">
                                <input type="text" id="editBankName" placeholder="Bank Name">
                                <input type="text" id="editAccountNumber" placeholder="Account Number">
                                <input type="text" id="editRoutingNumber" placeholder="Routing Number">
                                <input type="text" id="editPayPalEmail" placeholder="PayPal Email">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn-primary btn-block btn-save">
                            <i class="fas fa-save"></i> Save Profile Changes
                        </button>
                    </form>
                </div>
            </main>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" style="display: none;" id="mainFooter">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; 2024 WhisperChat. All rights reserved. | <a href="mailto:contact@iaiwaf.com">contact@iaiwaf.com</a></p>
                <p>Domain: iaiwaf.com | Hosted on GitHub Pages</p>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-storage-compat.js"></script>
    
    <script src="firebase-config.js"></script>
    <script src="scripts.js"></script>
    
    <script>
    // Dashboard-specific JavaScript - SIMPLIFIED VERSION
    document.addEventListener('DOMContentLoaded', function() {
        console.log("Dashboard page loaded");
        
        // Wait for Firebase to initialize
        setTimeout(checkAuthStatus, 1000);
    });
    
    function checkAuthStatus() {
        console.log("Checking auth status...");
        
        // Check if user is logged in
        if (!currentUser) {
            console.log("No user found, checking auth state...");
            
            // Listen for auth state change
            auth.onAuthStateChanged(function(user) {
                if (user) {
                    console.log("User logged in via auth state change");
                    initializeDashboard();
                } else {
                    console.log("No user logged in, redirecting to home");
                    window.location.href = 'index.html';
                }
            });
            
            // Check again after a short delay
            setTimeout(function() {
                if (currentUser) {
                    initializeDashboard();
                }
            }, 2000);
            
        } else {
            console.log("User already logged in:", currentUser.email);
            initializeDashboard();
        }
    }
    
    function initializeDashboard() {
        console.log("Initializing dashboard...");
        
        // Hide loading overlay
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Show main content
        document.getElementById('mainNav').style.display = 'flex';
        document.getElementById('dashboardMain').style.display = 'block';
        document.getElementById('mainFooter').style.display = 'block';
        
        // Load user data
        loadDashboardData();
        
        // Setup event listeners
        setupDashboardEvents();
    }
    
    function loadDashboardData() {
        if (!currentUser) return;
        
        console.log("Loading data for user:", currentUser.uid);
        
        // Simulate loading for now
        setTimeout(function() {
            document.getElementById('userName').textContent = 'PeeWee';
            document.getElementById('coinsBalance').textContent = '0';
        }, 500);
    }
    
    function setupDashboardEvents() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', function() {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
        
        // Buy coins button
        document.getElementById('buyCoinsBtn').addEventListener('click', function() {
            alert('Buy coins feature coming soon!');
        });
        
        document.getElementById('quickBuyCoins').addEventListener('click', function() {
            alert('Buy coins feature coming soon!');
        });
    }
    
    // Make sure auth functions are available
    window.addEventListener('auth-ready', function() {
        console.log("Auth ready event received");
        checkAuthStatus();
    });
    </script>
</body>
</html>
DASHBOARD_EOF

echo "Step 4: Creating a simplified firebase-config.js fix..."
# Add a simple auth check to firebase-config.js
cat > firebase-auth-fix.js << 'AUTH_FIX'
// Add this at the end of firebase-config.js
console.log("Firebase config loaded for dashboard");

// Create a global event to signal when auth is ready
window.dispatchEvent(new Event('auth-ready'));

// Function to check if we can access dashboard
window.canAccessDashboard = function() {
    return new Promise((resolve) => {
        if (currentUser) {
            resolve(true);
        } else {
            // Wait for auth state change
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(!!user);
            });
            
            // Timeout after 3 seconds
            setTimeout(() => {
                unsubscribe();
                resolve(false);
            }, 3000);
        }
    });
};
AUTH_FIX

# Append the fix to firebase-config.js
cat firebase-auth-fix.js >> firebase-config.js
rm firebase-auth-fix.js

echo "Step 5: Committing changes..."
git add dashboard.html firebase-config.js
git commit -m "Fix dashboard loading and authentication issues"

echo "Step 6: Pushing to GitHub..."
git push origin main

echo ""
echo "✅ FIXES DEPLOYED!"
echo "📱 Refresh your site: https://pariisway.github.io/liveones/"
echo ""
echo "🔄 CLEAR CACHE IF NEEDED:"
echo "Chrome: Ctrl+Shift+R (or Ctrl+F5)"
echo "Or open DevTools (F12) → Network tab → Check 'Disable cache' → Reload"
echo ""
echo "🎯 TEST THE FIX:"
echo "1. Log in on home page"
echo "2. Click 'Dashboard' button"
echo "3. Should stay on dashboard without glitching back"
