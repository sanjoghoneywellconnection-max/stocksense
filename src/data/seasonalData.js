// InventSight Seasonal Intelligence Engine
// Amazon India + Flipkart combined market calendar

export const SALE_EVENT_CALENDAR = {
  1:  { event: 'Great Republic Day Sale',          multiplier: 2.0 },
  2:  { event: null,                                multiplier: 1.0 },
  3:  { event: null,                                multiplier: 1.0 },
  4:  { event: 'Great Summer Sale',                 multiplier: 1.75 },
  5:  { event: null,                                multiplier: 1.0 },
  6:  { event: null,                                multiplier: 1.0 },
  7:  { event: 'Prime Day',                         multiplier: 2.0 },
  8:  { event: 'Great Freedom Festival',            multiplier: 1.75 },
  9:  { event: null,                                multiplier: 1.0 },
  10: { event: 'Great Indian Festival',             multiplier: 3.0 },
  11: { event: 'Great Indian Festival + Black Friday', multiplier: 2.5 },
  12: { event: 'Christmas & Year-end Sale',         multiplier: 1.75 },
}

// Peak months = 1.5x, Off months = 0.75x, Normal = 1.0x
// Keywords are matched against category name (case-insensitive)
export const CATEGORY_SEASONALITY = [
  // ELECTRONICS
  {
    keywords: ['headphone', 'earphone', 'earbud', 'headset'],
    peak: [10, 11, 6, 7],
    off: [2, 3],
    label: 'Headphones & Earphones',
  },
  {
    keywords: ['bluetooth speaker', 'speaker', 'soundbar'],
    peak: [10, 11, 12],
    off: [2, 3, 4],
    label: 'Speakers',
  },
  {
    keywords: ['power bank', 'charger', 'charging'],
    peak: [3, 4, 5, 10, 11],
    off: [1, 2],
    label: 'Power Banks & Chargers',
  },
  {
    keywords: ['mobile accessory', 'phone case', 'screen guard', 'mobile cover'],
    peak: [10, 11, 6, 7],
    off: [2, 3],
    label: 'Mobile Accessories',
  },
  {
    keywords: ['cable', 'adapter', 'hdmi', 'usb hub', 'docking'],
    peak: [10, 11],
    off: [2, 3],
    label: 'Cables & Adapters',
  },
  {
    keywords: ['laptop bag', 'laptop sleeve'],
    peak: [6, 7, 10, 11],
    off: [12, 1],
    label: 'Laptop Bags',
  },
  {
    keywords: ['memory card', 'pen drive', 'flash drive', 'usb drive'],
    peak: [10, 11, 6, 7],
    off: [2, 3],
    label: 'Memory & Storage',
  },
  {
    keywords: ['smart watch', 'smartwatch', 'fitness band', 'fitness tracker'],
    peak: [10, 11, 2],
    off: [4, 5, 6],
    label: 'Smart Watches',
  },

  // HOME & KITCHEN
  {
    keywords: ['air purifier', 'purifier'],
    peak: [10, 11, 12, 1],
    off: [4, 5, 6, 7, 8],
    label: 'Air Purifiers',
  },
  {
    keywords: ['room heater', 'heater', 'heat convector', 'blower'],
    peak: [10, 11, 12, 1],
    off: [4, 5, 6, 7, 8, 9],
    label: 'Room Heaters',
  },
  {
    keywords: ['air cooler', 'cooler', 'air conditioner', 'ac '],
    peak: [3, 4, 5, 6],
    off: [10, 11, 12, 1, 2],
    label: 'Cooling Appliances',
  },
  {
    keywords: ['water purifier', 'ro system', 'water filter'],
    peak: [3, 4, 5, 6],
    off: [11, 12, 1],
    label: 'Water Purifiers',
  },
  {
    keywords: ['fan', 'ceiling fan', 'table fan', 'pedestal fan'],
    peak: [3, 4, 5],
    off: [10, 11, 12, 1, 2],
    label: 'Fans',
  },
  {
    keywords: ['mixer', 'grinder', 'juicer', 'blender'],
    peak: [10, 11, 3, 4],
    off: [12, 1],
    label: 'Kitchen Appliances',
  },
  {
    keywords: ['pressure cooker', 'cookware', 'kadai', 'tawa', 'pan'],
    peak: [10, 11, 1],
    off: [6, 7, 8],
    label: 'Cookware',
  },
  {
    keywords: ['water bottle', 'kitchen storage', 'container', 'box', 'bottle'],
    peak: [3, 4, 5],
    off: [11, 12, 1],
    label: 'Kitchen Storage',
  },
  {
    keywords: ['bedsheet', 'blanket', 'quilt', 'comforter', 'pillow'],
    peak: [10, 11, 12, 1],
    off: [4, 5, 6, 7, 8],
    label: 'Bedding',
  },
  {
    keywords: ['mattress'],
    peak: [10, 11, 1, 2],
    off: [6, 7],
    label: 'Mattresses',
  },
  {
    keywords: ['curtain', 'home furnishing', 'sofa cover', 'table cover'],
    peak: [10, 11, 1, 2],
    off: [6, 7, 8],
    label: 'Home Furnishing',
  },
  {
    keywords: ['led bulb', 'led light', 'lighting', 'bulb', 'batten'],
    peak: [10, 1, 2],
    off: [6, 7],
    label: 'Lighting',
  },
  {
    keywords: ['home decor', 'wall art', 'clock', 'photo frame', 'showpiece'],
    peak: [10, 11, 1, 2],
    off: [6, 7, 8],
    label: 'Home Décor',
  },
  {
    keywords: ['mosquito', 'pest control', 'insect'],
    peak: [6, 7, 8, 9],
    off: [11, 12, 1, 2],
    label: 'Pest Control',
  },

  // HEALTH, BEAUTY & PERSONAL CARE
  {
    keywords: ['sunscreen', 'spf', 'sun protection'],
    peak: [3, 4, 5, 6],
    off: [10, 11, 12, 1],
    label: 'Sunscreen',
  },
  {
    keywords: ['moisturiser', 'moisturizer', 'lotion', 'skin cream', 'face cream'],
    peak: [10, 11, 12, 1],
    off: [5, 6, 7],
    label: 'Moisturisers',
  },
  {
    keywords: ['face wash', 'cleanser', 'scrub'],
    peak: [3, 4, 5, 6],
    off: [11, 12],
    label: 'Face Wash',
  },
  {
    keywords: ['hair care', 'shampoo', 'conditioner', 'hair oil', 'hair serum'],
    peak: [3, 4, 5, 10, 11],
    off: [12, 1],
    label: 'Hair Care',
  },
  {
    keywords: ['deodorant', 'deo', 'perfume', 'fragrance', 'body spray'],
    peak: [3, 4, 5, 6],
    off: [11, 12, 1],
    label: 'Deodorants & Fragrance',
  },
  {
    keywords: ['vitamin', 'supplement', 'multivitamin', 'immunity', 'zinc', 'omega'],
    peak: [1, 2, 10, 11],
    off: [5, 6],
    label: 'Vitamins & Supplements',
  },
  {
    keywords: ['protein', 'whey', 'creatine', 'pre workout', 'mass gainer', 'nutrition'],
    peak: [1, 2, 3, 6, 7],
    off: [9, 10],
    label: 'Sports Nutrition',
  },
  {
    keywords: ['heating pad', 'pain relief', 'hot water bag', 'tens'],
    peak: [11, 12, 1],
    off: [4, 5, 6, 7, 8, 9],
    label: 'Pain Relief',
  },
  {
    keywords: ['grooming', 'trimmer', 'shaver', 'epilator', 'hair dryer', 'straightener'],
    peak: [10, 11, 2],
    off: [6, 7],
    label: 'Personal Grooming',
  },

  // BABY & KIDS
  {
    keywords: ['toy', 'toys', 'game', 'puzzle', 'lego', 'action figure'],
    peak: [10, 11, 12, 1],
    off: [3, 4, 5],
    label: 'Toys & Games',
  },
  {
    keywords: ['educational toy', 'stem toy', 'learning toy'],
    peak: [6, 7, 10, 11],
    off: [2, 3],
    label: 'Educational Toys',
  },
  {
    keywords: ['baby clothing', 'baby wear', 'baby dress', 'infant wear'],
    peak: [10, 11, 12, 1],
    off: [5, 6, 7],
    label: 'Baby Clothing',
  },

  // SPORTS & FITNESS
  {
    keywords: ['gym equipment', 'dumbbell', 'barbell', 'treadmill', 'exercise'],
    peak: [1, 2],
    off: [6, 7, 8],
    label: 'Gym Equipment',
  },
  {
    keywords: ['yoga mat', 'yoga', 'resistance band', 'fitness accessory'],
    peak: [1, 2, 3],
    off: [7, 8, 9],
    label: 'Yoga & Fitness',
  },
  {
    keywords: ['cricket', 'bat', 'cricket ball', 'cricket kit'],
    peak: [3, 4, 5, 10, 11],
    off: [7, 8],
    label: 'Cricket Equipment',
  },
  {
    keywords: ['badminton', 'racquet', 'shuttle'],
    peak: [10, 11, 3, 4, 5],
    off: [7, 8],
    label: 'Badminton',
  },
  {
    keywords: ['bicycle', 'cycle', 'cycling'],
    peak: [10, 11, 2, 3],
    off: [7, 8],
    label: 'Bicycles',
  },
  {
    keywords: ['swimming', 'goggles', 'swim'],
    peak: [3, 4, 5],
    off: [10, 11, 12, 1],
    label: 'Swimming',
  },

  // FASHION & ACCESSORIES
  {
    keywords: ['thermal', 'winter wear', 'jacket', 'sweater', 'sweatshirt', 'hoodie'],
    peak: [10, 11, 12, 1],
    off: [3, 4, 5, 6, 7, 8],
    label: 'Winter Wear',
  },
  {
    keywords: ['rainwear', 'raincoat', 'rain jacket', 'umbrella', 'poncho'],
    peak: [6, 7, 8],
    off: [11, 12, 1, 2],
    label: 'Rainwear',
  },
  {
    keywords: ['sunglass', 'sunglasses'],
    peak: [3, 4, 5],
    off: [10, 11, 12],
    label: 'Sunglasses',
  },
  {
    keywords: ['backpack', 'school bag', 'luggage', 'trolley', 'travel bag', 'suitcase'],
    peak: [6, 7, 10, 11],
    off: [2, 3],
    label: 'Bags & Luggage',
  },
  {
    keywords: ['watch', 'wrist watch'],
    peak: [10, 11, 2],
    off: [4, 5, 6],
    label: 'Watches',
  },

  // AUTOMOTIVE
  {
    keywords: ['car accessory', 'car cover', 'seat cover', 'car mat', 'bike cover'],
    peak: [10, 11, 1, 2],
    off: [6, 7],
    label: 'Car & Bike Accessories',
  },
  {
    keywords: ['helmet'],
    peak: [10, 11, 1, 2],
    off: [5, 6, 7],
    label: 'Helmets',
  },
  {
    keywords: ['engine oil', 'lubricant', 'car wash', 'cleaning kit'],
    peak: [3, 4, 5],
    off: [11, 12, 1],
    label: 'Automotive Maintenance',
  },

  // OFFICE & STATIONERY
  {
    keywords: ['stationery', 'office supply', 'notebook', 'pen', 'pencil', 'file'],
    peak: [6, 7, 1, 2],
    off: [10, 11],
    label: 'Stationery & Office',
  },
  {
    keywords: ['office furniture', 'study table', 'office chair', 'gaming chair'],
    peak: [1, 2, 3],
    off: [6, 7, 8],
    label: 'Office Furniture',
  },

  // GROCERY & FOOD
  {
    keywords: ['dry fruit', 'nuts', 'almond', 'cashew', 'walnut', 'raisin'],
    peak: [10, 11],
    off: [1, 2, 3],
    label: 'Dry Fruits',
  },
  {
    keywords: ['hamper', 'gifting', 'gift box', 'combo'],
    peak: [10, 11, 2],
    off: [3, 4, 5, 6, 7, 8, 9],
    label: 'Gift Hampers',
  },
  {
    keywords: ['beverage', 'juice', 'drink', 'energy drink', 'squash'],
    peak: [3, 4, 5, 6],
    off: [11, 12, 1],
    label: 'Beverages',
  },
]

