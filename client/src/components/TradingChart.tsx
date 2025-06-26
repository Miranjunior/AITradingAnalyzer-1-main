import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { CandlestickData, ChartType, Timeframe } from '@/types/trading';
import { lineChartConfig, chartColors } from '@/lib/chartConfig';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TradingChartProps {
  data: CandlestickData[];
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  isLoading?: boolean;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onChartTypeChange: (type: ChartType) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({
  data,
  symbol,
  timeframe,
  chartType,
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
}) => {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(timeframe);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(chartType);

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];
  const chartTypes: ChartType[] = ['candlestick', 'line', 'area'];

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setSelectedTimeframe(newTimeframe);
    onTimeframeChange(newTimeframe);
  };

  const handleChartTypeChange = (newType: ChartType) => {
    setSelectedChartType(newType);
    onChartTypeChange(newType);
  };

  const prepareChartData = () => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = data.map(candle => new Date(candle.timestamp));
    const prices = data.map(candle => parseFloat(candle.close));

    let datasets = [];

    if (selectedChartType === 'line') {
      datasets.push({
        label: symbol,
        data: prices,
        borderColor: chartColors.neutral,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      });
    } else if (selectedChartType === 'area') {
      datasets.push({
        label: symbol,
        data: prices,
        borderColor: chartColors.bullish,
        backgroundColor: `${chartColors.bullish}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      });
    } else {
      // Candlestick representation with OHLC data
      const candleData = data.map(candle => ({
        x: new Date(candle.timestamp),
        o: parseFloat(candle.open),
        h: parseFloat(candle.high),
        l: parseFloat(candle.low),
        c: parseFloat(candle.close)
      }));

      // Create high/low shadow lines
      datasets.push({
        label: `${symbol} (High-Low)`,
        data: data.map(candle => parseFloat(candle.high)),
        borderColor: chartColors.neutral + '40',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0,
        pointRadius: 0,
      });
      
      datasets.push({
        label: `${symbol} (Low)`,
        data: data.map(candle => parseFloat(candle.low)),
        borderColor: chartColors.neutral + '40',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        tension: 0,
        pointRadius: 0,
      });

      // Main price line (close)
      datasets.push({
        label: `${symbol} (Close)`,
        data: prices,
        borderColor: chartColors.bullish,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointBackgroundColor: prices.map((price, index) => {
          if (index === 0) return chartColors.neutral;
          return price >= prices[index - 1] ? chartColors.bullish : chartColors.bearish;
        }),
        pointBorderColor: '#fff',
        pointRadius: 2,
        pointHoverRadius: 4,
      });
    }

    return {
      labels,
      datasets,
    };
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-navy-800/30 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Carregando dados do gráfico...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-navy-800/30 rounded-lg">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-2">Nenhum dado disponível</p>
          <p className="text-slate-500 text-sm">
            Não foi possível carregar os dados do gráfico para {symbol}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex bg-navy-700 rounded-lg p-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant="ghost"
                size="sm"
                className={`px-3 py-1 text-xs rounded ${
                  selectedTimeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => handleTimeframeChange(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex bg-navy-700 rounded-lg p-1">
          {chartTypes.map((type) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              className={`px-3 py-1 text-xs rounded capitalize ${
                selectedChartType === type
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => handleChartTypeChange(type)}
            >
              {type === 'candlestick' ? 'Candlestick' : type}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 bg-navy-800/30 rounded-lg p-4 relative">
        <Line
          ref={chartRef}
          data={prepareChartData()}
          options={{
            ...lineChartConfig,
            plugins: {
              ...lineChartConfig.plugins,
              tooltip: {
                ...lineChartConfig.plugins?.tooltip,
                callbacks: {
                  title: (context) => {
                    const date = new Date(context[0].label);
                    return date.toLocaleString('pt-BR');
                  },
                  label: (context) => {
                    const value = context.parsed.y;
                    return `${context.dataset.label}: R$ ${value.toFixed(2)}`;
                  },
                },
              },
            },
            scales: {
              ...lineChartConfig.scales,
              y: {
                ...lineChartConfig.scales?.y,
                ticks: {
                  ...lineChartConfig.scales?.y?.ticks,
                  callback: function(value) {
                    return `R$ ${(value as number).toFixed(2)}`;
                  },
                },
              },
            },
          }}
        />

        {/* Chart Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-800/50 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Atualizando...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingChart;
