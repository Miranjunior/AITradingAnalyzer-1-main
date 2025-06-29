import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useMarketData } from '../hooks/useMarketData';
import { CandlestickData } from '../types/trading';

interface AdvancedTradingChartProps {
  symbol: string;
  timeframe: string;
  height?: number;
  width?: number;
  darkMode?: boolean;
}

export function AdvancedTradingChart({
  symbol,
  timeframe,
  height = 600,
  width = 1000,
  darkMode = true
}: AdvancedTradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);

  const { data: marketData } = useMarketData(symbol);

  // Configuração inicial do gráfico
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      width,
      height,
      layout: {
        background: { color: darkMode ? '#1A1A1A' : '#FFFFFF' },
        textColor: darkMode ? '#D9D9D9' : '#191919',
      },
      grid: {
        vertLines: { color: darkMode ? '#2B2B2B' : '#E6E6E6' },
        horzLines: { color: darkMode ? '#2B2B2B' : '#E6E6E6' },
      },
      crosshair: {
        mode: 0, // normal
      },
      timeScale: {
        borderColor: darkMode ? '#4F4F4F' : '#B8B8B8',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: darkMode ? '#4F4F4F' : '#B8B8B8',
      },
    };

    const newChart = createChart(chartContainerRef.current, chartOptions);
    setChart(newChart);

    // Usar addCandlestickSeries corretamente
    // @ts-ignore
    const candleSeries = newChart.addCandlestickSeries({
      upColor: '#26A69A',
      downColor: '#EF5350',
      borderUpColor: '#26A69A',
      borderDownColor: '#EF5350',
      wickUpColor: '#26A69A',
      wickDownColor: '#EF5350',
    });
    setCandlestickSeries(candleSeries as ISeriesApi<'Candlestick'>);

    return () => {
      newChart.remove();
    };
  }, [darkMode, width, height]);

  // Atualizar dados do gráfico
  useEffect(() => {
    if (!candlestickSeries || !marketData) return;
    // marketData deve ser um array de CandlestickData
    const formattedData = Array.isArray(marketData)
      ? formatCandlestickData(marketData)
      : [];
    // Ajustar time para string (ISO) conforme esperado
    candlestickSeries.setData(formattedData);
  }, [marketData, candlestickSeries]);

  // Formatar dados para o gráfico
  const formatCandlestickData = (candlesticks: CandlestickData[]) => {
    return candlesticks.map(candle => ({
      time: new Date(candle.timestamp).toISOString(),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      // volume não é obrigatório para CandlestickData do lightweight-charts
    }));
  };

  return (
    <div className="relative">
      <div ref={chartContainerRef} />
      <div className="absolute top-4 right-4 space-x-2">
        <button
          className="px-3 py-1 text-sm rounded bg-blue-500 text-white"
          onClick={() => chart?.timeScale().fitContent()}
        >
          Ajustar
        </button>
        <button
          className="px-3 py-1 text-sm rounded bg-gray-500 text-white"
          onClick={() => {/* Implementar zoom */}}
        >
          Zoom
        </button>
      </div>
    </div>
  );
}