// Match a category name to seasonal data
export function getSeasonalProfile(categoryName) {
  if (!categoryName) return null
  const lower = categoryName.toLowerCase()
  for (const cat of CATEGORY_SEASONALITY) {
    for (const keyword of cat.keywords) {
      if (lower.includes(keyword)) return cat
    }
  }
  return null
}

// Get current month's sale event
export function getSaleEvent(month) {
  return SALE_EVENT_CALENDAR[month] || { event: null, multiplier: 1.0 }
}

// Get seasonal multiplier for category in given month
export function getSeasonalMultiplier(categoryName, month) {
  const profile = getSeasonalProfile(categoryName)
  if (!profile) return { multiplier: 1.0, status: 'normal', label: 'No seasonal data' }
  if (profile.peak.includes(month)) return { multiplier: 1.5, status: 'peak', label: `Peak season for ${profile.label}` }
  if (profile.off.includes(month)) return { multiplier: 0.75, status: 'off', label: `Off season for ${profile.label}` }
  return { multiplier: 1.0, status: 'normal', label: `Normal season for ${profile.label}` }
}

// Get trend multiplier from DRR comparison
export function getTrendMultiplier(drr7, drr90) {
  const d7 = parseFloat(drr7 || 0)
  const d90 = parseFloat(drr90 || 0)
  if (d90 === 0) return { multiplier: 1.0, status: 'unknown', label: 'Not enough data for trend' }
  const change = ((d7 - d90) / d90) * 100
  if (change >= 30) return { multiplier: 1.4, status: 'accelerating', label: `Sales accelerating fast (+${change.toFixed(0)}% vs 90d avg)` }
  if (change >= 15) return { multiplier: 1.2, status: 'growing', label: `Sales growing (+${change.toFixed(0)}% vs 90d avg)` }
  if (change <= -30) return { multiplier: 0.7, status: 'declining', label: `Sales declining sharply (${change.toFixed(0)}% vs 90d avg)` }
  if (change <= -15) return { multiplier: 0.85, status: 'slowing', label: `Sales slowing down (${change.toFixed(0)}% vs 90d avg)` }
  return { multiplier: 1.0, status: 'stable', label: `Sales stable (${change > 0 ? '+' : ''}${change.toFixed(0)}% vs 90d avg)` }
}

