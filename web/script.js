// eBay Listing Optimizer Web Interface
class EbayOptimizerUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentResults = null;
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('optimizerForm');
        this.urlInput = document.getElementById('ebayUrl');
        this.validateBtn = document.getElementById('validateBtn');
        this.urlStatus = document.getElementById('urlStatus');
        this.targetUrlInput = document.getElementById('targetUrl');
        this.validateTargetBtn = document.getElementById('validateTargetBtn');
        this.targetUrlStatus = document.getElementById('targetUrlStatus');
        this.useTargetImages = document.getElementById('useTargetImages');
        this.presetSelect = document.getElementById('preset');
        this.useCaseSelect = document.getElementById('useCase');
        this.optimizeBtn = document.getElementById('optimizeBtn');

        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.steps = {
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            step3: document.getElementById('step3'),
            step4: document.getElementById('step4'),
            step5: document.getElementById('step5')
        };

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.titleComparison = document.getElementById('titleComparison');
        this.pricingInfo = document.getElementById('pricingInfo');
        this.keywordsList = document.getElementById('keywordsList');
        this.sellingPoints = document.getElementById('sellingPoints');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.newOptimizationBtn = document.getElementById('newOptimizationBtn');
        this.htmlCodeBlock = document.getElementById('htmlCodeBlock');
        this.copyCodeBtn = document.getElementById('copyCodeBtn');

        // Modal elements
        this.previewModal = document.getElementById('previewModal');
        this.previewFrame = document.getElementById('previewFrame');
        this.closeModal = document.getElementById('closeModal');

        // Custom images elements
        this.useCustomImages = document.getElementById('useCustomImages');
        this.customImagesContainer = document.getElementById('customImagesContainer');
        this.imageInputs = document.getElementById('imageInputs');
        this.addImageBtn = document.getElementById('addImageBtn');
        this.previewImagesBtn = document.getElementById('previewImagesBtn');
    }

    bindEvents() {
        // URL validation
        this.urlInput.addEventListener('input', () => this.validateUrl());
        this.validateBtn.addEventListener('click', () => this.validateUrl(true));
        this.targetUrlInput.addEventListener('input', () => this.validateTargetUrl());
        this.validateTargetBtn.addEventListener('click', () => this.validateTargetUrl(true));

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleOptimize(e));

        // Results actions
        this.downloadBtn.addEventListener('click', () => this.downloadTemplate());
        this.previewBtn.addEventListener('click', () => this.previewTemplate());
        this.newOptimizationBtn.addEventListener('click', () => this.resetForm());
        this.copyCodeBtn.addEventListener('click', () => this.copyHtmlCode());

        // Modal
        this.closeModal.addEventListener('click', () => this.closePreviewModal());
        this.previewModal.addEventListener('click', (e) => {
            if (e.target === this.previewModal) {
                this.closePreviewModal();
            }
        });

        // Custom images events
        this.useCustomImages.addEventListener('change', () => this.toggleCustomImages());
        this.addImageBtn.addEventListener('click', () => this.addImageInput());
        this.previewImagesBtn.addEventListener('click', () => this.previewCustomImages());
        
        // Add event listeners to existing image inputs
        this.setupImageInputListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePreviewModal();
            }
        });
    }

    validateUrl(showFeedback = false) {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.hideValidateButton();
            this.clearUrlStatus();
            return false;
        }

        const isValid = this.isValidEbayUrl(url);
        
        if (showFeedback) {
            if (isValid) {
                this.showUrlStatus('✓ Valid eBay URL', 'valid');
            } else {
                this.showUrlStatus('✗ Please enter a valid eBay listing URL', 'invalid');
            }
        }

        if (isValid) {
            this.showValidateButton();
        } else {
            this.hideValidateButton();
        }

        return isValid;
    }

    isValidEbayUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('ebay.com') && 
                   (urlObj.pathname.includes('/itm/') || urlObj.pathname.includes('/p/'));
        } catch {
            return false;
        }
    }

    showValidateButton() {
        this.validateBtn.classList.add('show');
    }

    hideValidateButton() {
        this.validateBtn.classList.remove('show');
    }

    showUrlStatus(message, type) {
        this.urlStatus.textContent = message;
        this.urlStatus.className = `url-status ${type}`;
    }

    clearUrlStatus() {
        this.urlStatus.textContent = '';
        this.urlStatus.className = 'url-status';
    }

    validateTargetUrl(showFeedback = false) {
        const url = this.targetUrlInput.value.trim();
        
        if (!url) {
            this.hideTargetValidateButton();
            this.clearTargetUrlStatus();
            return false;
        }

        const isValid = this.isValidEbayUrl(url);
        
        if (showFeedback) {
            if (isValid) {
                this.showTargetUrlStatus('✓ Valid target eBay URL', 'valid');
            } else {
                this.showTargetUrlStatus('✗ Please enter a valid eBay listing URL', 'invalid');
            }
        }

        if (isValid) {
            this.showTargetValidateButton();
        } else {
            this.hideTargetValidateButton();
        }

        return isValid;
    }

    showTargetValidateButton() {
        this.validateTargetBtn.classList.add('show');
    }

    hideTargetValidateButton() {
        this.validateTargetBtn.classList.remove('show');
    }

    showTargetUrlStatus(message, type) {
        this.targetUrlStatus.textContent = message;
        this.targetUrlStatus.className = `url-status ${type}`;
    }

    clearTargetUrlStatus() {
        this.targetUrlStatus.textContent = '';
        this.targetUrlStatus.className = 'url-status';
    }

    async handleOptimize(e) {
        e.preventDefault();
        
        if (!this.validateUrl()) {
            this.showUrlStatus('Please enter a valid eBay URL', 'invalid');
            return;
        }

        const formData = {
            url: this.urlInput.value.trim(),
            targetUrl: this.targetUrlInput.value.trim(),
            useTargetImages: this.useTargetImages.checked,
            preset: this.presetSelect.value,
            useCase: this.useCaseSelect.value,
            customImages: this.getCustomImages()
        };

        this.startOptimization(formData);
    }

    async startOptimization(formData) {
        // Hide form and show progress
        this.form.style.display = 'none';
        this.progressSection.style.display = 'block';
        this.resultsSection.style.display = 'none';

        // Disable optimize button
        this.optimizeBtn.disabled = true;

        try {
            // Call the REAL optimization process
            await this.realOptimization(formData);
        } catch (error) {
            this.handleOptimizationError(error);
        }
    }

    async realOptimization(formData) {
        try {
            // Call the actual backend API
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Optimization failed');
            }

            // Track progress through the actual steps
            const steps = [
                { id: 'step1', name: 'Scraping eBay listing' },
                { id: 'step2', name: 'Extracting product details' },
                { id: 'step3', name: 'Analyzing market data' },
                { id: 'step4', name: 'Optimizing content' },
                { id: 'step5', name: 'Generating template' }
            ];

            // Show progress as the backend processes
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                
                // Mark step as active
                this.steps[step.id].classList.add('active');
                
                // Wait a bit for visual feedback
                await this.delay(500);
                
                // Mark step as completed
                this.steps[step.id].classList.remove('active');
                this.steps[step.id].classList.add('completed');
                
                // Update progress bar
                const progress = ((i + 1) / steps.length) * 100;
                this.progressFill.style.width = `${progress}%`;
            }

            // Get the actual results from your CLI
            const results = await response.json();
            this.showResults(results);

        } catch (error) {
            console.error('Real optimization error:', error);
            throw error;
        }
    }



    showResults(results) {
        this.currentResults = results;
        
        // Hide progress and show results
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'block';

        // Use REAL data from your CLI backend
        const details = results.details || {};
        
        // Populate results with ACTUAL data
        this.titleComparison.innerHTML = `
            <div class="comparison-item original">
                <strong>Original:</strong> ${details.originalTitle || 'Original listing title'}
            </div>
            <div class="comparison-item optimized">
                <strong>Optimized:</strong> ${details.optimizedTitle || 'Optimized listing title'}
            </div>
        `;

        // Enhanced pricing analysis display
        const originalPrice = parseFloat(details.originalPrice) || 0;
        const suggestedPrice = parseFloat(details.suggestedPrice) || 0;
        const marketAverage = parseFloat(details.marketAverage) || 0;
        const priceDiff = suggestedPrice - originalPrice;
        const percentChange = originalPrice > 0 ? ((priceDiff / originalPrice) * 100).toFixed(1) : '0.0';
        
        this.pricingInfo.innerHTML = `
            <div class="pricing-analysis">
                <div class="price-comparison">
                    <div class="price-item original">
                        <span class="price-label">Original Price</span>
                        <span class="price-value">$${originalPrice.toFixed(2)}</span>
                    </div>
                    <div class="price-item suggested ${priceDiff > 0 ? 'increase' : priceDiff < 0 ? 'decrease' : 'same'}">
                        <span class="price-label">Suggested Price</span>
                        <span class="price-value">$${suggestedPrice.toFixed(2)}</span>
                        ${priceDiff !== 0 ? `<span class="price-change">${priceDiff > 0 ? '+' : ''}$${priceDiff.toFixed(2)} (${percentChange}%)</span>` : ''}
                    </div>
                    ${marketAverage > 0 ? `
                    <div class="price-item market">
                        <span class="price-label">Market Average</span>
                        <span class="price-value">$${marketAverage.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="pricing-insights">
                    ${this.generatePricingInsights(originalPrice, suggestedPrice, marketAverage, details)}
                </div>
                
                ${details.confidence ? `
                <div class="confidence-meter">
                    <span class="confidence-label">Analysis Confidence</span>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${Math.round(details.confidence * 100)}%"></div>
                    </div>
                    <span class="confidence-value">${Math.round(details.confidence * 100)}%</span>
                </div>
                ` : ''}
            </div>
        `;

        this.keywordsList.innerHTML = (details.keywords || [])
            .map(keyword => `<span class="keyword-tag">${keyword}</span>`)
            .join('') || '<span class="keyword-tag">No keywords extracted</span>';

        this.sellingPoints.innerHTML = (details.sellingPoints || [])
            .map(point => `<div class="selling-point">${point}</div>`)
            .join('') || '<div class="selling-point">No selling points identified</div>';

        // Display REAL images from the actual listing
        this.displayRealImages(details.images || []);

        // Store the REAL HTML template
        this.currentResults.htmlTemplate = results.htmlTemplate;

        // Display HTML code for easy copy-paste
        this.displayHtmlCode(results.htmlTemplate);

        // Re-enable optimize button
        this.optimizeBtn.disabled = false;
    }

    displayRealImages(images) {
        const productImagesContainer = document.getElementById('productImages');
        const imageUrlsContainer = document.getElementById('imageUrlsContainer');
        
        if (!images || images.length === 0) {
            productImagesContainer.innerHTML = '<p style="color: #64748b; font-size: 0.875rem;">No images found in listing</p>';
            imageUrlsContainer.innerHTML = '<p style="color: #64748b; font-size: 0.875rem;">No image URLs available</p>';
            return;
        }

        // Display the REAL images from the actual eBay listing
        productImagesContainer.innerHTML = images.map((image, index) => {
            const isMain = image.type === 'main' || index === 0;
            return `
                <div class="product-image ${isMain ? 'main' : ''}" title="${image.altText}">
                    <img src="${image.url}" alt="${image.altText}" loading="lazy" 
                         onerror="this.parentElement.style.display='none'">
                </div>
            `;
        }).join('');

        // Display image URLs with one-click copy functionality
        imageUrlsContainer.innerHTML = images.map((image, index) => {
            const isMain = image.type === 'main' || index === 0;
            const imageType = isMain ? 'Main Image' : `Gallery Image ${index}`;
            return `
                <div class="image-url-item">
                    <div class="image-url-header">
                        <span class="image-type">${imageType}</span>
                        <button class="copy-url-btn" onclick="navigator.clipboard.writeText('${image.url}').then(() => this.innerHTML='<i class=\"fas fa-check\"></i> Copied!').catch(() => {});">
                            <i class="fas fa-copy"></i> Copy URL
                        </button>
                    </div>
                    <div class="image-url-preview">
                        <img src="${image.url}" alt="${imageType}" onerror="this.style.display='none'">
                    </div>
                    <div class="image-url-text">${image.url}</div>
                </div>
            `;
        }).join('');

        console.log(`Displayed ${images.length} real images from the actual eBay listing`);
    }

    downloadTemplate() {
        if (!this.currentResults) return;

        const blob = new Blob([this.currentResults.htmlTemplate], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized-ebay-listing.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        this.showNotification('Template downloaded successfully!', 'success');
    }

    previewTemplate() {
        if (!this.currentResults) return;

        const blob = new Blob([this.currentResults.htmlTemplate], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        this.previewFrame.src = url;
        this.previewModal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Clean up URL after modal is closed
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    closePreviewModal() {
        this.previewModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.previewFrame.src = '';
    }

    resetForm() {
        // Reset form
        this.form.reset();
        this.clearUrlStatus();
        this.hideValidateButton();

        // Show form, hide other sections
        this.form.style.display = 'flex';
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';

        // Reset progress
        this.progressFill.style.width = '0%';
        Object.values(this.steps).forEach(step => {
            step.classList.remove('active', 'completed');
        });

        // Clear results
        this.currentResults = null;

        // Re-enable optimize button
        this.optimizeBtn.disabled = false;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleOptimizationError(error) {
        console.error('Optimization error:', error);
        
        // Show error message
        this.showNotification('Optimization failed. Please try again.', 'error');
        
        // Reset to form
        this.resetForm();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);

        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    toggleCustomImages() {
        if (this.useCustomImages.checked) {
            this.customImagesContainer.style.display = 'block';
        } else {
            this.customImagesContainer.style.display = 'none';
        }
    }

    addImageInput() {
        const imageCount = this.imageInputs.children.length;
        const inputGroup = document.createElement('div');
        inputGroup.className = 'image-input-group';
        
        inputGroup.innerHTML = `
            <label>Gallery Image ${imageCount}</label>
            <input type="url" class="image-url-input" placeholder="https://i.ebayimg.com/images/g/..." data-type="gallery">
            <div class="image-preview" style="display: none;"></div>
        `;
        
        this.imageInputs.appendChild(inputGroup);
        
        // Add event listener for the new input
        const newInput = inputGroup.querySelector('.image-url-input');
        newInput.addEventListener('input', (e) => this.validateImageUrl(e.target));
        newInput.addEventListener('blur', (e) => this.previewImage(e.target));
    }

    validateImageUrl(input) {
        const url = input.value.trim();
        
        if (!url) {
            input.classList.remove('valid', 'invalid');
            return;
        }
        
        try {
            new URL(url);
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('ebayimg.com')) {
                input.classList.add('valid');
                input.classList.remove('invalid');
            } else {
                input.classList.add('invalid');
                input.classList.remove('valid');
            }
        } catch {
            input.classList.add('invalid');
            input.classList.remove('valid');
        }
    }

    previewImage(input) {
        const url = input.value.trim();
        const previewDiv = input.parentElement.querySelector('.image-preview');
        
        if (!url || !input.classList.contains('valid')) {
            previewDiv.style.display = 'none';
            return;
        }
        
        previewDiv.innerHTML = `
            <img src="${url}" alt="Preview" onerror="this.parentElement.style.display='none'">
            <button class="remove-image" onclick="this.parentElement.style.display='none'; this.parentElement.previousElementSibling.value='';">×</button>
        `;
        previewDiv.style.display = 'block';
    }

    previewCustomImages() {
        const images = this.getCustomImages();
        if (images.length === 0) {
            this.showNotification('Please add some image URLs first', 'warning');
            return;
        }
        
        // Create a simple preview modal
        const previewHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; padding: 1rem;">
                ${images.map((img, index) => `
                    <div style="text-align: center;">
                        <img src="${img.url}" alt="${img.type}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid ${img.type === 'main' ? '#10b981' : '#e2e8f0'};">
                        <p style="margin: 0.5rem 0; font-size: 0.875rem; color: #64748b;">${img.type === 'main' ? 'Main Image' : `Gallery ${index}`}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        const blob = new Blob([`
            <!DOCTYPE html>
            <html><head><title>Image Preview</title></head>
            <body style="margin: 0; font-family: Arial, sans-serif;">
                <h2 style="text-align: center; padding: 1rem; margin: 0; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">Your Custom Images</h2>
                ${previewHtml}
            </body></html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        this.previewFrame.src = url;
        this.previewModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    setupImageInputListeners() {
        const inputs = this.imageInputs.querySelectorAll('.image-url-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => this.validateImageUrl(e.target));
            input.addEventListener('blur', (e) => this.previewImage(e.target));
        });
    }

    getCustomImages() {
        if (!this.useCustomImages.checked) {
            return [];
        }
        
        const images = [];
        const inputs = this.imageInputs.querySelectorAll('.image-url-input');
        
        inputs.forEach((input, index) => {
            const url = input.value.trim();
            if (url && input.classList.contains('valid')) {
                images.push({
                    url: url,
                    type: input.dataset.type || (index === 0 ? 'main' : 'gallery'),
                    altText: `Product image ${index + 1}`
                });
            }
        });
        
        return images;
    }

    generatePricingInsights(originalPrice, suggestedPrice, marketAverage, details) {
        const insights = [];
        const priceDiff = suggestedPrice - originalPrice;
        const percentChange = originalPrice > 0 ? Math.abs((priceDiff / originalPrice) * 100) : 0;
        
        // Price opportunity analysis
        if (priceDiff > 5) {
            insights.push(`<div class="insight positive">💡 <strong>Pricing Opportunity:</strong> You could increase your price by $${priceDiff.toFixed(2)} (${percentChange.toFixed(1)}% increase) based on market data.</div>`);
        } else if (priceDiff < -5) {
            insights.push(`<div class="insight warning">⚠️ <strong>Price Adjustment:</strong> Consider lowering your price by $${Math.abs(priceDiff).toFixed(2)} (${percentChange.toFixed(1)}% decrease) to be more competitive.</div>`);
        } else if (Math.abs(priceDiff) <= 5) {
            insights.push(`<div class="insight neutral">✅ <strong>Optimal Pricing:</strong> Your current price is well-positioned in the market.</div>`);
        }
        
        // Market positioning
        if (marketAverage > 0) {
            const marketDiff = suggestedPrice - marketAverage;
            if (marketDiff > 10) {
                insights.push(`<div class="insight info">🔺 <strong>Premium Positioning:</strong> Your suggested price is $${marketDiff.toFixed(2)} above market average - great for premium products.</div>`);
            } else if (marketDiff < -10) {
                insights.push(`<div class="insight info">🔻 <strong>Value Positioning:</strong> Your suggested price is $${Math.abs(marketDiff).toFixed(2)} below market average - excellent for quick sales.</div>`);
            } else {
                insights.push(`<div class="insight positive">🎯 <strong>Market Sweet Spot:</strong> Your price is perfectly aligned with market expectations.</div>`);
            }
        }
        
        // Competition analysis
        if (details.similarListings && details.similarListings > 0) {
            insights.push(`<div class="insight info">📊 <strong>Market Data:</strong> Analysis based on ${details.similarListings} similar listings currently active on eBay.</div>`);
        }
        
        // Confidence-based recommendations
        if (details.confidence) {
            const confidence = details.confidence * 100;
            if (confidence >= 80) {
                insights.push(`<div class="insight positive">🎯 <strong>High Confidence:</strong> This pricing recommendation is based on strong market data (${confidence.toFixed(0)}% confidence).</div>`);
            } else if (confidence >= 60) {
                insights.push(`<div class="insight neutral">📈 <strong>Moderate Confidence:</strong> Good market data available, but consider monitoring competitor prices (${confidence.toFixed(0)}% confidence).</div>`);
            } else {
                insights.push(`<div class="insight warning">📊 <strong>Limited Data:</strong> Pricing based on limited market data - research more similar listings (${confidence.toFixed(0)}% confidence).</div>`);
            }
        }
        
        return insights.join('');
    }

    displayHtmlCode(htmlTemplate) {
        // Use the complete HTML template without cleaning for exact match with download
        // This ensures the copied code matches the downloaded file exactly
        this.htmlCodeBlock.innerHTML = this.syntaxHighlight(htmlTemplate);
        
        // Store the complete HTML for copying (same as download)
        this.htmlCodeBlock.dataset.plainText = htmlTemplate;
    }

    syntaxHighlight(html) {
        // Simple syntax highlighting for HTML
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(&lt;\/?[^&\s]*)/g, '<span class="html-tag">$1</span>')
            .replace(/(&gt;)/g, '<span class="html-tag">$1</span>')
            .replace(/(class|id|src|href|alt|style)=/g, '<span class="html-attr">$1</span>=')
            .replace(/="([^"]*)"/g, '=<span class="html-value">"$1"</span>')
            .replace(/\n/g, '<br>');
    }

    cleanHtmlForEbay(html) {
        // Remove script tags
        html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
        
        // Remove external stylesheets (keep inline styles)
        html = html.replace(/<link[^>]*stylesheet[^>]*>/gi, '');
        
        // Remove eBay policy violations - "Top Rated Seller" references
        html = html.replace(/top\s*rated\s*seller/gi, 'Professional Seller');
        html = html.replace(/ebay\s*trusted\s*seller/gi, 'Trusted Seller');
        html = html.replace(/ebay\s*top\s*seller/gi, 'Professional Seller');
        html = html.replace(/⭐\s*TOP\s*RATED\s*SELLER\s*⭐/gi, '🏆 Professional Seller 🏆');
        html = html.replace(/TOP RATED SELLER/gi, 'Professional Seller');
        
        // Remove problematic sections that eBay doesn't allow
        html = html.replace(/<li><strong>Original Price:<\/strong>[^<]*<\/li>/gi, '');
        html = html.replace(/<li><strong>Location:<\/strong>[^<]*<\/li>/gi, '');
        html = html.replace(/<li><strong>Seller:<\/strong>[^<]*<\/li>/gi, '');
        html = html.replace(/<div[^>]*class="[^"]*top-rated[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        
        // Remove any remaining seller info patterns
        html = html.replace(/Seller:\s*[^\n<]*/gi, '');
        html = html.replace(/Location:\s*[^\n<]*/gi, '');
        html = html.replace(/Original Price:\s*\$?[\d,]+\.?\d*/gi, '');
        
        // Format the HTML for better readability
        html = this.formatHtml(html);
        
        return html.trim();
    }

    formatHtml(html) {
        // Simple HTML formatter for better readability
        let formatted = html;
        
        // Add line breaks after closing tags
        formatted = formatted.replace(/></g, '>\n<');
        
        // Add line breaks after opening tags that should be on new lines
        formatted = formatted.replace(/(<(?:div|section|header|footer|main|article|aside|nav|ul|ol|li|h[1-6]|p|form|table|tr|td|th)[^>]*>)/gi, '$1\n');
        
        // Add line breaks before closing tags
        formatted = formatted.replace(/(<\/(?:div|section|header|footer|main|article|aside|nav|ul|ol|li|h[1-6]|p|form|table|tr|td|th)>)/gi, '\n$1');
        
        // Add proper indentation
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const indentSize = 2;
        
        const formattedLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // Decrease indent for closing tags
            if (trimmed.startsWith('</')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
            
            // Increase indent for opening tags (but not self-closing)
            if (trimmed.startsWith('<') && 
                !trimmed.startsWith('</') && 
                !trimmed.endsWith('/>') &&
                !trimmed.match(/<(?:img|br|hr|input|meta|link)[^>]*>/i)) {
                indentLevel++;
            }
            
            return indentedLine;
        });
        
        // Clean up excessive blank lines and return
        return formattedLines
            .filter(line => line.trim())
            .join('\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
    }

    copyHtmlCode() {
        const htmlCode = this.htmlCodeBlock.dataset.plainText || this.htmlCodeBlock.textContent;
        
        navigator.clipboard.writeText(htmlCode).then(() => {
            // Show success feedback
            this.copyCodeBtn.classList.add('copied');
            this.copyCodeBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                this.copyCodeBtn.classList.remove('copied');
                this.copyCodeBtn.innerHTML = '<i class="fas fa-copy"></i> Copy HTML Code';
            }, 2000);
            
            this.showNotification('HTML code copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = htmlCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showNotification('HTML code copied to clipboard!', 'success');
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EbayOptimizerUI();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
});
