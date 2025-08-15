// Real-world eBay HTML samples for testing
// These are simplified versions of actual eBay page structures

export const modernEbayListingSample = `
<!DOCTYPE html>
<html>
<head>
  <title>Apple MacBook Pro 16-inch M2 Pro 512GB Space Gray | eBay</title>
  <meta name="description" content="Find great deals on Apple MacBook Pro">
</head>
<body>
  <div id="mainContent">
    <h1 data-testid="x-item-title-label">Apple MacBook Pro 16-inch M2 Pro 512GB Space Gray - Excellent Condition</h1>
    
    <div class="price-section">
      <span data-testid="notranslate">$2,299.99</span>
    </div>
    
    <div class="condition-section">
      <span class="u-flL condText">Used - Excellent</span>
    </div>
    
    <div data-testid="ux-layout-section-evo" class="description">
      This MacBook Pro is in excellent condition with minimal signs of use. 
      The laptop has been well-maintained and comes with original charger and box. 
      Perfect for professional work, video editing, and development.
      
      Key Features:
      - M2 Pro chip with 12-core CPU
      - 16GB unified memory
      - 512GB SSD storage
      - 16.2-inch Liquid Retina XDR display
      - Three Thunderbolt 4 ports
      - MagSafe 3 charging
    </div>
    
    <div class="image-gallery">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/macbook1/s-l1600.jpg" alt="MacBook Pro Front">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/macbook2/s-l1600.jpg" alt="MacBook Pro Side">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/macbook3/s-l1600.jpg" alt="MacBook Pro Keyboard">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/macbook4/s-l1600.jpg" alt="MacBook Pro Ports">
    </div>
    
    <div data-testid="ux-labels-values" class="item-specifics">
      <dt>Brand</dt><dd>Apple</dd>
      <dt>Model</dt><dd>MacBook Pro</dd>
      <dt>Screen Size</dt><dd>16.2 in</dd>
      <dt>Processor</dt><dd>Apple M2 Pro</dd>
      <dt>Memory</dt><dd>16 GB</dd>
      <dt>Storage</dt><dd>512 GB SSD</dd>
      <dt>Operating System</dt><dd>macOS</dd>
      <dt>Color</dt><dd>Space Gray</dd>
    </div>
    
    <div data-testid="x-sellercard-atf" class="seller-info">
      <a href="/usr/techpro_electronics">TechPro Electronics</a>
      <span class="seller-rating">99.2% positive feedback</span>
    </div>
    
    <div data-testid="ux-textspans" class="location">
      Ships from San Francisco, California, United States
    </div>
  </div>
</body>
</html>
`;

export const classicEbayListingSample = `
<!DOCTYPE html>
<html>
<head>
  <title>Vintage 1985 Nike Air Jordan 1 Chicago Size 9 Original | eBay</title>
</head>
<body>
  <div class="vi-main">
    <h1 class="it-ttl">Vintage 1985 Nike Air Jordan 1 Chicago Size 9 Original - Rare Collector Item</h1>
    
    <div class="price-info">
      <span class="u-flL notranslate">$8,500.00</span>
      <span class="vi-price-label">or Best Offer</span>
    </div>
    
    <div class="condition-info">
      <span class="u-flL condText">Used - Good</span>
    </div>
    
    <div id="desc_div" class="item-description">
      Authentic 1985 Nike Air Jordan 1 in the iconic Chicago colorway. 
      This is an original pair from Michael Jordan's rookie season. 
      Shows wear consistent with age but still in good structural condition.
      
      Condition Notes:
      - Original box not included
      - Some creasing on toe box
      - Sole shows wear but no separation
      - All original materials and construction
      - Size 9 US Men's
      
      This is a true piece of basketball history and a must-have for any serious collector.
    </div>
    
    <div class="image-section">
      <img id="icImg" src="https://i.ebayimg.com/images/g/jordan1/s-l1600.jpg" alt="Air Jordan 1 Main">
      <div class="additional-images">
        <img src="https://i.ebayimg.com/images/g/jordan2/s-l1600.jpg" alt="Air Jordan 1 Side">
        <img src="https://i.ebayimg.com/images/g/jordan3/s-l1600.jpg" alt="Air Jordan 1 Sole">
        <img src="https://i.ebayimg.com/images/g/jordan4/s-l1600.jpg" alt="Air Jordan 1 Back">
      </div>
    </div>
    
    <table class="itemAttr">
      <tr><td>Brand:</td><td>Nike</td></tr>
      <tr><td>Model:</td><td>Air Jordan 1</td></tr>
      <tr><td>Year:</td><td>1985</td></tr>
      <tr><td>Size:</td><td>9</td></tr>
      <tr><td>Color:</td><td>Chicago (White/Black/Red)</td></tr>
      <tr><td>Style:</td><td>High Top</td></tr>
      <tr><td>Authenticity:</td><td>100% Authentic</td></tr>
    </table>
    
    <div class="seller-section">
      <span class="mbg-nw">VintageKickzCollector</span>
      <span class="seller-stats">Member since 2008</span>
    </div>
    
    <div class="location-section">
      <span class="vi-acc-del-range">Chicago, Illinois, United States</span>
    </div>
  </div>
</body>
</html>
`;

