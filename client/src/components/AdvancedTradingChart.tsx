import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useMarketData } from '../hooks/useMarketData';
import { useTechnicalIndicators } from '../hooks/useTechnicalIndicators';
import { CandlestickData, TechnicalIndicators } from '../types/trading';

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
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  
  const { data: marketData } = useMarketData(symbol);
  const { data: indicators } = useTechnicalIndicators(symbol, timeframe);

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
        mode: 'normal',
        vertLine: {
          width: 1,
          color: darkMode ? '#4F4F4F' : '#B8B8B8',
          style: 0,
        },
        horzLine: {
          width: 1,
          color: darkMode ? '#4F4F4F' : '#B8B8B8',
          style: 0,
        },
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

    const candleSeries = newChart.addCandlestickSeries({
      upColor: '#26A69A',
      downColor: '#EF5350',
      borderUpColor: '#26A69A',
      borderDownColor: '#EF5350',
      wickUpColor: '#26A69A',
      wickDownColor: '#EF5350',
    });
    setCandlestickSeries(candleSeries);

    // Adicionar indicadores
    setupIndicators(newChart, indicators);

    return () => {
      newChart.remove();
    };
  }, [darkMode]);

  // Atualizar dados do gráfico
  useEffect(() => {
    if (!candlestickSeries || !marketData) return;

    const formattedData = formatCandlestickData(marketData.candlesticks);
    candlestickSeries.setData(formattedData);

    // Atualizar indicadores
    if (indicators) {
      updateIndicators(chart!, indicators);
    }
  }, [marketData, indicators]);

  // Configurar indicadores técnicos
  const setupIndicators = (chart: IChartApi, indicators: TechnicalIndicators | null) => {
    if (!indicators) return;

    // Bollinger Bands
    const bollingerBands = chart.addLineSeries({
      color: 'rgba(38, 166, 154, 0.4)',
      lineWidth: 1,
      priceLineVisible: false,
    });

    // RSI
    const rsiPane = chart.addPane(150);
    const rsiSeries = rsiPane.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => price.toFixed(2),
      },
    });

    // MACD
    const macdPane = chart.addPane(150);
    const macdLineSeries = macdPane.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
    });
    const signalLineSeries = macdPane.addLineSeries({
      color: '#FF6D00',
      lineWidth: 2,
    });
    const histogramSeries = macdPane.addHistogramSeries({
      color: '#26A69A',
    });

    // Volume
    const volumeSeries = chart.addHistogramSeries({
      color: '#26A69A',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
  };

  // Atualizar indicadores
  const updateIndicators = (chart: IChartApi, indicators: TechnicalIndicators) => {
    // Implementar atualização de cada indicador
  };

  // Formatar dados para o gráfico
  const formatCandlestickData = (candlesticks: CandlestickData[]) => {
    return candlesticks.map(candle => ({
      time: new Date(candle.timestamp).getTime() / 1000,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume || '0'),
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
