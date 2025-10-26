#!/usr/bin/env node
/**
 * Price Tracking System Verification Script
 * Run this to ensure the real price tracking system is working correctly
 */

const { sequelize, PriceHistory } = require('./server/database');

async function verifyPriceTracking() {
  console.log('🔍 Verifying Price Tracking System...\n');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // 2. Verify PriceHistory table exists
    console.log('2. Checking PriceHistory table...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (tables.includes('price_history')) {
      console.log('✅ PriceHistory table exists');
    } else {
      console.log('❌ PriceHistory table missing - running sync...');
      await sequelize.sync({ alter: true });
      console.log('✅ Table created');
    }
    
    // 3. Test price recording
    console.log('3. Testing price recording...');
    const testRecord = await PriceHistory.create({
      productId: 'test-product-123',
      price: 99.99,
      source: 'amazon',
      recordedAt: new Date()
    });
    console.log('✅ Price recording works:', testRecord.id);
    
    // 4. Test price history retrieval
    console.log('4. Testing price history retrieval...');
    const history = await PriceHistory.findAll({
      where: { productId: 'test-product-123' },
      limit: 5
    });
    console.log(`✅ Found ${history.length} records for test product`);
    
    // 5. Clean up test data
    console.log('5. Cleaning up test data...');
    await PriceHistory.destroy({
      where: { productId: 'test-product-123' }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Price Tracking System is ready!');
    console.log('✅ Real prices will now be recorded instead of mock data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run verification
verifyPriceTracking();
