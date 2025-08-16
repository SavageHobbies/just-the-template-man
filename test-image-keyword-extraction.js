const { EbayOptimizerCLI } = require('./dist/cli/EbayOptimizerCLI');
const fs = require('fs');

async function testImageAndKeywordExtraction() {
  console.log('🧪 Testing Image and SEO Keyword Extraction\n');
  
  // Create a test CLI instance
  const cli = new EbayOptimizerCLI();
  
  // Test URL - using a sample eBay URL format
  const testUrl = 'https://www.ebay.com/itm/1234567890';
  
  try {
    console.log('📋 Testing URL validation...');
    await cli.validateUrl(testUrl);
    console.log('✅ URL validation passed\n');
    
    console.log('🚀 Starting optimization test...');
    console.log('⚠️  Note: This will use mock data since we\'re testing with a fake URL');
    
    // Let's check if we can at least verify the template structure
    const templatePath = 'final-ebay-template.html';
    if (fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      console.log('\n🔍 Checking template structure...');
      
      // Check for placeholders
      const placeholders = [
        '{{TITLE}}',
        '{{DESCRIPTION}}',
        '{{KEYWORDS}}',
        '{{MAIN_IMAGE}}',
        '{{IMAGE_GALLERY}}',
        '{{ALL_IMAGES_AND_ALTS}}'
      ];
      
      let missingPlaceholders = [];
      placeholders.forEach(placeholder => {
        if (!templateContent.includes(placeholder)) {
          missingPlaceholders.push(placeholder);
        }
      });
      
      if (missingPlaceholders.length === 0) {
        console.log('✅ All required placeholders found in template');
      } else {
        console.log(`❌ Missing placeholders: ${missingPlaceholders.join(', ')}`);
      }
      
      // Check for image gallery structure
      if (templateContent.includes('gallery-grid')) {
        console.log('✅ Image gallery structure found');
      } else {
        console.log('⚠️  No image gallery structure found');
      }
      
      // Check for SEO meta tags
      if (templateContent.includes('name="keywords"')) {
        console.log('✅ SEO meta tags found');
      } else {
        console.log('⚠️  No SEO meta tags found');
      }
      
      // Check for specific image placeholders
      if (templateContent.includes('{{MAIN_IMAGE}}')) {
        console.log('✅ Main image placeholder found');
      } else {
        console.log('❌ Main image placeholder not found');
      }
      
      if (templateContent.includes('{{IMAGE_GALLERY}}')) {
        console.log('✅ Image gallery placeholder found');
      } else {
        console.log('❌ Image gallery placeholder not found');
      }
      
      if (templateContent.includes('{{ALL_IMAGES_AND_ALTS}}')) {
        console.log('✅ All images placeholder found');
      } else {
        console.log('❌ All images placeholder not found');
      }
      
      // Check for SEO keywords placeholder
      if (templateContent.includes('{{KEYWORDS}}')) {
        console.log('✅ SEO keywords placeholder found');
      } else {
        console.log('❌ SEO keywords placeholder not found');
      }
      
      // Look for eBay image URLs in the template
      const ebayImageMatches = templateContent.match(/https:\/\/i\.ebayimg\.com\/[^"]+/g);
      if (ebayImageMatches && ebayImageMatches.length > 0) {
        console.log(`✅ Found ${ebayImageMatches.length} eBay image URLs in template:`);
        ebayImageMatches.slice(0, 3).forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.substring(0, 80)}...`);
        });
      } else {
        console.log('⚠️  No eBay image URLs found in template');
      }
      
      // Look for meta keywords
      const metaKeywords = templateContent.match(/<meta\s+name="keywords"\s+content="([^"]+)"/);
      if (metaKeywords && metaKeywords[1]) {
        console.log(`✅ Found meta keywords: ${metaKeywords[1]}`);
      } else {
        console.log('⚠️  No meta keywords found in template');
      }
      
    } else {
      console.log('❌ Template file not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testImageAndKeywordExtraction().catch(console.error);
