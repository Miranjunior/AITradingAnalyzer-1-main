# cole este código no seu novo arquivo api.py
from fastapi import FastAPI
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Inicia a aplicação FastAPI
app = FastAPI()

def run_analysis():
    """
    Esta função encapsula toda a lógica de análise de dados e treinamento do modelo.
    """
    # 1. Carregar e Limpar Dados
    try:
        # Garante que o Vercel encontre o arquivo no caminho certo
        df = pd.read_csv('WINFUT_M5.csv', sep='\t')
        df.rename(columns={'<DATE>': 'Data', '<TIME>': 'Hora', '<OPEN>': 'Abertura',
                           '<HIGH>': 'Maxima', '<LOW>': 'Minima', '<CLOSE>': 'Fechamento',
                           '<TICKVOL>': 'Tickvol', '<VOL>': 'Volume', '<SPREAD>': 'Spread'}, inplace=True)
        df['Data'] = pd.to_datetime(df['Data'] + ' ' + df['Hora'])
        df.set_index('Data', inplace=True)
        df.drop(columns=['Hora', 'Tickvol', 'Spread'], inplace=True)
    except FileNotFoundError:
        return {"error": "Arquivo WINFUT_M5.csv não encontrado no repositório."}
    
    # 2. Engenharia de Atributos (Features)
    df['RetornoDiario'] = df['Fechamento'].pct_change()
    df['MMS_20'] = df['Fechamento'].rolling(window=20).mean()
    delta = df['Fechamento'].diff()
    ganho = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    perda = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = ganho / perda
    df['RSI'] = 100 - (100 / (1 + rs))
    df.dropna(inplace=True)

    # 3. Definir Alvo
    df['Alvo'] = (df['Fechamento'].shift(-1) > df['Fechamento']).astype(int)
    df.dropna(inplace=True)

    if df.empty:
        return {"error": "Não há dados suficientes para treinar o modelo após a limpeza."}

    # 4. Preparar para o Modelo
    features = ['Abertura', 'Maxima', 'Minima', 'Fechamento', 'Volume', 'RetornoDiario', 'MMS_20', 'RSI']
    X = df[features]
    y = df['Alvo']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    if len(X_train) == 0 or len(X_test) == 0:
        return {"error": "Não há dados suficientes nos conjuntos de treino/teste."}
    
    # 5. Treinar e Avaliar o Modelo
    modelo = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    modelo.fit(X_train, y_train)
    previsoes = modelo.predict(X_test)
    acuracia = accuracy_score(y_test, previsoes)
    
    # Retorna um dicionário com os resultados (formato JSON)
    return {
        "message": "Análise concluída com sucesso!",
        "model": "RandomForestClassifier",
        "accuracy": f"{acuracia:.2%}",
        "test_set_size": len(X_test)
    }

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API de Análise de Trading. Acesse /analyze para rodar a análise."}

@app.get("/analyze")
def analyze_trading_data():
    results = run_analysis()
    return results