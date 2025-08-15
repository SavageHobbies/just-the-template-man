import { ProductDetails, ResearchData, WebpageContent } from '../../models';

export interface TestDataset {
  category: string;
  productType: string;
  condition: string;
  mockWebpageContent: WebpageContent;
  expectedProductDetails: Partial<ProductDetails>;
  mockResearchData: ResearchData;
  expectedOptimizations: {
    titleKeywords: string[];
    priceRange: { min: number; max: number };
    descriptionElements: string[];
  };
}

export const testDatasets: TestDataset[] = [
  {
    category: 'Electronics',
    productType: 'iPhone',
    condition: 'Used',
    mockWebpageContent: {
      html: `
        <html>
          <head><title>Apple iPhone 12 Pro 128GB Unlocked - Pacific Blue</title></head>
          <body>
            <h1>Apple iPhone 12 Pro 128GB Unlocked - Pacific Blue</h1>
            <div class="price">$599.99</div>
            <div class="condition">Used</div>
            <div class="description">
              Excellent condition iPhone 12 Pro with 128GB storage. 
              Unlocked for all carriers. Minor scratches on back.
              Includes original box and charger.
            </div>
            <div class="gallery">
              <img src="https://i.ebayimg.com/images/g/abc/s-l1600.jpg" alt="iPhone front">
              <img src="https://i.ebayimg.com/images/g/def/s-l1600.jpg" alt="iPhone back">
            </div>
          </body>
        </html>
      `,
      title: 'Apple iPhone 12 Pro 128GB Unlocked - Pacific Blue',
      metadata: { seller: 'tech_seller_123', location: 'California, US' },
      timestamp: new Date()
    },
    expectedProductDetails: {
      title: 'Apple iPhone 12 Pro 128GB Unlocked - Pacific Blue',
      price: 599.99,
      condition: 'Used',
      specifications: {
        storage: '128GB',
        carrier: 'Unlocked',
        color: 'Pacific Blue'
      }
    },
    mockResearchData: {
      similarListings: [
        { title: 'iPhone 12 Pro 128GB Blue', price: 579.99, condition: 'Used', platform: 'eBay' },
        { title: 'Apple iPhone 12 Pro Unlocked', price: 625.00, condition: 'Used', platform: 'eBay' },
        { title: 'iPhone 12 Pro 128GB Pacific Blue', price: 595.00, condition: 'Used', soldDate: new Date(), platform: 'eBay' }
      ],
      priceAnalysis: {
        averagePrice: 599.99,
        priceRange: { min: 550.00, max: 650.00 },
        recommendedPrice: 589.99,
        confidence: 0.85
      },
      keywordAnalysis: {
        popularKeywords: ['iPhone', '12 Pro', 'Unlocked', '128GB', 'Pacific Blue', 'Apple'],
        keywordFrequency: { 'iPhone': 95, '12 Pro': 87, 'Unlocked': 76, '128GB': 82 },
        searchVolume: { 'iPhone 12 Pro': 15000, 'Unlocked iPhone': 8500 }
      },
      marketTrends: [
        { period: '30d', averagePrice: 599.99, salesVolume: 150, trend: 'stable' },
        { period: '60d', averagePrice: 589.50, salesVolume: 145, trend: 'increasing' }
      ]
    },
    expectedOptimizations: {
      titleKeywords: ['iPhone', '12 Pro', 'Unlocked', '128GB', 'Pacific Blue'],
      priceRange: { min: 550, max: 650 },
      descriptionElements: ['Excellent condition', 'Unlocked', 'Original box', 'Fast shipping']
    }
  },
  {
    category: 'Fashion',
    productType: 'Sneakers',
    condition: 'New',
    mockWebpageContent: {
      html: `
        <html>
          <head><title>Nike Air Jordan 1 Retro High OG Size 10 - Chicago</title></head>
          <body>
            <h1>Nike Air Jordan 1 Retro High OG Size 10 - Chicago</h1>
            <div class="price">$180.00</div>
            <div class="condition">New with box</div>
            <div class="description">
              Brand new Nike Air Jordan 1 in the classic Chicago colorway.
              Size 10 US. Never worn, comes with original box and tags.
              Authentic from Nike retail store.
            </div>
          </body>
        </html>
      `,
      title: 'Nike Air Jordan 1 Retro High OG Size 10 - Chicago',
      metadata: { seller: 'sneaker_vault', location: 'New York, US' },
      timestamp: new Date()
    },
    expectedProductDetails: {
      title: 'Nike Air Jordan 1 Retro High OG Size 10 - Chicago',
      price: 180.00,
      condition: 'New with box',
      specifications: {
        brand: 'Nike',
        model: 'Air Jordan 1',
        size: '10',
        colorway: 'Chicago'
      }
    },
    mockResearchData: {
      similarListings: [
        { title: 'Jordan 1 Chicago Size 10', price: 175.00, condition: 'New', platform: 'eBay' },
        { title: 'Nike Air Jordan 1 OG Chicago', price: 190.00, condition: 'New', platform: 'eBay' },
        { title: 'Air Jordan 1 Retro High Chicago', price: 185.00, condition: 'New', soldDate: new Date(), platform: 'eBay' }
      ],
      priceAnalysis: {
        averagePrice: 183.33,
        priceRange: { min: 170.00, max: 200.00 },
        recommendedPrice: 179.99,
        confidence: 0.92
      },
      keywordAnalysis: {
        popularKeywords: ['Nike', 'Air Jordan', 'Chicago', 'Retro', 'OG', 'Size 10'],
        keywordFrequency: { 'Nike': 98, 'Air Jordan': 95, 'Chicago': 89, 'Size 10': 76 },
        searchVolume: { 'Air Jordan 1 Chicago': 12000, 'Jordan 1 Size 10': 6500 }
      },
      marketTrends: [
        { period: '30d', averagePrice: 183.33, salesVolume: 89, trend: 'increasing' },
        { period: '60d', averagePrice: 175.20, salesVolume: 76, trend: 'increasing' }
      ]
    },
    expectedOptimizations: {
      titleKeywords: ['Nike', 'Air Jordan', 'Chicago', 'Size 10', 'OG'],
      priceRange: { min: 170, max: 200 },
      descriptionElements: ['Brand new', 'Original box', 'Authentic', 'Never worn']
    }
  },
  {
    category: 'Home & Garden',
    productType: 'Furniture',
    condition: 'Used',
    mockWebpageContent: {
      html: `
        <html>
          <head><title>Vintage Mid-Century Modern Dining Table - Walnut Wood</title></head>
          <body>
            <h1>Vintage Mid-Century Modern Dining Table - Walnut Wood</h1>
            <div class="price">$450.00</div>
            <div class="condition">Used - Good</div>
            <div class="description">
              Beautiful vintage dining table from the 1960s. 
              Solid walnut construction with original finish.
              Some minor wear consistent with age. Seats 6 people.
              Dimensions: 72" x 36" x 30"
            </div>
          </body>
        </html>
      `,
      title: 'Vintage Mid-Century Modern Dining Table - Walnut Wood',
      metadata: { seller: 'vintage_finds', location: 'Oregon, US' },
      timestamp: new Date()
    },
    expectedProductDetails: {
      title: 'Vintage Mid-Century Modern Dining Table - Walnut Wood',
      price: 450.00,
      condition: 'Used - Good',
      specifications: {
        material: 'Walnut Wood',
        style: 'Mid-Century Modern',
        era: '1960s',
        dimensions: '72" x 36" x 30"',
        seating: '6 people'
      }
    },
    mockResearchData: {
      similarListings: [
        { title: 'Mid Century Dining Table Walnut', price: 425.00, condition: 'Used', platform: 'eBay' },
        { title: 'Vintage Walnut Dining Table 1960s', price: 475.00, condition: 'Used', platform: 'eBay' },
        { title: 'MCM Dining Table Solid Wood', price: 440.00, condition: 'Used', soldDate: new Date(), platform: 'eBay' }
      ],
      priceAnalysis: {
        averagePrice: 446.67,
        priceRange: { min: 400.00, max: 500.00 },
        recommendedPrice: 449.99,
        confidence: 0.78
      },
      keywordAnalysis: {
        popularKeywords: ['Mid-Century', 'Vintage', 'Walnut', 'Dining Table', '1960s', 'MCM'],
        keywordFrequency: { 'Mid-Century': 85, 'Vintage': 92, 'Walnut': 78, 'Dining Table': 95 },
        searchVolume: { 'Mid Century Dining Table': 3500, 'Vintage Walnut Table': 2100 }
      },
      marketTrends: [
        { period: '30d', averagePrice: 446.67, salesVolume: 23, trend: 'increasing' },
        { period: '60d', averagePrice: 425.80, salesVolume: 19, trend: 'stable' }
      ]
    },
    expectedOptimizations: {
      titleKeywords: ['Mid-Century', 'Vintage', 'Walnut', 'Dining Table', '1960s'],
      priceRange: { min: 400, max: 500 },
      descriptionElements: ['Solid walnut', 'Original finish', 'Seats 6', 'Authentic vintage']
    }
  },
  {
    category: 'Automotive',
    productType: 'Car Parts',
    condition: 'New',
    mockWebpageContent: {
      html: `
        <html>
          <head><title>OEM BMW Brake Pads Front Set - 3 Series E90 E91 E92</title></head>
          <body>
            <h1>OEM BMW Brake Pads Front Set - 3 Series E90 E91 E92</h1>
            <div class="price">$89.99</div>
            <div class="condition">New</div>
            <div class="description">
              Genuine OEM BMW brake pads for 3 Series models E90, E91, E92.
              Front axle set includes 4 brake pads. 
              Part number: 34116761244. Direct replacement.
              Fits 2006-2013 BMW 3 Series.
            </div>
          </body>
        </html>
      `,
      title: 'OEM BMW Brake Pads Front Set - 3 Series E90 E91 E92',
      metadata: { seller: 'bmw_parts_pro', location: 'Michigan, US' },
      timestamp: new Date()
    },
    expectedProductDetails: {
      title: 'OEM BMW Brake Pads Front Set - 3 Series E90 E91 E92',
      price: 89.99,
      condition: 'New',
      specifications: {
        brand: 'BMW OEM',
        partNumber: '34116761244',
        fitment: '2006-2013 BMW 3 Series',
        position: 'Front',
        models: 'E90 E91 E92'
      }
    },
    mockResearchData: {
      similarListings: [
        { title: 'BMW 3 Series Brake Pads Front OEM', price: 85.00, condition: 'New', platform: 'eBay' },
        { title: 'Genuine BMW Brake Pads E90', price: 92.50, condition: 'New', platform: 'eBay' },
        { title: 'OEM BMW Front Brake Pads 3 Series', price: 88.00, condition: 'New', soldDate: new Date(), platform: 'eBay' }
      ],
      priceAnalysis: {
        averagePrice: 88.50,
        priceRange: { min: 80.00, max: 95.00 },
        recommendedPrice: 87.99,
        confidence: 0.88
      },
      keywordAnalysis: {
        popularKeywords: ['BMW', 'OEM', 'Brake Pads', '3 Series', 'E90', 'Front', 'Genuine'],
        keywordFrequency: { 'BMW': 98, 'OEM': 87, 'Brake Pads': 95, '3 Series': 89 },
        searchVolume: { 'BMW Brake Pads': 4500, 'E90 Brake Pads': 1800 }
      },
      marketTrends: [
        { period: '30d', averagePrice: 88.50, salesVolume: 67, trend: 'stable' },
        { period: '60d', averagePrice: 87.20, salesVolume: 62, trend: 'increasing' }
      ]
    },
    expectedOptimizations: {
      titleKeywords: ['BMW', 'OEM', 'Brake Pads', '3 Series', 'E90'],
      priceRange: { min: 80, max: 95 },
      descriptionElements: ['Genuine OEM', 'Direct replacement', 'Part number included', 'Fast shipping']
    }
  },
  {
    category: 'Collectibles',
    productType: 'Trading Cards',
    condition: 'Near Mint',
    mockWebpageContent: {
      html: `
        <html>
          <head><title>1998 Pokemon Charizard Base Set Holo #4/102 - Near Mint</title></head>
          <body>
            <h1>1998 Pokemon Charizard Base Set Holo #4/102 - Near Mint</h1>
            <div class="price">$350.00</div>
            <div class="condition">Near Mint</div>
            <div class="description">
              1998 Pokemon Base Set Charizard holographic card #4/102.
              Near mint condition with minimal edge wear.
              Centered, no creases or bends. Stored in protective sleeve.
              Authentic Wizards of the Coast printing.
            </div>
          </body>
        </html>
      `,
      title: '1998 Pokemon Charizard Base Set Holo #4/102 - Near Mint',
      metadata: { seller: 'card_collector_pro', location: 'Texas, US' },
      timestamp: new Date()
    },
    expectedProductDetails: {
      title: '1998 Pokemon Charizard Base Set Holo #4/102 - Near Mint',
      price: 350.00,
      condition: 'Near Mint',
      specifications: {
        game: 'Pokemon',
        set: 'Base Set',
        year: '1998',
        cardNumber: '#4/102',
        type: 'Holographic',
        character: 'Charizard'
      }
    },
    mockResearchData: {
      similarListings: [
        { title: 'Pokemon Charizard Base Set Holo NM', price: 340.00, condition: 'Near Mint', platform: 'eBay' },
        { title: '1998 Charizard #4/102 Holo', price: 365.00, condition: 'Near Mint', platform: 'eBay' },
        { title: 'Base Set Charizard Holographic', price: 355.00, condition: 'Near Mint', soldDate: new Date(), platform: 'eBay' }
      ],
      priceAnalysis: {
        averagePrice: 353.33,
        priceRange: { min: 320.00, max: 380.00 },
        recommendedPrice: 349.99,
        confidence: 0.91
      },
      keywordAnalysis: {
        popularKeywords: ['Pokemon', 'Charizard', 'Base Set', 'Holo', '1998', 'Near Mint', '#4/102'],
        keywordFrequency: { 'Pokemon': 98, 'Charizard': 95, 'Base Set': 89, 'Holo': 87 },
        searchVolume: { 'Pokemon Charizard': 25000, 'Base Set Charizard': 8500 }
      },
      marketTrends: [
        { period: '30d', averagePrice: 353.33, salesVolume: 45, trend: 'increasing' },
        { period: '60d', averagePrice: 298.75, salesVolume: 38, trend: 'increasing' }
      ]
    },
    expectedOptimizations: {
      titleKeywords: ['Pokemon', 'Charizard', 'Base Set', 'Holo', '1998'],
      priceRange: { min: 320, max: 380 },
      descriptionElements: ['Near mint condition', 'Authentic', 'Protective sleeve', 'No creases']
    }
  }
];

export const getTestDataByCategory = (category: string): TestDataset[] => {
  return testDatasets.filter(dataset => dataset.category === category);
};

export const getTestDataByCondition = (condition: string): TestDataset[] => {
  return testDatasets.filter(dataset => dataset.condition.includes(condition));
};

export const getAllCategories = (): string[] => {
  return [...new Set(testDatasets.map(dataset => dataset.category))];
};

export const getAllProductTypes = (): string[] => {
  return [...new Set(testDatasets.map(dataset => dataset.productType))];
};

export const getAllConditions = (): string[] => {
  return [...new Set(testDatasets.map(dataset => dataset.condition))];
};