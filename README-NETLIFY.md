# TradingAI Pro - Netlify Deployment Guide

## Quick Deployment Steps

### 1. Environment Variables Setup
Add these environment variables in your Netlify dashboard:

```
OPENAI_API_KEY=your-openai-api-key-here
BRAPI_API_KEY=your-brapi-api-key-here (optional)
DATABASE_URL=your-postgresql-database-url
NODE_ENV=production
```

### 2. Deploy to Netlify
1. Connect your repository to Netlify
2. Build settings are automatically configured via `netlify.toml`
3. Build command: `node build-netlify.js`
4. Publish directory: `dist/public`
5. Functions directory: `dist/functions`

### 3. Required API Keys

#### OpenAI API Key (Required)
- Visit: https://platform.openai.com/api-keys
- Create a new API key
- Add to Netlify environment variables as `OPENAI_API_KEY`

#### BRAPI API Key (Optional)
- Visit: https://brapi.dev/
- Sign up for an account
- Get your API key from the dashboard
- Add to Netlify environment variables as `BRAPI_API_KEY`
- **Note:** Without this key, the app will run in demo mode with mock data

#### Database URL (Required)
- Use any PostgreSQL database service (Supabase, Neon, etc.)
- Add the connection string as `DATABASE_URL`

## Features

### Core Functionality
- AI-powered trading analysis using GPT-4
- Real-time market data visualization
- Technical indicators (RSI, MACD, Bollinger Bands, etc.)
- Candlestick pattern recognition
- Multi-timeframe analysis
- Binary options signals
- Forex trading pairs
- Cryptocurrency tracking

### Supported Assets
- Brazilian stocks (PETR4, VALE3, ITUB4, BBDC4)
- Forex pairs (EUR/USD, GBP/USD, USD/JPY, etc.)
- Cryptocurrencies (BTC/USDT, ETH/USDT)
- Commodities (Gold, Oil)

## Technical Architecture

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Chart.js for financial charts
- TanStack Query for data management
- Responsive design for all devices

### Backend
- Node.js with Express.js
- PostgreSQL database with Drizzle ORM
- OpenAI GPT-4 integration
- BRAPI for Brazilian market data
- Serverless functions for Netlify

### AI Analysis Features
- Pattern recognition (Hammer, Doji, Engulfing, etc.)
- Technical indicator interpretation
- Risk assessment and sentiment analysis
- Entry/exit point recommendations
- Confidence scoring for all predictions

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Ensure all dependencies are installed
   - Check that environment variables are set
   - Verify Node.js version compatibility

2. **API Errors**
   - Check that OPENAI_API_KEY is valid
   - Verify BRAPI_API_KEY if using real market data
   - Ensure database connection string is correct

3. **Charts Not Loading**
   - Usually resolved by refreshing the page
   - Check browser console for errors
   - Ensure data is being fetched from the API

### Demo Mode
If no BRAPI_API_KEY is provided, the application automatically runs in demo mode with realistic mock data for all supported assets.

## Performance Optimization

The application includes:
- Automatic data caching
- Efficient chart rendering
- Optimized API calls
- Responsive loading states
- Error boundaries for stability

## Security Features

- Input validation with Zod schemas
- Rate limiting protection
- Secure API key management
- CORS configuration
- XSS protection headers

## Legal Disclaimer

This application is for educational and informational purposes only. It does not constitute financial advice. Users should conduct their own research and consult with qualified financial advisors before making investment decisions.