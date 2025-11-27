// Script to validate your sitemap (save as validate-sitemap.js)
const axios = require('axios');
const { parseString } = require('xml2js');

class SitemapValidator {
  constructor(sitemapUrl) {
    this.sitemapUrl = sitemapUrl;
  }
  
  async validate() {
    try {
      // Fetch sitemap
      const response = await axios.get(this.sitemapUrl);
      
      // Parse XML
      parseString(response.data, (err, result) => {
        if (err) {
          console.error('❌ Sitemap parsing failed:', err);
          return;
        }
        
        const urls = result.urlset.url;
        console.log(`✅ Sitemap valid! Contains ${urls.length} URLs`);
        
        // Check each URL
        urls.forEach((url, index) => {
          console.log(`${index + 1}. ${url.loc[0]} (Priority: ${url.priority[0]})`);
        });
      });
      
    } catch (error) {
      console.error('❌ Sitemap validation failed:', error.message);
    }
  }
}

// Usage:
const validator = new SitemapValidator('https://yourwebsite.com/sitemap.xml');
validator.validate();
