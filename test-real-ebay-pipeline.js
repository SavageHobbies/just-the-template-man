const { EbayOptimizerCLI } = require('./dist/cli/EbayOptimizerCLI');
const fs = require('fs');

async function testRealEbayPipeline() {
  console.log('🧪 Testing Real eBay URL Pipeline\n');
  
  // Create a test CLI instance
  const cli = new EbayOptimizerCLI();
  
  // Use a real eBay URL for testing
  const testUrl = 'https://www.ebay.com/itm/404672911915';
  
  try {
    console.log('📋 Testing URL validation...');
    await cli.validateUrl(testUrl);
    console.log('✅ URL validation passed\n');
    
    console.log('🚀 Starting optimization with real eBay URL...');
    
    // Process the real eBay URL
    await cli.optimize(testUrl, { 
      output: 'real-ebay-pipeline-test-output.html',
      interactive: false 
    });
    
    console.log('✅ Optimization completed successfully!');
    
    // Check if the output file was created
    if (fs.existsSync('real-ebay-pipeline-test-output.html')) {
      const htmlContent = fs.readFileSync('real-ebay-pipeline-test-output.html', 'utf8');
      
      console.log('\n🔍 Analyzing generated HTML template...');
      
      // Check for images
      const imageMatches = htmlContent.match(/https:\/\/i\.ebayimg\.com\/[^"]+/g);
      if (imageMatches && imageMatches.length > 0) {
        console.log(`✅ Found ${imageMatches.length} images in template:`);
        imageMatches.slice(0, 5).forEach((img, index) => {
          console.log(`   ${index + 1}. ${img.substring(0, 80)}...`);
        });
      } else {
        console.log('⚠️  No eBay images found in template');
      }
      
      // Check for SEO keywords
      const keywordMatches = htmlContent.match(/keywords[^>]*content="([^"]+)"/g);
      if (keywordMatches && keywordMatches.length > 0) {
        console.log('\n✅ Found SEO keywords in template:');
        keywordMatches.forEach(match => {
          const keywords = match.match(/content="([^"]+)"/)[1];
          console.log(`   ${keywords}`);
        });
      } else {
        console.log('⚠️  No SEO keywords found in template');
      }
      
      // Check for {{KEYWORDS}} placeholder
      if (htmlContent.includes('{{KEYWORDS}}')) {
        console.log('❌ Found unprocessed {{KEYWORDS}} placeholder');
      } else {
        console.log('✅ No unprocessed {{KEYWORDS}} placeholder found');
      }
      
      // Check for {{ALL_IMAGES_AND_ALTS}} placeholder
      if (htmlContent.includes('{{ALL_IMAGES_AND_ALTS}}')) {
        console.log('❌ Found unprocessed {{ALL_IMAGES_AND_ALTS}} placeholder');
      } else {
        console.log('✅ No unprocessed {{ALL_IMAGES_AND_ALTS}} placeholder found');
      }
      
      // Check for image gallery
      if (htmlContent.includes('gallery-grid')) {
        console.log('✅ Image gallery found in template');
      } else {
        console.log('⚠️  No image gallery found in template');
      }
      
      // Check for main image
      if (htmlContent.includes('src="https://i.ebayimg.com/')) {
        console.log('✅ Main eBay image found in template');
      } else {
        console.log('⚠️  No main eBay image found in template');
      }
      
      // Check for meta keywords
      const metaKeywords = htmlContent.match(/<meta\s+name="keywords"\s+content="([^"]+)"/);
      if (metaKeywords && metaKeywords[1]) {
        console.log(`✅ Found meta keywords: ${metaKeywords[1]}`);
      } else {
        console.log('⚠️  No meta keywords found in template');
      }
      
      // Check for title
      if (htmlContent.includes('<title>')) {
        const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
        if (titleMatch && titleMatch[1]) {
          console.log(`✅ Found title: ${titleMatch[1]}`);
        } else {
          console.log('⚠️  No title found in template');
        }
      } else {
        console.log('⚠️  No title found in template');
      }
      
      // Check for description
      if (htmlContent.includes('<meta name="description"')) {
        const descMatch = htmlContent.match(/<meta\s+name="description"\s+content="([^"]+)"/);
        if (descMatch && descMatch[1]) {
          console.log(`✅ Found description: ${descMatch[1].substring(0, 100)}...`);
        } else {
          console.log('⚠️  No description found in template');
        }
      } else {
        console.log('⚠️  No description found in template');
      }
      
      // Check for product details
      if (htmlContent.includes('detail-item')) {
        console.log('✅ Product details found in template');
      } else {
        console.log('⚠️  No product details found in template');
      }
      
      // Check for selling points
      if (htmlContent.includes('li>Item as shown in photosli>')) {
        console.log('✅ Selling points found in template');
      } else {
        console.log('⚠️  No selling points found in template');
      }
      
      // Check for item specifics
      if (htmlContent.includes('Condition:')) {
        console.log('✅ Item specifics found in template');
      } else {
        console.log('⚠️  No item specifics found in template');
      }
      
      // Clean up
      fs.unlinkSync('real-ebay-pipeline-test-output.html');
      console.log('\n🧹 Cleaned up test file');
      
    } else {
      console.log('❌ Output file was not created');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // If the test failed, let's check what went wrong
    console.log('\n🔍 Debugging the failure...');
    
    // Check if we can at least verify the template structure
    const templatePath = 'final-ebay-template.html';
    if (fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      console.log('\n📋 Template structure check:');
      
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
      
      // Check for eBay image URLs
      const ebayImageMatches = templateContent.match(/https:\/\/i\.ebayimg\.com\/[^"]+/g);
      if (ebayImageMatches && ebayImageMatches.length > 0) {
        console.log(`✅ Found ${ebayImageMatches.length} eBay image URLs in template`);
      } else {
        console.log('⚠️  No eBay image URLs found in template');
      }
      
    } else {
      console.log('❌ Template file not found');
    }
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testRealEbayPipeline().catch(console.error);
