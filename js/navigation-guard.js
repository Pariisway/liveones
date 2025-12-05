// Navigation Guard
console.log('🛡️ Navigation guard loaded');

let navigationLock = false;
const NAVIGATION_COOLDOWN = 500;

document.addEventListener('click', function(e) {
  let target = e.target;
  
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
    if (!target) return;
  }
  
  const href = target.getAttribute('href');
  
  if (href && href !== '#' && !href.startsWith('javascript:') && 
      !href.startsWith('mailto:') && !href.startsWith('tel:')) {
    e.preventDefault();
    
    if (navigationLock) return;
    if (Date.now() - (window.lastNavTime || 0) < NAVIGATION_COOLDOWN) return;
    
    navigationLock = true;
    window.lastNavTime = Date.now();
    
    document.body.classList.add('page-transition-out');
    
    setTimeout(() => {
      window.location.href = href;
    }, 300);
    
    setTimeout(() => { navigationLock = false; }, 1000);
  }
}, true);
