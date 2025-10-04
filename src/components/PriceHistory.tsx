import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Bell } from 'lucide-react';
import { PriceHistoryData } from '../types';
import { formatPrice, formatDate } from '../utils/format';

interface PriceHistoryProps {
  data: PriceHistoryData;
  currentPrice: number;
  onTrackPrice: (targetPrice: number) => void;
}

export default function PriceHistory({ data, currentPrice, onTrackPrice }: PriceHistoryProps) {
  const [period, setPeriod] = useState<30 | 90>(30);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  const filteredPrices = data.prices.slice(-period);
  const chartData = filteredPrices.map(p => ({
    date: formatDate(p.date),
    price: p.price,
  }));

  const minPrice = Math.min(...filteredPrices.map(p => p.price));
  const maxPrice = Math.max(...filteredPrices.map(p => p.price));
  const avgPrice = filteredPrices.reduce((sum, p) => sum + p.price, 0) / filteredPrices.length;
  const trend = filteredPrices[filteredPrices.length - 1].price - filteredPrices[0].price;

  const handleTrackPrice = () => {
    const price = parseFloat(targetPrice);
    if (price > 0) {
      onTrackPrice(price);
      setShowTrackModal(false);
      setTargetPrice('');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-900">Price History</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriod(30)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              period === 30
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            30 days
          </button>
          <button
            onClick={() => setPeriod(90)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              period === 90
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            90 days
          </button>
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-neutral-50 rounded-lg">
          <div className="text-xs text-neutral-600 mb-1">Lowest</div>
          <div className="text-sm font-bold text-success-dark">{formatPrice(minPrice)}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded-lg">
          <div className="text-xs text-neutral-600 mb-1">Average</div>
          <div className="text-sm font-bold text-neutral-900">{formatPrice(avgPrice)}</div>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded-lg">
          <div className="text-xs text-neutral-600 mb-1">Highest</div>
          <div className="text-sm font-bold text-danger-dark">{formatPrice(maxPrice)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatPrice(value), 'Price']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#1E88E5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg mb-3">
        <div className="flex items-center gap-2">
          {trend < 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-success-dark" />
              <span className="text-sm font-medium text-success-dark">
                Price decreased by {formatPrice(Math.abs(trend))}
              </span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-danger-dark" />
              <span className="text-sm font-medium text-danger-dark">
                Price increased by {formatPrice(trend)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Track Price Button */}
      {!showTrackModal ? (
        <button
          onClick={() => setShowTrackModal(true)}
          className="w-full btn btn-secondary flex items-center justify-center gap-2"
        >
          <Bell className="w-4 h-4" />
          Track Price
        </button>
      ) : (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <label className="block text-xs font-medium text-neutral-700 mb-2">
            Notify me when price drops below:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder={formatPrice(currentPrice * 0.9)}
              className="input flex-1 text-sm"
            />
            <button
              onClick={handleTrackPrice}
              className="btn btn-primary text-sm"
            >
              Set Alert
            </button>
          </div>
          <button
            onClick={() => setShowTrackModal(false)}
            className="text-xs text-neutral-600 hover:text-neutral-900 mt-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
