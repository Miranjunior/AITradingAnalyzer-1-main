import { useState } from 'react';
import { AIAnalysis, PatternDetection } from '../types/trading';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

interface AIAnalysisPanelProps {
  analysis: AIAnalysis | null;
  isLoading: boolean;
  className?: string;
}

export function AIAnalysisPanel({
  analysis,
  isLoading,
  className = ''
}: AIAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'technical' | 'patterns'>('summary');

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`p-4 ${className}`}>
        <p className="text-gray-500">Nenhuma análise disponível</p>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'summary'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('summary')}
        >
          Resumo
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'technical'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('technical')}
        >
          Técnico
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'patterns'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('patterns')}
        >
          Padrões
        </button>
      </div>

      {/* Conteúdo */}
      <div className="space-y-4">
        {activeTab === 'summary' && (
          <SummaryTab analysis={analysis} />
        )}
        {activeTab === 'technical' && (
          <TechnicalTab analysis={analysis} />
        )}
        {activeTab === 'patterns' && (
          <PatternsTab patterns={analysis.patterns} />
        )}
      </div>
    </div>
  );
}

function SummaryTab({ analysis }: { analysis: AIAnalysis }) {
  const recommendationColor = {
    BUY: 'bg-green-500',
    SELL: 'bg-red-500',
    HOLD: 'bg-yellow-500'
  }[analysis.recommendation];

  return (
    <Card className="p-4 bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <Badge className={recommendationColor}>
          {analysis.recommendation}
        </Badge>
        <div className="text-right">
          <p className="text-sm text-gray-400">Confiança</p>
          <Progress value={analysis.confidence} className="w-24" />
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4">{analysis.summary}</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Entrada</p>
          <p className="text-lg">{analysis.entryPrice}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Stop Loss</p>
          <p className="text-lg text-red-400">{analysis.stopLoss}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Take Profit</p>
          <p className="text-lg text-green-400">{analysis.takeProfit}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Risco</p>
          <Badge className={`
            ${analysis.riskLevel === 'LOW' ? 'bg-green-500' : ''}
            ${analysis.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : ''}
            ${analysis.riskLevel === 'HIGH' ? 'bg-red-500' : ''}
          `}>
            {analysis.riskLevel}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function TechnicalTab({ analysis }: { analysis: AIAnalysis }) {
  return (
    <Card className="p-4 bg-gray-800">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm text-gray-400 mb-2">Análise Detalhada</h3>
          <p className="text-sm">{analysis.detailedAnalysis}</p>
        </div>

        <div>
          <h3 className="text-sm text-gray-400 mb-2">Sentiment</h3>
          <div className="flex items-center space-x-4">
            <Badge className={`
              ${analysis.sentiment === 'BULLISH' ? 'bg-green-500' : ''}
              ${analysis.sentiment === 'BEARISH' ? 'bg-red-500' : ''}
              ${analysis.sentiment === 'NEUTRAL' ? 'bg-yellow-500' : ''}
            `}>
              {analysis.sentiment}
            </Badge>
            <Progress value={analysis.sentimentStrength} className="w-32" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PatternsTab({ patterns }: { patterns: PatternDetection[] }) {
  return (
    <Card className="p-4 bg-gray-800">
      <div className="space-y-4">
        {patterns.map((pattern, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <p className="font-medium">{pattern.name}</p>
              <p className="text-sm text-gray-400">{pattern.description}</p>
            </div>
            <div className="text-right">
              <Progress value={pattern.confidence} className="w-24" />
              <Badge className={pattern.bullish ? 'bg-green-500' : 'bg-red-500'}>
                {pattern.bullish ? 'Bullish' : 'Bearish'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
