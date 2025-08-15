const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to validate eBay URL using your REAL CLI
app.post('/api/validate', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Use your ACTUAL CLI to validate the URL
        const command = `node ${path.join(__dirname, '../dist/cli.js')} validate "${url}"`;
        
        const result = await executeCommand(command);
        
        // Check if validation was successful
        if (result.stdout.includes('✅ Valid eBay URL') || result.stdout.includes('Valid eBay URL')) {
            res.json({ 
                valid: true, 
                message: 'Valid eBay URL' 
            });
        } else {
            res.status(400).json({ 
                valid: false, 
                error: 'Invalid eBay URL format' 
            });
        }
        
    } catch (error) {
        console.error('URL validation error:', error);
        res.status(400).json({ 
            valid: false, 
            error: 'Invalid eBay URL or validation failed' 
        });
    }
});

// API endpoint to optimize eBay listing
app.post('/api/optimize', async (req, res) => {
    const { url, targetUrl, useTargetImages = false, preset = 'seller', useCase = 'quality-focus', customImages = [] } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Generate unique filename for this optimization
        const timestamp = Date.now();
        const outputFile = `optimized-${timestamp}.html`;
        const outputPath = path.join(__dirname, 'temp', outputFile);
        
        // Ensure temp directory exists
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // If custom images are provided, create a custom template first
        let templatePath = 'final-ebay-template.html';
        if (customImages && customImages.length > 0) {
            console.log('🎨 Creating custom template with user images...');
            templatePath = await createCustomTemplate(customImages, timestamp);
        }

        // Run the REAL optimization using your CLI
        const optimizeCommand = `node ${path.join(__dirname, '../dist/cli.js')} optimize "${url}" --output "${outputPath}" --template "${templatePath}" --no-interactive`;
        
        console.log('Running command:', optimizeCommand);
        const result = await executeCommand(optimizeCommand);
        console.log('CLI output:', result.stdout);
        
        // Check if output file was created
        if (!fs.existsSync(outputPath)) {
            throw new Error('Optimization failed - no output file generated');
        }

        // Read the generated HTML
        let htmlContent = fs.readFileSync(outputPath, 'utf8');
        
        // Parse the CLI output to extract optimization details
        const optimizationDetails = parseOptimizationOutput(result.stdout);
        
        // Handle different image sources - PRIORITIZE TARGET URL
        let finalHtmlContent = htmlContent;
        
        if (useTargetImages && targetUrl) {
            console.log(`🎯 PRIORITY: Extracting images from target URL: ${targetUrl}`);
            try {
                const targetImages = await extractImagesFromTargetUrl(targetUrl);
                if (targetImages.length > 0) {
                    console.log(`✅ SUCCESS: Extracted ${targetImages.length} images from target URL`);
                    optimizationDetails.images = targetImages;
                    finalHtmlContent = replaceImagesInHtml(htmlContent, targetImages);
                    console.log(`🔄 Replaced images in HTML template with target URL images`);
                } else {
                    console.log('⚠️ WARNING: No images found in target URL, falling back to original');
                    const extractedImages = extractImagesFromHtml(htmlContent);
                    optimizationDetails.images = extractedImages;
                }
            } catch (error) {
                console.error('❌ ERROR: Failed to extract images from target URL:', error.message);
                const extractedImages = extractImagesFromHtml(htmlContent);
                optimizationDetails.images = extractedImages;
            }
        } else if (customImages && customImages.length > 0) {
            console.log(`🖼️ Using ${customImages.length} custom images provided by user`);
            optimizationDetails.images = customImages;
            finalHtmlContent = replaceImagesInHtml(htmlContent, customImages);
        } else {
            console.log('📷 Using images from generated template (no target URL specified)');
            const extractedImages = extractImagesFromHtml(htmlContent);
            optimizationDetails.images = extractedImages;
        }
        
        // Update htmlContent with the final version
        htmlContent = finalHtmlContent;
        
        // Clean up temp file
        fs.unlinkSync(outputPath);
        
        res.json({
            success: true,
            htmlTemplate: htmlContent,
            details: optimizationDetails
        });
        
    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({ 
            error: 'Optimization failed', 
            message: error.message 
        });
    }
});

// API endpoint to get configuration options
app.get('/api/config', (req, res) => {
    res.json({
        presets: [
            { value: 'beginner', label: 'Beginner - Safe & Simple', description: 'Conservative optimization with basic improvements' },
            { value: 'seller', label: 'Seller - Balanced', description: 'Balanced approach with good optimization' },
            { value: 'power-user', label: 'Power User - Maximum', description: 'Aggressive optimization with all features' }
        ],
        useCases: [
            { value: 'speed-focus', label: 'Speed Focus', description: 'Fast processing with basic optimization' },
            { value: 'quality-focus', label: 'Quality Focus', description: 'Thorough analysis and high-quality output' },
            { value: 'high-volume', label: 'High Volume', description: 'Optimized for processing many listings' }
        ]
    });
});