// Master function — returns final intelligent reorder quantity with full reasoning
export function calculateIntelligentReorder(sku, metric, categoryName) {
  const currentMonth = new Date().getMonth() + 1

  const drr = parseFloat(metric?.drr_7d || metric?.drr_30d || 0)
  const leadTime = parseInt(sku?.lead_time_days || 14)
  const safetyDays = parseInt(sku?.safety_stock_days || 7)
  const moq = parseInt(sku?.moq || 1)

  // Base quantity
  const base = drr * (leadTime + safetyDays)

  // Three multipliers
  const trend = getTrendMultiplier(metric?.drr_7d, metric?.drr_90d)
  const seasonal = getSeasonalMultiplier(categoryName, currentMonth)
  const saleEvent = getSaleEvent(currentMonth)

  // Combined multiplier — capped at 6x
  const combined = Math.min(trend.multiplier * seasonal.multiplier * saleEvent.multiplier, 6.0)

  // Raw final quantity
  const rawFinal = base * combined

  // Round up to nearest MOQ
  const finalQty = Math.max(moq, Math.ceil(rawFinal / moq) * moq)

  // Confidence score
  let confidence = 'Medium'
  let confidenceColor = '#d97706'
  const drr7 = parseFloat(metric?.drr_7d || 0)
  const drr90 = parseFloat(metric?.drr_90d || 0)
  if (drr7 > 0 && drr90 > 0 && saleEvent.event && seasonal.status !== 'normal') {
    confidence = 'High'; confidenceColor = '#0f9b58'
  } else if (drr7 === 0 || drr90 === 0) {
    confidence = 'Low'; confidenceColor = '#dc2626'
  }

  // Build reasoning sentences
  const reasons = []
  if (drr > 0) reasons.push(`Base need: ${drr.toFixed(1)} units/day × ${leadTime + safetyDays} days = ${Math.round(base)} units`)
  reasons.push(trend.label)
  reasons.push(seasonal.status !== 'normal' ? seasonal.label : seasonal.label)
  if (saleEvent.event) reasons.push(`${saleEvent.event} this month — stock up for the spike`)
  if (combined > 1.5) reasons.push(`Combined multiplier: ${combined.toFixed(2)}x → Order ${finalQty} units`)

  return {
    baseQty: Math.round(base),
    finalQty,
    combined: parseFloat(combined.toFixed(2)),
    trend,
    seasonal,
    saleEvent,
    confidence,
    confidenceColor,
    reasons,
    currentMonth,
  }
}