import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, AlertTriangle, Binary } from 'lucide-react';
import { useAIAnalysis, useMarketStatus } from '@/hooks/useAIAnalysis';
import { useTechnicalIndicators } from '@/hooks/useMarketData';
import { Timeframe } from '@/types/trading';
import BinaryOptionsPanel from './BinaryOptionsPanel';

interface AnalysisSidebarProps {
  selectedSymbol: string;
  timeframe: Timeframe;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({
  selectedSymbol,
  timeframe,
}) => {
  const { data: analysis, isLoading: analysisLoading } = useAIAnalysis(selectedSymbol, timeframe);
  const { data: indicators, isLoading: indicatorsLoading } = useTechnicalIndicators(selectedSymbol, timeframe);
  const { data: marketStatus } = useMarketStatus();

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-green-500';
      case 'BEARISH': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-80 bg-navy-900/80 border-l border-navy-600 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Market Status */}
        <Card className="p-4 bg-navy-800/50 border-navy-600">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Status do Mercado</h3>
            <div className={`w-3 h-3 rounded-full ${marketStatus?.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <p className="text-sm text-slate-400">
            {marketStatus?.isOpen ? 'Mercado Aberto' : 'Mercado Fechado'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </Card>

        {/* Analysis Tabs */}
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-navy-800">
            <TabsTrigger value="analysis" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Análise
            </TabsTrigger>
            <TabsTrigger value="binary" className="text-xs">
              <Binary className="h-3 w-3 mr-1" />
              Binário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {/* AI Analysis */}
            <Card className="p-4 bg-navy-800/50 border-navy-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Análise IA</h3>
                {analysis && (
                  <Badge variant="outline" className={getRecommendationColor(analysis.recommendation)}>
                    {analysis.recommendation}
                  </Badge>
                )}
              </div>
              
              {analysisLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-400 text-sm mt-2">Analisando...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Recomendação:</span>
                    <div className="flex items-center space-x-2">
                      {getRecommendationIcon(analysis.recommendation)}
                      <span className={`font-medium ${getRecommendationColor(analysis.recommendation)}`}>
                        {analysis.recommendation}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Confiança:</span>
                    <Badge variant="outline">
                      {analysis.confidence}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Sentimento:</span>
                    <span className={`text-sm font-medium ${getSentimentColor(analysis.sentiment)}`}>
                      {analysis.sentiment}
                    </span>
                  </div>
                  
                  {analysis.reasoning && (
                    <div className="mt-3 p-3 bg-navy-700/30 rounded">
                      <p className="text-xs text-slate-300">{analysis.reasoning}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Análise não disponível</p>
                </div>
              )}
            </Card>

            {/* Technical Indicators */}
            <Card className="p-4 bg-navy-800/50 border-navy-600">
              <h3 className="text-lg font-semibold text-white mb-3">Indicadores Técnicos</h3>
              
              {indicatorsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-400 text-sm mt-2">Calculando...</p>
                </div>
              ) : indicators ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-navy-700/30 rounded">
                      <p className="text-xs text-slate-400">RSI</p>
                      <p className="text-sm font-medium text-white">
                        {indicators.rsi ? parseFloat(indicators.rsi).toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="p-2 bg-navy-700/30 rounded">
                      <p className="text-xs text-slate-400">MACD</p>
                      <p className="text-sm font-medium text-white">
                        {indicators.macd ? parseFloat(indicators.macd).toFixed(4) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="p-2 bg-navy-700/30 rounded">
                      <p className="text-xs text-slate-400">MA 20</p>
                      <p className="text-sm font-medium text-white">
                        {indicators.sma20 ? parseFloat(indicators.sma20).toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="p-2 bg-navy-700/30 rounded">
                      <p className="text-xs text-slate-400">MA 50</p>
                      <p className="text-sm font-medium text-white">
                        {indicators.sma50 ? parseFloat(indicators.sma50).toFixed(2) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Target className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Indicadores não disponíveis</p>
                </div>
              )}
            </Card>

            {/* Disclaimer */}
            <Card className="p-4 bg-amber-900/20 border-amber-700/50">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-amber-400 mb-2">Aviso Importante</h4>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    As análises e recomendações são baseadas em algoritmos de IA e não constituem aconselhamento financeiro personalizado. 
                    Investimentos envolvem riscos e podem resultar em perdas. Consulte sempre um profissional qualificado.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="binary" className="mt-4">
            <BinaryOptionsPanel selectedSymbol={selectedSymbol} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalysisSidebar;