// Dashboard debug script
console.log("Dashboard Debug Info:");
console.log("Current URL:", window.location.href);
console.log("Current path:", window.location.pathname);
console.log("Current user:", currentUser);
console.log("User data:", userData);
console.log("Session storage justLoggedIn:", sessionStorage.getItem('justLoggedIn'));

// Monitor for redirects
let originalLocation = window.location.href;
setInterval(() => {
    if (window.location.href !== originalLocation) {
        console.log("REDIRECT DETECTED!");
        console.log("From:", originalLocation);
        console.log("To:", window.location.href);
        originalLocation = window.location.href;
    }
}, 100);
