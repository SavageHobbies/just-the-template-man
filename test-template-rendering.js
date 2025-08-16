const { TemplateRenderer } = require('./dist/services/TemplateRenderer');
const { ContentOptimizer } = require('./dist/services/ContentOptimizer');
const fs = require('fs');

async function testTemplateRendering() {
  console.log('🧪 Testing Template Rendering with Mock Data\n');
  
  // Create mock product data
  const mockProductDetails = {
    title: 'Vintage Star Wars Action Figure',
    description: 'A rare vintage Star Wars action figure from the original trilogy. This figure is in excellent condition and comes complete with original accessories.',
    price: 89.99,
    condition: 'Used',
    images: [
      {
        url: 'https://i.ebayimg.com/images/g/abc123.jpg',
        altText: 'Vintage Star Wars figure front view',
        size: 'large',
        isValid: true
      },
      {
        url: 'https://i.ebayimg.com/images/g/def456.jpg',
        altText: 'Vintage Star Wars figure back view',
        size: 'large',
        isValid: true
      },
      {
        url: 'https://i.ebayimg.com/images/g/ghi789.jpg',
        altText: 'Vintage Star Wars figure side view',
        size: 'medium',
        isValid: true
      },
      {
        url: 'https://i.ebayimg.com/images/g/jkl012.jpg',
        altText: 'Vintage Star Wars figure accessories',
        size: 'medium',
        isValid: true
      },
      {
        url: 'https://i.ebayimg.com/images/g/mno345.jpg',
        altText: 'Vintage Star Wars figure packaging',
        size: 'medium',
        isValid: true
      }
    ],
    specifications: {
      Brand: 'Star Wars',
      Year: '1977',
      Character: 'Luke Skywalker',
      Condition: 'Excellent',
      Material: 'Plastic'
    },
    seller: 'CollectiblesRUs',
    location: 'New York, NY'
  };
  
  // Create mock research data
  const mockResearchData = {
    keywordAnalysis: {
      popularKeywords: ['Star Wars', 'vintage', 'collectible', 'action figure', '1977'],
      keywordFrequency: {
        'Star Wars': 15,
        'vintage': 12,
        'collectible': 10,
        'action figure': 8,
        '1977': 5
      },
      searchVolume: {
        'Star Wars': 1000,
        'vintage': 800,
        'collectible': 600,
        'action figure': 400,
        '1977': 200
      }
    },
    priceAnalysis: {
      averagePrice: 75.50,
      priceRange: { min: 45.00, max: 150.00 },
      recommendedPrice: 89.99,
      confidence: 0.85
    },
    similarListings: [
      { title: 'Vintage Star Wars Luke Skywalker', price: 95.00 },
      { title: 'Original Trilogy Star Wars Figure', price: 80.00 },
      { title: '1977 Star Wars Action Figure', price: 110.00 }
    ]
  };
  
  try {
    console.log('📋 Creating services...');
    
    // Create service instances
    const contentOptimizer = new ContentOptimizer();
    const templateRenderer = new TemplateRenderer();
    
    console.log('🚀 Optimizing content...');
    
    // Optimize content
    const optimizedContent = await contentOptimizer.optimizeContent(mockProductDetails, mockResearchData);
    
    console.log('✅ Content optimization completed');
    console.log(`   - Optimized Title: ${optimizedContent.optimizedTitle}`);
    console.log(`   - Keywords: ${optimizedContent.keywords.join(', ')}`);
    console.log(`   - Suggested Price: $${optimizedContent.suggestedPrice}`);
    
    console.log('\n🖼️ Generating image gallery...');
    
    // Generate image gallery
    const imageGalleryHtml = templateRenderer.generateImageGallery(mockProductDetails.images, 5);
    
    console.log('✅ Image gallery generated');
    console.log(`   - Gallery HTML length: ${imageGalleryHtml.length} characters`);
    
    console.log('\n📄 Rendering template...');
    
    // Render template
    const renderedHtml = await templateRenderer.renderTemplate(
      optimizedContent,
      mockProductDetails,
      'final-ebay-template.html'
    );
    
    console.log('✅ Template rendering completed');
    console.log(`   - HTML length: ${renderedHtml.length} characters`);
    
    // Save the rendered HTML for inspection
    fs.writeFileSync('test-rendered-template.html', renderedHtml);
    console.log('\n💾 Saved rendered template to: test-rendered-template.html');
    
    // Analyze the rendered HTML
    console.log('\n🔍 Analyzing rendered HTML...');
    
    // Check for SEO keywords
    const keywordMatches = renderedHtml.match(/keywords[^>]*content="([^"]+)"/g);
    if (keywordMatches && keywordMatches.length > 0) {
      console.log('✅ Found SEO keywords in template:');
      keywordMatches.forEach(match => {
        const keywords = match.match(/content="([^"]+)"/)[1];
        console.log(`   ${keywords}`);
      });
    } else {
      console.log('❌ No SEO keywords found in template');
    }
    
    // Check for meta description
    const descMatch = renderedHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    if (descMatch && descMatch[1]) {
      console.log(`✅ Found meta description: ${descMatch[1].substring(0, 100)}...`);
    } else {
      console.log('❌ No meta description found in template');
    }
    
    // Check for title
    const titleMatch = renderedHtml.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      console.log(`✅ Found title: ${titleMatch[1]}`);
    } else {
      console.log('❌ No title found in template');
    }
    
    // Check for images
    const imageMatches = renderedHtml.match(/https:\/\/i\.ebayimg\.com\/[^"]+/g);
    if (imageMatches && imageMatches.length > 0) {
      console.log(`✅ Found ${imageMatches.length} images in template:`);
      imageMatches.slice(0, 5).forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.substring(0, 80)}...`);
      });
    } else {
      console.log('❌ No eBay images found in template');
    }
    
    // Check for image gallery
    if (renderedHtml.includes('gallery-grid')) {
      console.log('✅ Image gallery found in template');
    } else {
      console.log('❌ No image gallery found in template');
    }
    
    // Check for main image
    if (renderedHtml.includes('src="https://i.ebayimg.com/')) {
      console.log('✅ Main eBay image found in template');
    } else {
      console.log('❌ No main eBay image found in template');
    }
    
    // Check for product details
    if (renderedHtml.includes('detail-item')) {
      console.log('✅ Product details found in template');
    } else {
      console.log('❌ No product details found in template');
    }
    
    // Check for selling points
    if (renderedHtml.includes('li>Item as shown in photosli>')) {
      console.log('✅ Selling points found in template');
    } else {
      console.log('❌ No selling points found in template');
    }
    
    // Check for item specifics
    if (renderedHtml.includes('Condition:')) {
      console.log('✅ Item specifics found in template');
    } else {
      console.log('❌ No item specifics found in template');
    }
    
    // Check for unprocessed placeholders
    const unprocessedPlaceholders = renderedHtml.match(/{{[^}]+}}/g);
    if (unprocessedPlaceholders) {
      console.log(`❌ Found ${unprocessedPlaceholders.length} unprocessed placeholders:`);
      unprocessedPlaceholders.forEach(placeholder => {
        console.log(`   ${placeholder}`);
      });
    } else {
      console.log('✅ No unprocessed placeholders found');
    }
    
    console.log('\n🏁 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testTemplateRendering().catch(console.error);
