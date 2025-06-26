import { ChartOptions } from 'chart.js';

export const candlestickChartConfig: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#334155',
      borderWidth: 1,
      callbacks: {
        title: (context) => {
          return `${context[0].label}`;
        },
        label: (context) => {
          const data = context.parsed;
          return [
            `Open: ${data.o?.toFixed(2)}`,
            `High: ${data.h?.toFixed(2)}`,
            `Low: ${data.l?.toFixed(2)}`,
            `Close: ${data.c?.toFixed(2)}`,
          ];
        },
      },
    },
  },
  scales: {
    x: {
      type: 'time',
      time: {
        displayFormats: {
          hour: 'HH:mm',
          day: 'MMM dd',
          week: 'MMM dd',
          month: 'MMM yyyy'
        }
      },
      grid: {
        color: '#334155',
        drawBorder: false,
      },
      ticks: {
        color: '#94A3B8',
        maxTicksLimit: 10,
      },
    },
    y: {
      position: 'right',
      grid: {
        color: '#334155',
        drawBorder: false,
      },
      ticks: {
        color: '#94A3B8',
        callback: function(value) {
          return `R$ ${(value as number).toFixed(2)}`;
        },
      },
    },
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 4,
    },
  },
};

export const lineChartConfig: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#334155',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        color: '#334155',
        drawBorder: false,
      },
      ticks: {
        color: '#94A3B8',
        maxTicksLimit: 10,
      },
    },
    y: {
      position: 'right',
      grid: {
        color: '#334155',
        drawBorder: false,
      },
      ticks: {
        color: '#94A3B8',
        callback: function(value) {
          return `R$ ${(value as number).toFixed(2)}`;
        },
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2,
    },
    point: {
      radius: 0,
      hoverRadius: 6,
    },
  },
};

export const chartColors = {
  bullish: '#10B981',
  bearish: '#EF4444',
  neutral: '#3B82F6',
  volume: '#64748B',
  ma20: '#F59E0B',
  ma50: '#8B5CF6',
  ma200: '#EC4899',
  bollinger: '#06B6D4',
  rsi: '#F97316',
  macd: '#84CC16',
};
