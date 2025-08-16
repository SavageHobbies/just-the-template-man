const { StockImageService } = require('./src/services/StockImageService.ts');

async function testUPCPriority() {
  console.log('Testing UPC database priority system...\n');
  
  const stockImageService = new StockImageService();
  
  // Test with a known UPC (you can replace this with your actual UPC)
  const testUPC = '885370896532'; // Example UPC for testing
  
  try {
    console.log('Testing with UPC: ' + testUPC);
    console.log('Expected order: upcdatabase.org -> UPCitemdb.com -> Amazon\n');
    
    const result = await stockImageService.fetchStockImage(testUPC);
    
    if (result) {
      console.log('✅ Successfully found image:');
      console.log('   URL: ' + result.url);
      console.log('   Alt Text: ' + result.altText);
      console.log('   Size: ' + result.size);
      console.log('   Valid: ' + result.isValid);
    } else {
      console.log('❌ No image found');
    }
    
  } catch (error) {
    console.error('Error during test: ' + error.message);
  }
  
  // Test with title-based search
  console.log('\n--- Testing Title-Based Search ---');
  const testTitle = 'Funko Pop Batman';
  
  try {
    console.log(`Testing with title: ${testTitle}`);
    
    const result = await stockImageService.fetchStockImage(undefined, testTitle);
    
    if (result) {
      console.log('✅ Successfully found image:');
      console.log(`   URL: ${result.url}`);
      console.log(`   Alt Text: ${result.altText}`);
      console.log(`   Size: ${result.size}`);
      console.log(`   Valid: ${result.isValid}`);
    } else {
      console.log('❌ No image found');
    }
    
  } catch (error) {
    console.error('Error during title test:', error.message);
  }
}

// Run the test
testUPCPriority().catch(console.error);
