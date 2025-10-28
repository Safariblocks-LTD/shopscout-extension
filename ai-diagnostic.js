// AI Diagnostic Script - Run this in the console on a product page
// Copy and paste this entire script into the browser console

(async function() {
  console.log('=== ShopScout AI Diagnostic ===\n');
  
  // 1. Check if AI is available
  console.log('1. Checking Chrome AI availability...');
  console.log('   globalThis.ai exists:', !!globalThis.ai);
  console.log('   ai.summarizer exists:', !!globalThis.ai?.summarizer);
  console.log('   ai.languageModel exists:', !!globalThis.ai?.languageModel);
  console.log('   ai.languageDetector exists:', !!globalThis.ai?.languageDetector);
  
  if (!globalThis.ai) {
    console.error('❌ Chrome AI not available. Enable AI flags and download Gemini Nano.');
    return;
  }
  
  // 2. Check Summarizer availability
  if (globalThis.ai.summarizer) {
    console.log('\n2. Checking Summarizer API...');
    try {
      const availability = await ai.summarizer.availability();
      console.log('   Summarizer availability:', availability);
      
      if (availability === 'readily' || availability === 'after-download') {
        console.log('   ✅ Summarizer is available');
        
        // Try to create summarizer
        try {
          const summarizer = await ai.summarizer.create({
            type: 'key-points',
            format: 'plain-text',
            length: 'short'
          });
          console.log('   ✅ Summarizer created successfully');
          
          // Try to summarize
          const testText = 'This is a great product with excellent features and good value for money.';
          const summary = await summarizer.summarize(testText);
          console.log('   ✅ Summary generated:', summary);
        } catch (err) {
          console.error('   ❌ Summarizer creation failed:', err.message);
        }
      } else {
        console.error('   ❌ Summarizer unavailable');
      }
    } catch (err) {
      console.error('   ❌ Summarizer check failed:', err.message);
    }
  }
  
  // 3. Check if AI scripts are loaded
  console.log('\n3. Checking if AI scripts are loaded...');
  console.log('   detectAICapabilities exists:', typeof detectAICapabilities !== 'undefined');
  console.log('   initializeAISummary exists:', typeof initializeAISummary !== 'undefined');
  console.log('   renderSummaryIntoDOM exists:', typeof renderSummaryIntoDOM !== 'undefined');
  console.log('   showSkeleton exists:', typeof showSkeleton !== 'undefined');
  
  // 4. Check if product was detected
  console.log('\n4. Checking product detection...');
  const productTitle = document.querySelector('#productTitle, .product-title, h1');
  console.log('   Product title element found:', !!productTitle);
  if (productTitle) {
    console.log('   Product title:', productTitle.textContent?.trim().substring(0, 50) + '...');
  }
  
  // 5. Check if AI summary element exists
  console.log('\n5. Checking AI summary in DOM...');
  const aiSummary = document.querySelector('.shopscout-ai-summary');
  const aiSkeleton = document.querySelector('.shopscout-ai-summary-skeleton');
  console.log('   AI summary element exists:', !!aiSummary);
  console.log('   AI skeleton element exists:', !!aiSkeleton);
  
  if (aiSummary) {
    console.log('   ✅ AI summary found in DOM');
    console.log('   Summary content:', aiSummary.textContent?.substring(0, 100) + '...');
  } else if (aiSkeleton) {
    console.log('   ⏳ AI skeleton found (loading...)');
  } else {
    console.log('   ❌ No AI summary or skeleton found');
  }
  
  // 6. Try to manually trigger AI summary
  console.log('\n6. Attempting to manually trigger AI summary...');
  if (typeof initializeAISummary !== 'undefined') {
    try {
      const mockProduct = {
        title: productTitle?.textContent?.trim() || 'Test Product',
        price: '99.99',
        site: 'amazon',
        asin: 'TEST123'
      };
      console.log('   Calling initializeAISummary with:', mockProduct);
      await initializeAISummary(mockProduct);
      console.log('   ✅ initializeAISummary called successfully');
    } catch (err) {
      console.error('   ❌ initializeAISummary failed:', err.message);
      console.error('   Error stack:', err.stack);
    }
  } else {
    console.error('   ❌ initializeAISummary function not found');
  }
  
  console.log('\n=== Diagnostic Complete ===');
  console.log('Check the messages above to identify the issue.');
})();
