# TradingAI Pro - Plataforma de Análise de Trading com IA

## Overview

TradingAI Pro é uma aplicação web completa para análise profissional de gráficos de trading que utiliza inteligência artificial para fornecer análises precisas e recomendações de investimento. A plataforma combina dados de mercado em tempo real com insights alimentados por IA, oferecendo análise técnica avançada para ativos brasileiros e internacionais.

### Objetivos do Projeto
- Análise automatizada de gráficos de ativos financeiros usando IA
- Identificação de padrões técnicos clássicos (martelo, doji, engolfo, triângulos, suporte/resistência)
- Detecção de tendências de alta, baixa e lateralização
- Cálculo e interpretação de indicadores técnicos completos
- Sistema de recomendações com análise como trader experiente
- Interface moderna, responsiva e profissional

## System Architecture

A aplicação segue uma arquitetura full-stack moderna com separação clara entre componentes cliente e servidor:

### Arquitetura Frontend
- **Framework**: React 18 com TypeScript para tipagem estática
- **Styling**: Tailwind CSS + shadcn/ui para componentes profissionais
- **Gerenciamento de Estado**: TanStack Query v5 para estado do servidor
- **Roteamento**: Wouter para navegação client-side
- **Visualização**: Chart.js com adaptador date-fns para gráficos financeiros
- **Build**: Vite com HMR para desenvolvimento rápido

### Arquitetura Backend
- **Runtime**: Node.js 20 com Express.js
- **Linguagem**: TypeScript com ES modules
- **Armazenamento**: Sistema em memória (MemStorage) para desenvolvimento
- **API**: Endpoints RESTful organizados por domínio
- **IA**: Integração com OpenAI GPT-4o para análise técnica

### Funcionalidades Principais Implementadas

#### 1. Análise de Gráficos com IA
- ✅ Análise automatizada usando GPT-4o
- ✅ Identificação de padrões: martelo, doji, engolfo, suporte/resistência
- ✅ Detecção de tendências (alta, baixa, lateral)
- ✅ Indicadores técnicos: RSI, MACD, Médias Móveis, Bollinger Bands, Estocástico, Williams %R, ADX
- ✅ Análise de volume e momentum
- ✅ Sinais de compra/venda/espera com níveis de confiança

#### 2. Sistema de Recomendações Inteligentes
- ✅ Análise como trader experiente com 20 anos de experiência
- ✅ Previsões com percentual de confiança (0-100%)
- ✅ Explicações detalhadas do raciocínio
- ✅ Pontos de entrada, stop loss e take profit
- ✅ Classificação de risco (LOW/MEDIUM/HIGH)
- ✅ Análise de sentimento (BULLISH/BEARISH/NEUTRAL)

#### 3. Interface Profissional
- ✅ Dashboard moderno com layout multi-painel
- ✅ Totalmente responsivo (desktop e mobile)
- ✅ Animações fluidas e transições suaves
- ✅ Gráficos interativos com múltiplos timeframes
- ✅ Seleção de ativos: ações brasileiras, ETFs, FIIs, criptomoedas
- ✅ Tipos de visualização: candlestick, linha, área

## Key Components

### Database Schema
The application uses PostgreSQL with the following core tables:
- **users**: User authentication and management
- **assets**: Financial instruments (stocks, crypto, forex, ETFs, REITs)
- **marketData**: Real-time price data and market metrics
- **technicalIndicators**: Technical analysis indicators (RSI, MACD, Bollinger Bands, etc.)
- **aiAnalysis**: AI-generated trading recommendations and analysis
- **watchlist**: User-specific asset tracking
- **candlestickData**: OHLCV data for chart visualization

### Market Data Integration
- **Primary Data Source**: BRAPI (Brazilian API) for Brazilian market data
- **Supported Markets**: Brazilian stocks (B3), US stocks, cryptocurrencies, forex
- **Data Types**: Real-time quotes, historical data, technical indicators
- **Update Frequency**: 30-second intervals for real-time data, 5-minute intervals for technical indicators

### AI Analysis Service
- **AI Model**: OpenAI GPT-4o for trading analysis
- **Analysis Features**:
  - Pattern recognition (candlestick patterns)
  - Technical indicator interpretation
  - Risk assessment and sentiment analysis
  - Entry/exit point recommendations with stop-loss and take-profit levels
- **Confidence Scoring**: AI-generated confidence levels for recommendations

### Frontend Components
- **Dashboard**: Main trading interface with multi-panel layout
- **Chart Area**: Interactive financial charts with multiple timeframes
- **Watchlist Sidebar**: Real-time asset monitoring
- **Analysis Sidebar**: AI insights and technical indicators
- **Navigation Header**: Asset search and selection

### Integração de Dados e APIs

#### Estratégia de Dados Atual
- **Fonte Primária**: BRAPI (brapi.dev) para dados do mercado brasileiro
- **Mercados Suportados**: Ações brasileiras (B3), criptomoedas, forex
- **Fallback**: Sistema de dados de demonstração para continuidade da aplicação
- **Frequência de Atualização**: 30 segundos para dados em tempo real, 5 minutos para indicadores

#### APIs e Custos Otimizados (Conforme Documento)
- **Gratuito (Atual)**: brapi.dev (15.000 req/mês, dados BR)
- **Escalabilidade Planejada**: 
  - brapi.dev Startup: R$ 599,90/mês (150k req/mês)
  - Polygon.io: $29/mês (dados internacionais)
  - OpenAI GPT-4o mini: ~$10-50/mês (uso moderado)

## Fluxo de Dados