// API endpoint to download template
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'temp', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, 'optimized-ebay-listing.html', (err) => {
            if (!err) {
                // Clean up file after download
                fs.unlinkSync(filePath);
            }
        });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Helper function to execute CLI commands
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command failed: ${error.message}\nStderr: ${stderr}`));
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

// Helper function to parse optimization output from your CLI
function parseOptimizationOutput(output) {
    const details = {
        originalTitle: null,
        optimizedTitle: null,
        originalPrice: null,
        suggestedPrice: null,
        keywords: [],
        sellingPoints: [],
        marketAverage: null
    };

    try {
        // Parse the actual CLI output
        const lines = output.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Extract product details from CLI output
            if (trimmedLine.includes('📦 Original Product Details:')) {
                // Look for title in next few lines
                const titleMatch = output.match(/Title:\s*(.+)/);
                if (titleMatch) {
                    details.originalTitle = titleMatch[1].trim();
                }
                
                // Look for price
                const priceMatch = output.match(/Price:\s*\$?([\d,]+\.?\d*)/);
                if (priceMatch) {
                    details.originalPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                }
            }
            
            // Extract optimized content
            if (trimmedLine.includes('✨ Optimized Content:')) {
                // Look for optimized title
                const optTitleMatch = output.match(/Optimized Title:\s*(.+)/);
                if (optTitleMatch) {
                    details.optimizedTitle = optTitleMatch[1].trim();
                }
                
                // Look for suggested price
                const sugPriceMatch = output.match(/Suggested Price:\s*\$?([\d,]+\.?\d*)/);
                if (sugPriceMatch) {
                    details.suggestedPrice = parseFloat(sugPriceMatch[1].replace(/,/g, ''));
                }
                
                // Look for market average
                const marketAvgMatch = output.match(/Market Average:\s*\$?([\d,]+\.?\d*)/);
                if (marketAvgMatch) {
                    details.marketAverage = parseFloat(marketAvgMatch[1].replace(/,/g, ''));
                }
                
                // Look for confidence level
                const confidenceMatch = output.match(/Market Confidence:\s*(\d+)%/);
                if (confidenceMatch) {
                    details.confidence = parseFloat(confidenceMatch[1]) / 100;
                }
                
                // Look for similar listings count
                const similarListingsMatch = output.match(/Based on (\d+) similar listings/);
                if (similarListingsMatch) {
                    details.similarListings = parseInt(similarListingsMatch[1]);
                }
                
                // Look for keywords
                const keywordsMatch = output.match(/Keywords:\s*(.+)/);
                if (keywordsMatch) {
                    details.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k);
                }
                
                // Look for selling points
                const sellingPointsMatch = output.match(/Selling Points:\s*(\d+)\s*identified/);
                if (sellingPointsMatch) {
                    // Try to extract actual selling points from the output
                    const pointsSection = output.match(/Selling Points:[\s\S]*?(?=\n\n|\n[A-Z]|$)/);
                    if (pointsSection) {
                        const points = pointsSection[0].match(/[-•]\s*(.+)/g);
                        if (points) {
                            details.sellingPoints = points.map(p => p.replace(/^[-•]\s*/, '').trim());
                        }
                    }
                }
            }
        }
        
        console.log('Parsed CLI output:', details);
        
    } catch (error) {
        console.warn('Could not parse CLI optimization output:', error);
        console.log('Raw output was:', output);
    }

    return details;
}

// Helper function to extract REAL images from the generated HTML template
function extractImagesFromHtml(htmlContent) {
    const images = [];
    
    try {
        // Extract main product image
        const mainImageMatch = htmlContent.match(/<img[^>]+src="([^"]+)"[^>]*alt="[^"]*(?:main|product)[^"]*"/i);
        if (mainImageMatch) {
            images.push({
                url: mainImageMatch[1],
                type: 'main',
                altText: 'Main product image'
            });
        }
        
        // Extract gallery images
        const galleryMatches = htmlContent.matchAll(/<div class="gallery-image">\s*<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi);
        for (const match of galleryMatches) {
            images.push({
                url: match[1],
                type: 'gallery',
                altText: match[2] || 'Product image'
            });
        }
        
        // If no specific gallery images found, extract all img tags
        if (images.length <= 1) {
            const allImageMatches = htmlContent.matchAll(/<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi);
            for (const match of allImageMatches) {
                const url = match[1];
                // Skip if already added or if it's a placeholder/icon
                if (!images.some(img => img.url === url) && 
                    !url.includes('placeholder') && 
                    !url.includes('icon') &&
                    url.startsWith('http')) {
                    images.push({
                        url: url,
                        type: 'product',
                        altText: match[2] || 'Product image'
                    });
                }
            }
        }
        
        console.log(`Extracted ${images.length} real images from HTML template`);
        
    } catch (error) {
        console.warn('Could not extract images from HTML:', error);
    }
    
    return images;
}

// Helper function to replace images in HTML template with custom images
function replaceImagesInHtml(htmlContent, customImages) {
    let updatedHtml = htmlContent;
    
    try {
        console.log('🔍 STARTING IMAGE REPLACEMENT');
        console.log('   Original HTML length:', htmlContent.length);
        console.log('   Custom images count:', customImages.length);
        
        // Get main image and gallery images
        const mainImage = customImages.find(img => img.type === 'main') || customImages[0];
        const galleryImages = customImages.filter(img => img.type === 'gallery' || (img.type !== 'main' && img !== mainImage));
        
        console.log('🖼️ MAIN IMAGE:', mainImage?.url?.substring(0, 80) + '...');
        console.log('🖼️ GALLERY IMAGES:', galleryImages.length);
        galleryImages.forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.url?.substring(0, 80)}...`);
        });
        
        // Replace main product image - be more aggressive
        if (mainImage) {
            console.log('🔄 Replacing main product image...');
            
            // Replace {{MAIN_IMAGE}} placeholder
            const mainImageReplacements = updatedHtml.match(/\{\{MAIN_IMAGE\}\}/g);
            if (mainImageReplacements) {
                console.log(`  Found ${mainImageReplacements.length} {{MAIN_IMAGE}} placeholders`);
                updatedHtml = updatedHtml.replace(/\{\{MAIN_IMAGE\}\}/g, mainImage.url);
            }
            
            // Replace any img tag in the product-image section
            const productImageMatches = updatedHtml.match(/<img[^>]+class="[^"]*product-image[^"]*"[^>]*>/g);
            if (productImageMatches) {
                console.log(`  Found ${productImageMatches.length} product-image img tags`);
                updatedHtml = updatedHtml.replace(
                    /<img([^>]+)src="[^"]*"([^>]*class="[^"]*product-image[^"]*"[^>]*)>/g,
                    `<img$1src="${mainImage.url}"$2>`
                );
            }
            
            // Replace the first img tag in the template (likely the main image)
            const firstImgMatch = updatedHtml.match(/<img[^>]+src="[^"]*"[^>]*>/);
            if (firstImgMatch) {
                console.log('  Replacing first img tag as main image');
                updatedHtml = updatedHtml.replace(
                    /<img([^>]+)src="[^"]*"([^>]*)>/,
                    `<img$1src="${mainImage.url}"$2>`
                );
            }
        }
        
        // Replace gallery images - be more aggressive
        if (galleryImages.length > 0) {
            console.log('🔄 Replacing gallery images...');
            
            // Create new gallery HTML - use correct structure for mobile template
            const galleryHtml = galleryImages.map((image, index) => 
                `<img src="${image.url}" alt="${image.altText || `Product image ${index + 1}`}" class="gallery-image" loading="lazy">`
            ).join('\n        ');
            
            console.log('📝 Generated gallery HTML:', galleryHtml.substring(0, 200) + '...');
            
            // Replace {{IMAGE_GALLERY}} placeholder
            const galleryPlaceholders = updatedHtml.match(/\{\{IMAGE_GALLERY\}\}/g);
            if (galleryPlaceholders) {
                console.log(`  Found ${galleryPlaceholders.length} {{IMAGE_GALLERY}} placeholders`);
                updatedHtml = updatedHtml.replace(/\{\{IMAGE_GALLERY\}\}/g, `<div class="gallery-grid">
        ${galleryHtml}
    </div>`);
            }
            
            // Replace existing gallery section
            const existingGallery = updatedHtml.match(/<div class="image-gallery">[\s\S]*?<\/div>/g);
            if (existingGallery) {
                console.log(`  Found ${existingGallery.length} existing gallery sections`);
                updatedHtml = updatedHtml.replace(
                    /<div class="gallery-grid">[\s\S]*?<\/div>/g,
                    `<div class="gallery-grid">
        ${galleryHtml}
    </div>`
                );
            }
            
            // If no gallery section exists, add one after the main image
            if (!updatedHtml.includes('gallery-grid')) {
                console.log('  No gallery section found, adding new one');
                // Find a good place to insert the gallery (after main product image or in a description section)
                const insertPoint = updatedHtml.indexOf('</div>') + 6; // After first closing div
                if (insertPoint > 6) {
                    const beforeInsert = updatedHtml.substring(0, insertPoint);
                    const afterInsert = updatedHtml.substring(insertPoint);
                    updatedHtml = beforeInsert + `
        <div class="description-section">
            <h3>Image Gallery</h3>
            <div class="image-gallery">${galleryHtml}
            </div>
        </div>` + afterInsert;
                }
            }
        }
        
        console.log('🔍 Updated HTML length:', updatedHtml.length);
        console.log('✅ Successfully replaced images in HTML template with custom images');
        
    } catch (error) {
        console.error('❌ Could not replace images in HTML template:', error);
    }
    
    return updatedHtml;
}

