import streamlit as st
import pandas as pd
import joblib

st.set_page_config(layout="wide")
st.title("🤖 AI Trading Analyzer")

# Carregar modelo treinado
def load_model():
    return joblib.load("modelo_treinado.joblib")

# Função para calcular features e obter previsão
def get_latest_prediction():
    df = pd.read_csv("WINFUT_M5.csv")
    # Limpeza básica: remover NaN e duplicatas
    df = df.drop_duplicates().dropna()
    # Calcular Retorno Diário
    df["RetornoDiario"] = df["Close"].pct_change()
    # Calcular Média Móvel Simples de 20 períodos
    df["MMS_20"] = df["Close"].rolling(window=20).mean()
    # Calcular RSI (Relative Strength Index)
    def calc_rsi(series, period=14):
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    df["RSI"] = calc_rsi(df["Close"])
    # Remover linhas com NaN nas features
    df = df.dropna(subset=["RetornoDiario", "MMS_20", "RSI"]) 
    # Selecionar última linha com features
    last_row = df.iloc[[-1]]
    features = last_row[["RetornoDiario", "MMS_20", "RSI"]]
    modelo = load_model()
    pred = modelo.predict(features)[0]
    last_date = last_row["Date"].values[0] if "Date" in last_row else last_row.index[0]
    return pred, last_date, df

# Obter previsão e exibir resultado
pred, last_date, df = get_latest_prediction()
if pred == 1:
    st.metric(label=f"Previsão para o próximo candle ({last_date})", value="ALTA 📈", delta=None)
else:
    st.metric(label=f"Previsão para o próximo candle ({last_date})", value="BAIXA 📉", delta=None)

st.subheader("Últimos 10 dados utilizados:")
st.dataframe(df.tail(10), use_container_width=True)