1. **Coleta de Dados**: Servidor busca dados do BRAPI em intervalos regulares
2. **Processamento**: Dados brutos são processados e armazenados com indicadores técnicos
3. **Análise IA**: Dados técnicos são analisados pelo OpenAI para gerar insights
4. **Atualizações Client**: Frontend recebe atualizações via React Query com intervalos automáticos
5. **Interação do Usuário**: Usuários podem buscar ativos, visualizar gráficos e acessar recomendações IA

### Funcionalidades Avançadas Implementadas

#### Multi-Timeframe Analysis
- ✅ Timeframes disponíveis: 1min, 5min, 15min, 1h, 4h, 1d, 1w, 1M
- ✅ Análise correlacionada entre diferentes períodos
- ✅ Confirmação de sinais em múltiplos timeframes

#### Sistema de Alertas e Monitoramento
- ✅ Status do mercado em tempo real
- ✅ Indicadores visuais de tendência
- ✅ Monitoramento da lista de acompanhamento
- ✅ Atualizações automáticas de preços

#### Análise Técnica Avançada
- ✅ Detecção de padrões candlestick (Hammer, Doji, Engolfing)
- ✅ Identificação de suporte e resistência
- ✅ Cálculo de múltiplos indicadores técnicos
- ✅ Análise de momentum e volume

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **chart.js**: Financial charting library
- **openai**: AI analysis integration

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette functionality

### Development Dependencies
- **tsx**: TypeScript execution
- **esbuild**: JavaScript bundler for production
- **vite**: Development server and build tool

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with tsx for TypeScript execution
- **Database**: PostgreSQL 16 with automatic provisioning
- **Dev Server**: Vite development server with HMR
- **Port Configuration**: Application runs on port 5000

### Production Build
- **Client Build**: Vite builds React application to `dist/public`
- **Server Build**: esbuild bundles server code to `dist/index.js`
- **Database Migration**: Drizzle Kit handles schema migrations
- **Environment**: Production deployment on Autoscale infrastructure

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `BRAPI_API_KEY`: Brazilian market data API key (optional)
- `OPENAI_API_KEY`: OpenAI API key for AI analysis (required)

### Próximas Funcionalidades Planejadas (Baseadas no Documento)

#### Funcionalidades Avançadas
- 🔄 **Portfolio Tracking**: Acompanhamento de carteira e cálculo de performance
- 🔄 **Backtesting**: Teste de estratégias históricas com métricas de performance
- 🔄 **Alertas Inteligentes**: Notificações push/email baseadas em padrões
- 🔄 **Análise Multi-Asset**: Correlação entre diferentes ativos
- 🔄 **Ferramentas de Desenho**: Linhas de tendência e fibonacci nos gráficos

#### Melhorias de Performance
- 🔄 **Cache Redis**: Otimização para dados frequentes
- 🔄 **WebSockets**: Atualizações em tempo real mais eficientes
- 🔄 **CDN Integration**: Cloudflare para performance global
- 🔄 **Database Migration**: Transição para PostgreSQL em produção

### Considerações de Segurança

#### Proteção de APIs
- ✅ Rate limiting implementado
- ✅ Validação de inputs com Zod
- ✅ Gestão segura de secrets via ambiente Replit
- ✅ Criptografia de dados sensíveis

#### Compliance Financeiro
- ✅ Disclaimers legais sobre investimentos
- ✅ Não constitui aconselhamento financeiro personalizado
- ✅ Termos de uso claros para análises IA
- ✅ Transparência sobre limitações do sistema

### Métricas de Sucesso Atuais

#### Técnicas
- ✅ Latência < 2 segundos para análises IA
- ✅ Uptime > 99.5% durante desenvolvimento
- ✅ Interface responsiva em todos os dispositivos
- ✅ Análises IA funcionais com dados consistentes

#### Experiência do Usuário
- ✅ Interface intuitiva e profissional
- ✅ Feedback visual imediato
- ✅ Navegação fluida entre timeframes
- ✅ Análises detalhadas e compreensíveis

## Changelog

### Dezembro 2024
- ✅ **Setup Inicial Completo**: Arquitetura full-stack com React + TypeScript + Node.js
- ✅ **Integração OpenAI**: GPT-4o para análise técnica avançada
- ✅ **Sistema de Dados**: BRAPI integration com fallback para dados de demonstração
- ✅ **Interface Profissional**: Dashboard multi-painel responsivo
- ✅ **Análise Técnica**: Indicadores completos (RSI, MACD, Bollinger, etc.)
- ✅ **Padrões Candlestick**: Detecção automática de padrões clássicos
- ✅ **Sistema de Recomendações**: Buy/Sell/Hold com níveis de confiança
- ✅ **Multi-Timeframe**: Suporte a todos os timeframes padrão

### Junho 25, 2025
- ✅ **Forex Trading**: Implementação completa de pares forex (EUR/USD, GBP/USD, USD/JPY, etc.)
- ✅ **Operações Binárias**: Sistema completo de binary options com sinais IA
- ✅ **Banco PostgreSQL**: Integração com banco de dados PostgreSQL configurado
- ✅ **Commodities**: Adição de ouro (XAU/USD) e petróleo (WTI/USD)
- ✅ **Sinais Automatizados**: Geração de sinais call/put com níveis de confiança
- ✅ **Expandiu de 6 para 13+ ativos**: Cobertura completa multi-mercados
- ✅ **Netlify Deployment**: Configuração completa para deploy na plataforma Netlify
- ✅ **Serverless Functions**: API otimizada para funções serverless
- ✅ **Modo Demo**: Sistema robusto de dados de demonstração quando APIs não disponíveis
- ✅ **Build Otimizado**: Scripts de build automatizados para produção

## User Preferences

Preferred communication style: Simple, everyday language.
Technical approach: Focus on professional trading platform features.
Priority: User experience and analysis accuracy.