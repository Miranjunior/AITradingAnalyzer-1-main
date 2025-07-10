# cole este código no seu novo arquivo api.py
from fastapi import FastAPI
import pandas as pd
import joblib

# Inicia a aplicação FastAPI
app = FastAPI()

# Carrega o modelo treinado uma vez ao iniciar a aplicação
try:
    modelo = joblib.load('modelo_treinado.joblib')
except Exception as e:
    modelo = None
    print(f"Erro ao carregar modelo: {e}")

def carregar_e_preparar_ultima_linha():
    """
    Carrega o CSV, calcula as features e retorna a última linha pronta para previsão.
    """
    try:
        df = pd.read_csv('WINFUT_M5.csv', sep='\t')
        df.rename(columns={'<DATE>': 'Data', '<TIME>': 'Hora', '<OPEN>': 'Abertura',
                           '<HIGH>': 'Maxima', '<LOW>': 'Minima', '<CLOSE>': 'Fechamento',
                           '<TICKVOL>': 'Tickvol', '<VOL>': 'Volume', '<SPREAD>': 'Spread'}, inplace=True)
        df['Data'] = pd.to_datetime(df['Data'] + ' ' + df['Hora'])
        df.set_index('Data', inplace=True)
        df.drop(columns=['Hora', 'Tickvol', 'Spread'], inplace=True)
    except FileNotFoundError:
        return None, "Arquivo WINFUT_M5.csv não encontrado."
    except Exception as e:
        return None, f"Erro ao carregar dados: {e}"

    df['RetornoDiario'] = df['Fechamento'].pct_change()
    df['MMS_20'] = df['Fechamento'].rolling(window=20).mean()
    delta = df['Fechamento'].diff()
    ganho = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    perda = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = ganho / perda
    df['RSI'] = 100 - (100 / (1 + rs))
    df.dropna(inplace=True)

    if df.empty:
        return None, "Não há dados suficientes para previsão."

    features = ['Abertura', 'Maxima', 'Minima', 'Fechamento', 'Volume', 'RetornoDiario', 'MMS_20', 'RSI']
    ultima_linha = df[features].iloc[[-1]]
    return ultima_linha, None

@app.get("/")
def read_root():
    return {"message": "API pronta para previsão. Use /analyze para obter a previsão do modelo."}

@app.get("/analyze")
def analyze():
    if modelo is None:
        return {"error": "Modelo não carregado. Treine e salve o modelo primeiro."}
    ultima_linha, erro = carregar_e_preparar_ultima_linha()
    if erro:
        return {"error": erro}
    pred = modelo.predict(ultima_linha)[0]
    resultado = "Alta" if pred == 1 else "Baixa"
    return {"previsao": resultado}