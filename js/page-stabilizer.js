// Page Stabilizer
console.log('🔧 Page stabilizer loaded');

let pageIsStable = false;

function stabilizePage() {
  if (pageIsStable) return;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finalizeStabilization);
  } else {
    finalizeStabilization();
  }
}

function finalizeStabilization() {
  setTimeout(() => {
    pageIsStable = true;
    console.log('✅ Page stabilized');
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-ready');
  }, 100);
}

window.addEventListener('error', function(e) {
  console.error('Page error:', e.error);
  e.preventDefault();
});

stabilizePage();
window.addEventListener('popstate', stabilizePage);
