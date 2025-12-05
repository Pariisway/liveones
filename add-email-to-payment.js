// Simple script to add email collection to payment.html
const fs = require('fs');
let content = fs.readFileSync('payment.html', 'utf8');

// Add email input before the payment form
if (!content.includes('customer-email')) {
    // Find the form or payment section
    const formMatch = content.match(/(<form[^>]*>|<div[^>]*payment[^>]*>)/i);
    if (formMatch) {
        const emailInput = `
            <div class="form-group" style="margin-bottom: 20px;">
                <label for="customer-email" style="display: block; margin-bottom: 8px;">Email Address</label>
                <input type="email" id="customer-email" placeholder="you@example.com" required 
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px;">
            </div>
            <div class="newsletter-optin" style="margin-bottom: 20px;">
                <label style="display: flex; align-items: center;">
                    <input type="checkbox" id="newsletter-optin" checked style="margin-right: 10px;">
                    <span>Subscribe to newsletter for updates</span>
                </label>
            </div>
        `;
        
        content = content.replace(formMatch[0], formMatch[0] + emailInput);
        fs.writeFileSync('payment.html', content);
        console.log('Added email collection to payment.html');
    }
}