// Helper function to create a custom template with user's images
async function createCustomTemplate(customImages, timestamp) {
    try {
        console.log('📄 Reading original template...');
        const originalTemplate = fs.readFileSync(path.join(__dirname, '../final-ebay-template.html'), 'utf8');
        
        // Get main image and gallery images
        const mainImage = customImages.find(img => img.type === 'main') || customImages[0];
        const galleryImages = customImages.filter(img => img.type === 'gallery' || (img.type !== 'main' && img !== mainImage));
        
        console.log('🖼️ Using main image:', mainImage?.url);
        console.log('🖼️ Using gallery images:', galleryImages.length);
        
        let customTemplate = originalTemplate;
        
        // Replace main image placeholder with actual URL
        if (mainImage) {
            // Instead of using {{MAIN_IMAGE}}, directly put the URL
            customTemplate = customTemplate.replace(
                'src="{{MAIN_IMAGE}}"',
                `src="${mainImage.url}"`
            );
            console.log('✅ Replaced main image placeholder');
        }
        
        // Replace gallery placeholder with actual gallery HTML
        if (galleryImages.length > 0) {
            const galleryHtml = galleryImages.map((image, index) => `
        <div class="gallery-image">
          <img src="${image.url}" alt="${image.altText || `Product image ${index + 1}`}" loading="lazy">
        </div>`).join('');
            
            customTemplate = customTemplate.replace(
                '{{IMAGE_GALLERY}}',
                `<div class="image-gallery">${galleryHtml}
      </div>`
            );
            console.log('✅ Replaced gallery placeholder');
        }
        
        // Save custom template
        const customTemplatePath = path.join(__dirname, 'temp', `custom-template-${timestamp}.html`);
        fs.writeFileSync(customTemplatePath, customTemplate);
        console.log('💾 Saved custom template:', customTemplatePath);
        
        return customTemplatePath;
        
    } catch (error) {
        console.error('❌ Error creating custom template:', error);
        return 'final-ebay-template.html'; // Fallback to original
    }
}