export const minimalEbayListingSample = `
<!DOCTYPE html>
<html>
<head>
  <title>iPhone 12 64GB Blue Unlocked | eBay</title>
  <meta name="description" content="iPhone 12 in great condition">
</head>
<body>
  <h1>iPhone 12 64GB Blue Unlocked</h1>
  <div>$399.99</div>
  <div>Used - Very Good</div>
  <p>iPhone 12 in very good condition. Minor scratches on back but screen is perfect. Comes with charging cable.</p>
  <img src="https://i.ebayimg.com/images/g/iphone12/s-l1600.jpg" alt="iPhone 12">
  <div>
    <span>Brand: Apple</span>
    <span>Storage: 64GB</span>
    <span>Color: Blue</span>
    <span>Network: Unlocked</span>
  </div>
  <a href="/usr/phoneseller123">PhoneSeller123</a>
  <div>Miami, Florida</div>
</body>
</html>
`;

export const complexEbayListingSample = `
<!DOCTYPE html>
<html>
<head>
  <title>Sony PlayStation 5 Console Bundle with Extra Controller and Games | eBay</title>
</head>
<body>
  <div class="main-content">
    <h1 data-testid="x-item-title-label">Sony PlayStation 5 Console Bundle - Extra DualSense Controller + 3 Games</h1>
    
    <div class="pricing">
      <span data-testid="notranslate">$649.99</span>
      <span class="shipping-info">Free shipping</span>
    </div>
    
    <div class="condition">
      <span class="u-flL condText">Brand New</span>
    </div>
    
    <div data-testid="ux-layout-section-evo">
      Brand new PlayStation 5 console bundle includes:
      
      ✅ Sony PlayStation 5 Console (Disc Version)
      ✅ 1 DualSense Wireless Controller (included with console)
      ✅ 1 Additional DualSense Wireless Controller (White)
      ✅ Spider-Man: Miles Morales Ultimate Edition
      ✅ Ratchet & Clank: Rift Apart
      ✅ Demon's Souls
      ✅ All original cables and documentation
      ✅ Manufacturer warranty included
      
      This is a complete gaming setup ready to go out of the box. All items are brand new and sealed.
      Perfect for gamers looking to jump into next-gen gaming with a complete package.
      
      Fast and secure shipping with tracking provided.
    </div>
    
    <div class="gallery">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/ps5bundle1/s-l1600.jpg">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/ps5bundle2/s-l1600.jpg">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/ps5bundle3/s-l1600.jpg">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/ps5bundle4/s-l1600.jpg">
      <img data-testid="ux-image-carousel-item" src="https://i.ebayimg.com/images/g/ps5bundle5/s-l1600.jpg">
    </div>
    
    <div data-testid="ux-labels-values">
      <dt>Platform</dt><dd>Sony PlayStation 5</dd>
      <dt>Type</dt><dd>Home Console</dd>
      <dt>Storage Capacity</dt><dd>825 GB SSD</dd>
      <dt>Connectivity</dt><dd>Wi-Fi, Bluetooth, Ethernet</dd>
      <dt>Resolution</dt><dd>4K Ultra HD</dd>
      <dt>Included Items</dt><dd>Console, 2 Controllers, 3 Games, Cables</dd>
      <dt>Condition</dt><dd>Brand New</dd>
      <dt>MPN</dt><dd>CFI-1215A01</dd>
    </div>
    
    <div data-testid="x-sellercard-atf">
      <a href="/usr/gaming_central_store">Gaming Central Store</a>
    </div>
    
    <div data-testid="ux-textspans">
      Ships from Austin, Texas, United States
    </div>
  </div>
</body>
</html>
`;