# Product Scraping Debug Guide

## Changes Made

### Enhanced Logging in content.js

Added comprehensive logging throughout the scraping process to help debug issues:

1. **Initialization Logging**
   - Shows when content script loads
   - Shows detected site
   - Shows if config is found
   - Shows if product page is detected

2. **Scraping Logging**
   - Shows each field being scraped (title, price, image, etc.)
   - Shows the actual elements found
   - Shows extracted values
   - Shows debug info when scraping fails

3. **Message Logging**
   - Shows when messages are sent/received
   - Shows success/failure of communication

## Testing the Extension

### Step 1: Reload Extension

1. Go to `chrome://extensions/`
2. Find ShopScout extension
3. Click the **reload** icon (circular arrow)
4. Or remove and reload from `dist` folder

### Step 2: Open Amazon Product Page

Navigate to the product page you mentioned:
```
https://www.amazon.com/Amazon-Basics-Compatible-Adaptive-Response/dp/B0CP7SV7XV/
```

### Step 3: Open Developer Console

1. Press `F12` or right-click → "Inspect"
2. Go to the **Console** tab
3. Look for `[ShopScout]` messages

### Step 4: Check Content Script Logs

You should see logs like:
```
[ShopScout] Content script loaded on: https://www.amazon.com/...
[ShopScout] Document already loaded, initializing immediately...
[ShopScout] Initializing scraper...
[ShopScout] Detected site: amazon
[ShopScout] Has config: true
[ShopScout] ✅ Product page detected! Starting scrape...
[ShopScout] Scraping product from amazon
[ShopScout] Title found: Amazon Basics USB-C to USB-C 3.2 Gen 2 Cable...
[ShopScout] Price found: 9.99 Raw: $9.99
[ShopScout] Image found: Yes
[ShopScout] Product ID: B0CP7SV7XV
[ShopScout] ✅ Product scraped successfully
```

### Step 5: Manually Trigger Scan

1. Click the ShopScout extension icon
2. Sidebar should open
3. Click "Scan This Product Page" button
4. Check console for additional logs

## Common Issues & Solutions

### Issue 1: "Content script not loaded"

**Symptoms**: No `[ShopScout]` logs in console

**Solutions**:
1. Reload the extension
2. Refresh the Amazon page
3. Check if content script is injected:
   ```javascript
   // In console, type:
   window.location.reload();
   ```

### Issue 2: "Site not supported"

**Symptoms**: Log shows `Detected site: null`

**Solutions**:
1. Verify you're on a supported domain (amazon.com)
2. Check manifest.json has correct host_permissions
3. Reload extension

### Issue 3: "Not a product page"

**Symptoms**: Log shows `Not a product page - no title element found`

**Solutions**:
1. Verify you're on an actual product page (not search results)
2. Wait for page to fully load
3. Check if Amazon changed their HTML structure

### Issue 4: "Missing essential product data"

**Symptoms**: Scraper finds page but can't extract title or price

**Solutions**:
1. Check the debug logs showing which elements were found
2. Amazon may have changed their selectors
3. Look at the H1 elements logged in console
4. May need to update selectors in content.js

## Debugging Commands

### Check if Content Script is Loaded
```javascript
// In page console:
console.log('Content script loaded:', typeof ProductScraper !== 'undefined');
```

### Manually Trigger Scrape
```javascript
// In page console (if content script is loaded):
chrome.runtime.sendMessage({ type: 'MANUAL_SCAN' });
```

### Check Chrome Storage
```javascript
// In background service worker console:
chrome.storage.local.get(null, (data) => console.log('Storage:', data));
```

### View All H1 Elements
```javascript
// In page console:
document.querySelectorAll('h1').forEach((h1, i) => {
  console.log(`H1 #${i}:`, h1.textContent);
});
```

### View All Price Elements
```javascript
// In page console:
document.querySelectorAll('.a-price').forEach((price, i) => {
  console.log(`Price #${i}:`, price.textContent);
});
```

## Expected Console Output

### Successful Scrape
```
[ShopScout] Content script loaded on: https://www.amazon.com/...
[ShopScout] Document already loaded, initializing immediately...
[ShopScout] Initializing scraper...
[ShopScout] Detected site: amazon
[ShopScout] Has config: true
[ShopScout] ✅ Product page detected! Starting scrape...
[ShopScout] Scraping product from amazon
[ShopScout] Using selectors: {title: Array(4), price: Array(5), ...}
[ShopScout] Title found: Amazon Basics USB-C to USB-C 3.2 Gen 2 Cable... Element: <h1 id="productTitle">
[ShopScout] Price found: 9.99 Raw: $9.99 Element: <span class="a-price-whole">
[ShopScout] Image found: Yes Element: <img id="landingImage">
[ShopScout] Seller found: Amazon.com Element: <span>
[ShopScout] Product ID: B0CP7SV7XV
[ShopScout] Reviews found: 1,234 ratings
[ShopScout] Rating found: 4.5 out of 5 stars
[ShopScout] ✅ Product scraped successfully: {site: "amazon", title: "...", price: 9.99, ...}
[ShopScout] Sending product data to background script...
[ShopScout] ✅ Product data sent successfully
```

### Failed Scrape (Missing Data)
```
[ShopScout] Content script loaded on: https://www.amazon.com/...
[ShopScout] Initializing scraper...
[ShopScout] Detected site: amazon
[ShopScout] Has config: true
[ShopScout] ✅ Product page detected! Starting scrape...
[ShopScout] Scraping product from amazon
[ShopScout] Title found: null Element: null
[ShopScout] Price found: null Raw: null Element: null
[ShopScout] ⚠️ Missing essential product data!
[ShopScout] Title: null
[ShopScout] Price: null
[ShopScout] Trying to find elements on page...
[ShopScout] Found 3 h1 elements on page
[ShopScout] H1 #0: Amazon Basics USB-C Cable...
[ShopScout] H1 #1: Product Details
[ShopScout] H1 #2: Customer Reviews
```

## Next Steps After Testing

### If Scraping Works
- Extension should automatically detect and analyze the product
- Sidebar should show product details, price comparison, etc.
- No further action needed!

### If Scraping Fails
1. **Copy all console logs** and share them
2. **Take a screenshot** of the Amazon page
3. **Check if Amazon's HTML changed** by inspecting the page
4. We may need to update the selectors in `content.js`

## Updating Selectors (If Needed)

If Amazon changed their HTML structure, we'll need to update the selectors in `content.js`:

```javascript
amazon: {
  selectors: {
    title: [
      '#productTitle',  // Add new selectors here
      '#title',
      'h1.product-title'
    ],
    price: [
      '.a-price .a-offscreen',  // Add new selectors here
      '#priceblock_ourprice'
    ]
  }
}
```

## Support

If you encounter issues:
1. Check all console logs (page console + background service worker)
2. Verify extension is loaded and active
3. Try on a different Amazon product page
4. Clear browser cache and reload

---

**Current Status**: Extension rebuilt with enhanced logging  
**Next Action**: Reload extension and test on Amazon product page