// Helper function to extract images from target eBay URL
async function extractImagesFromTargetUrl(targetUrl) {
    const images = [];
    
    try {
        console.log(`🔍 STARTING: Scraping target URL for images: ${targetUrl}`);
        
        // Use your CLI to scrape the target URL
        const timestamp = Date.now();
        const tempOutputPath = path.join(__dirname, 'temp', `temp-target-${timestamp}.html`);
        
        // Ensure temp directory exists
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log(`📁 Created temp directory: ${tempDir}`);
        }
        
        const command = `node ${path.join(__dirname, '../dist/cli.js')} optimize "${targetUrl}" --output "${tempOutputPath}" --no-interactive`;
        console.log(`🚀 Running command: ${command}`);
        
        const result = await executeCommand(command);
        console.log(`📋 CLI execution completed. Output length: ${result.stdout.length}`);
        
        // Check if output file was created
        if (fs.existsSync(tempOutputPath)) {
            console.log(`✅ Target HTML file created: ${tempOutputPath}`);
            const targetHtml = fs.readFileSync(tempOutputPath, 'utf8');
            console.log(`📄 Target HTML length: ${targetHtml.length} characters`);
            
            const extractedImages = extractImagesFromHtml(targetHtml);
            console.log(`🖼️ Images extracted from target HTML:`, extractedImages.map(img => ({ type: img.type, url: img.url.substring(0, 50) + '...' })));
            
            // Clean up temp file
            fs.unlinkSync(tempOutputPath);
            console.log(`🗑️ Cleaned up temp file: ${tempOutputPath}`);
            
            console.log(`📸 FINAL RESULT: Extracted ${extractedImages.length} images from target URL`);
            return extractedImages;
        } else {
            console.error('❌ ERROR: No output file generated from target URL');
            console.log('📋 CLI stdout:', result.stdout);
            console.log('📋 CLI stderr:', result.stderr);
            return [];
        }
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR extracting images from target URL:');
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
        return [];
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 eBay Listing Optimizer Web Interface running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔧 CLI backend: ${path.join(__dirname, '../dist/cli.js')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});

module.exports = app;