import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

interface MarketSentimentProps {
  sentiment?: {
    bullish: number;
    bearish: number;
    neutral: number;
    overall: 'bullish' | 'bearish' | 'neutral';
  };
  newsImpact?: {
    title: string;
    impact: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'negative' | 'neutral';
    summary: string;
  }[];
}

export function MarketSentiment({ sentiment, newsImpact }: MarketSentimentProps) {
  const [filteredNews, setFilteredNews] = useState(newsImpact || []);

  useEffect(() => {
    setFilteredNews(newsImpact || []);
  }, [newsImpact]);

  return (
    <Card className="p-4">
      <h3 className="text-xl font-semibold mb-4">Sentimento de Mercado</h3>
      {sentiment && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Otimista</label>
            <Progress value={sentiment.bullish} max={100} />
            <span className="text-sm">{sentiment.bullish}%</span>
          </div>
          <div>
            <label className="block text-sm font-medium">Pessimista</label>
            <Progress value={sentiment.bearish} max={100} />
            <span className="text-sm">{sentiment.bearish}%</span>
          </div>
          <div>
            <label className="block text-sm font-medium">Neutro</label>
            <Progress value={sentiment.neutral} max={100} />
            <span className="text-sm">{sentiment.neutral}%</span>
          </div>
          <div className="mt-4">
            <span className="text-sm font-medium">Sentimento Geral: </span>
            <span className={`font-bold ${
              sentiment.overall === 'bullish' ? 'text-green-500' :
              sentiment.overall === 'bearish' ? 'text-red-500' :
              'text-gray-500'
            }`}>
              {sentiment.overall === 'bullish' ? 'Otimista' :
               sentiment.overall === 'bearish' ? 'Pessimista' :
               'Neutro'}
            </span>
          </div>
        </div>
      )}
      {filteredNews && filteredNews.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Notícias Relevantes</h4>
          <div className="space-y-3">
            {filteredNews.map((news, index) => (
              <div key={index} className="border-l-4 pl-3" style={{
                borderColor: news.sentiment === 'positive' ? '#10B981' :
                            news.sentiment === 'negative' ? '#EF4444' :
                            '#6B7280'
              }}>
                <h5 className="font-medium text-sm">{news.title}</h5>
                <p className="text-sm text-gray-600">{news.summary}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    news.impact === 'high' ? 'bg-red-100 text-red-800' :
                    news.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Impacto {
                      news.impact === 'high' ? 'Alto' :
                      news.impact === 'medium' ? 'Médio' :
                      'Baixo'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
