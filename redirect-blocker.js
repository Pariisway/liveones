// Redirect Blocker - Prevents unwanted redirects
(function() {
    console.log("🛡️ Redirect Blocker Active");
    
    // Store original functions
    const originalLocationAssign = window.location.assign;
    const originalLocationReplace = window.location.replace;
    const originalLocationHrefSet = Object.getOwnPropertyDescriptor(Location.prototype, 'href').set;
    
    // Track all redirect attempts
    window.redirectAttempts = [];
    
    // Override location.assign
    window.location.assign = function(url) {
        console.log("🚨 Redirect attempt via assign() to:", url);
        console.trace("Stack trace:");
        window.redirectAttempts.push({
            method: 'assign',
            url: url,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        return originalLocationAssign.apply(this, arguments);
    };
    
    // Override location.replace
    window.location.replace = function(url) {
        console.log("🚨 Redirect attempt via replace() to:", url);
        console.trace("Stack trace:");
        window.redirectAttempts.push({
            method: 'replace',
            url: url,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        return originalLocationReplace.apply(this, arguments);
    };
    
    // Override location.href setter
    Object.defineProperty(window.location, 'href', {
        set: function(url) {
            console.log("🚨 Redirect attempt via href setter to:", url);
            console.trace("Stack trace:");
            window.redirectAttempts.push({
                method: 'href',
                url: url,
                timestamp: new Date().toISOString(),
                stack: new Error().stack
            });
            return originalLocationHrefSet.call(this, url);
        },
        get: Object.getOwnPropertyDescriptor(Location.prototype, 'href').get
    });
    
    // Monitor page changes
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            console.log("⚠️ Page changed from:", currentUrl);
            console.log("⚠️ Page changed to:", window.location.href);
            currentUrl = window.location.href;
        }
    }, 100);
    
    // Add to window for debugging
    window.debugRedirects = function() {
        console.log("📋 All redirect attempts:", window.redirectAttempts);
        if (window.redirectAttempts.length === 0) {
            console.log("No redirects detected.");
        } else {
            window.redirectAttempts.forEach((attempt, index) => {
                console.log(`Attempt ${index + 1}:`, attempt);
            });
        }
    };
})();
