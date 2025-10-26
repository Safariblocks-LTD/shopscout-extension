/**
 * Real Price Tracking System - Fixed for ES modules
 * This module provides real-time price tracking functionality
 */

import { PriceHistory } from './database.js';
import { Op } from 'sequelize';

/**
 * Record real price data for a product
 * @param {string} productId - Unique product identifier
 * @param {number} price - Current price
 * @param {string} source - Website source (amazon, ebay, etc.)
 * @param {string} productUrl - Product URL for verification
 * @param {string} productName - Product name
 * @returns {Promise<Object>} - Created price record
 */
export async function recordPrice(productId, price, source, productUrl, productName) {
  try {
    // Check if this exact price was already recorded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await PriceHistory.findOne({
      where: {
        productId,
        source,
        price: price,
        recordedAt: {
          [Op.gte]: today
        }
      }
    });

    if (existing) {
      console.log(`[Price Tracker] Price already recorded today for ${productId} @ ${source}`);
      return existing;
    }

    // Record new price
    const priceRecord = await PriceHistory.create({
      productId,
      price: parseFloat(price),
      source,
      recordedAt: new Date()
    });

    console.log(`[Price Tracker] Recorded price: ${productId} @ ${source} = $${price}`);
    return priceRecord;
  } catch (error) {
    console.error('[Price Tracker] Error recording price:', error.message);
    throw error;
  }
}

/**
 * Get price history for a product
 * @param {string} productId - Product ID
 * @param {number} limit - Maximum number of records
 * @returns {Promise<Array>} - Price history records
 */
export async function getPriceHistory(productId, limit = 30) {
  try {
    const history = await PriceHistory.findAll({
      where: { productId },
      order: [['recordedAt', 'DESC']],
      limit: limit
    });
    
    return history.map(h => ({
      date: h.recordedAt.getTime(),
      price: parseFloat(h.price),
      source: h.source
    }));
  } catch (error) {
    console.error('[Price Tracker] Error getting price history:', error.message);
    throw error;
  }
}

/**
 * Get price statistics for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Price statistics
 */
export async function getPriceStats(productId) {
  try {
    const history = await PriceHistory.findAll({
      where: { productId },
      order: [['recordedAt', 'ASC']]
    });

    if (!history || history.length === 0) {
      return null;
    }

    const prices = history.map(h => parseFloat(h.price));
    const dates = history.map(h => h.recordedAt);

    return {
      currentPrice: prices[prices.length - 1],
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      firstRecorded: dates[0],
      lastRecorded: dates[dates.length - 1],
      priceChange: prices[prices.length - 1] - prices[0],
      priceChangePercent: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100,
      priceHistory: history.map(h => ({
        date: h.recordedAt.getTime(),
        price: parseFloat(h.price),
        source: h.source
      }))
    };
  } catch (error) {
    console.error('[Price Tracker] Error getting price stats:', error.message);
    throw error;
  }
}

/**
 * Get products with price drops
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Products with price drops
 */
export async function getPriceDrops(days = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const products = await PriceHistory.findAll({
      where: {
        recordedAt: {
          [Op.gte]: cutoffDate
        }
      },
      order: [['productId', 'ASC'], ['recordedAt', 'ASC']]
    });

    const productGroups = {};
    products.forEach(record => {
      if (!productGroups[record.productId]) {
        productGroups[record.productId] = [];
      }
      productGroups[record.productId].push(record);
    });

    const priceDrops = [];
    Object.keys(productGroups).forEach(productId => {
      const records = productGroups[productId];
      if (records.length >= 2) {
        const firstPrice = parseFloat(records[0].price);
        const lastPrice = parseFloat(records[records.length - 1].price);
        const change = lastPrice - firstPrice;
        
        if (change < 0) {
          priceDrops.push({
            productId,
            oldPrice: firstPrice,
            newPrice: lastPrice,
            priceDrop: Math.abs(change),
            priceDropPercent: (Math.abs(change) / firstPrice) * 100,
            recordedAt: records[records.length - 1].recordedAt
          });
        }
      }
    });

    return priceDrops.sort((a, b) => b.priceDropPercent - a.priceDropPercent);
  } catch (error) {
    console.error('[Price Tracker] Error getting price drops:', error.message);
    throw error;
  }
}
