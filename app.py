import streamlit as st
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

# Configuração da página
st.set_page_config(
    page_title="🤖 AI Trading Analyzer",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Título principal
st.title("🤖 AI Trading Analyzer")
st.markdown("### Análise Inteligente de Trading com Machine Learning")

# Função para carregar e processar dados
@st.cache_data
def load_and_process_data():
    """Carrega e processa os dados do CSV"""
    try:
        # Carregar dados
        df = pd.read_csv('WINFUT_M5.csv', sep='\t')
        
        # Renomear colunas
        df.rename(columns={
            '<DATE>': 'Data', '<TIME>': 'Hora', '<OPEN>': 'Abertura',
            '<HIGH>': 'Maxima', '<LOW>': 'Minima', '<CLOSE>': 'Fechamento',
            '<TICKVOL>': 'Tickvol', '<VOL>': 'Volume', '<SPREAD>': 'Spread'
        }, inplace=True)
        
        # Criar datetime
        df['DateTime'] = pd.to_datetime(df['Data'] + ' ' + df['Hora'])
        df.set_index('DateTime', inplace=True)
        
        # Remover colunas não necessárias
        df.drop(columns=['Data', 'Hora', 'Tickvol', 'Spread'], inplace=True)
        
        # Calcular indicadores técnicos
        df['RetornoDiario'] = df['Fechamento'].pct_change()
        df['MMS_20'] = df['Fechamento'].rolling(window=20).mean()
        df['MMS_50'] = df['Fechamento'].rolling(window=50).mean()
        
        # RSI
        def calc_rsi(series, period=14):
            delta = series.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            return 100 - (100 / (1 + rs))
        
        df['RSI'] = calc_rsi(df['Fechamento'])
        
        # Bollinger Bands
        df['BB_Middle'] = df['Fechamento'].rolling(window=20).mean()
        bb_std = df['Fechamento'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
        
        # Remover NaN
        df.dropna(inplace=True)
        
        return df
    except Exception as e:
        st.error(f"Erro ao carregar dados: {e}")
        return None

# Função para treinar modelo
@st.cache_resource
def train_model(df):
    """Treina o modelo de machine learning"""
    try:
        # Criar target (se próximo candle será alta ou baixa)
        df['Target'] = (df['Fechamento'].shift(-1) > df['Fechamento']).astype(int)
        df.dropna(inplace=True)
        
        # Features para o modelo
        features = ['Abertura', 'Maxima', 'Minima', 'Fechamento', 'Volume', 
                   'RetornoDiario', 'MMS_20', 'RSI']
        
        X = df[features]
        y = df['Target']
        
        # Split dos dados
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )
        
        # Treinar modelo
        model = RandomForestClassifier(
            n_estimators=100, 
            random_state=42, 
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        
        # Calcular acurácia
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        return model, accuracy, features
    except Exception as e:
        st.error(f"Erro ao treinar modelo: {e}")
        return None, 0, []

# Função para fazer previsão
def make_prediction(model, df, features):
    """Faz previsão para o próximo candle"""
    try:
        # Pegar última linha
        last_row = df[features].iloc[[-1]]
        
        # Fazer previsão
        prediction = model.predict(last_row)[0]
        probability = model.predict_proba(last_row)[0]
        
        return prediction, probability
    except Exception as e:
        st.error(f"Erro ao fazer previsão: {e}")
        return None, None

# Sidebar
st.sidebar.header("🎛️ Controles")

# Carregar dados
with st.spinner("Carregando dados..."):
    df = load_and_process_data()

if df is not None:
    st.success(f"✅ Dados carregados: {len(df)} registros")
    
    # Treinar modelo
    with st.spinner("Treinando modelo de IA..."):
        model, accuracy, features = train_model(df)
    
    if model is not None:
        st.success(f"✅ Modelo treinado com {accuracy:.2%} de acurácia")
        
        # Fazer previsão
        prediction, probability = make_prediction(model, df, features)
        
        if prediction is not None:
            # Exibir previsão
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if prediction == 1:
                    st.metric(
                        "🎯 Previsão Próximo Candle",
                        "📈 ALTA",
                        f"{probability[1]:.1%} confiança"
                    )
                else:
                    st.metric(
                        "🎯 Previsão Próximo Candle", 
                        "📉 BAIXA",
                        f"{probability[0]:.1%} confiança"
                    )
            
            with col2:
                st.metric(
                    "📊 Acurácia do Modelo",
                    f"{accuracy:.2%}",
                    "Dados históricos"
                )
            
            with col3:
                último_preço = df['Fechamento'].iloc[-1]
                st.metric(
                    "💰 Último Preço",
                    f"{último_preço:,.0f}",
                    f"{df['RetornoDiario'].iloc[-1]:.2%}"
                )
            
            # Gráficos
            st.markdown("---")
            
            # Gráfico de preços
            st.subheader("📈 Gráfico de Preços")
            
            # Pegar últimos 100 dados para o gráfico
            df_plot = df.tail(100)
            
            fig = go.Figure()
            
            # Candlestick
            fig.add_trace(go.Candlestick(
                x=df_plot.index,
                open=df_plot['Abertura'],
                high=df_plot['Maxima'],
                low=df_plot['Minima'],
                close=df_plot['Fechamento'],
                name='Preço'
            ))
            
            # Médias móveis
            fig.add_trace(go.Scatter(
                x=df_plot.index,
                y=df_plot['MMS_20'],
                mode='lines',
                name='Média 20',
                line=dict(color='orange', width=2)
            ))
            
            fig.add_trace(go.Scatter(
                x=df_plot.index,
                y=df_plot['MMS_50'],
                mode='lines',
                name='Média 50',
                line=dict(color='red', width=2)
            ))
            
            fig.update_layout(
                title="Gráfico de Preços com Médias Móveis",
                xaxis_title="Data/Hora",
                yaxis_title="Preço",
                height=500
            )
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Gráfico RSI
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("📊 RSI (Relative Strength Index)")
                fig_rsi = go.Figure()
                fig_rsi.add_trace(go.Scatter(
                    x=df_plot.index,
                    y=df_plot['RSI'],
                    mode='lines',
                    name='RSI',
                    line=dict(color='purple', width=2)
                ))
                fig_rsi.add_hline(y=70, line_dash="dash", line_color="red", annotation_text="Sobrecompra")
                fig_rsi.add_hline(y=30, line_dash="dash", line_color="green", annotation_text="Sobrevenda")
                fig_rsi.update_layout(height=300)
                st.plotly_chart(fig_rsi, use_container_width=True)
            
            with col2:
                st.subheader("📈 Volume")
                fig_vol = px.bar(
                    df_plot.reset_index(),
                    x='DateTime',
                    y='Volume',
                    title="Volume de Negociação"
                )
                fig_vol.update_layout(height=300)
                st.plotly_chart(fig_vol, use_container_width=True)
            
            # Tabela com dados recentes
            st.subheader("📋 Dados Recentes")
            
            # Selecionar colunas para exibir
            colunas_display = ['Abertura', 'Maxima', 'Minima', 'Fechamento', 'Volume', 'RSI']
            df_display = df[colunas_display].tail(10)
            
            # Formatação
            df_display = df_display.round(2)
            
            st.dataframe(df_display, use_container_width=True)
            
            # Informações do modelo
            st.sidebar.markdown("---")
            st.sidebar.subheader("🤖 Informações do Modelo")
            st.sidebar.write(f"**Tipo:** Random Forest")
            st.sidebar.write(f"**Acurácia:** {accuracy:.2%}")
            st.sidebar.write(f"**Features:** {len(features)}")
            st.sidebar.write(f"**Dados de treino:** {len(df)}")
            
            # Features importance
            if hasattr(model, 'feature_importances_'):
                st.sidebar.subheader("📊 Importância das Features")
                importance_df = pd.DataFrame({
                    'Feature': features,
                    'Importância': model.feature_importances_
                }).sort_values('Importância', ascending=False)
                
                for idx, row in importance_df.iterrows():
                    st.sidebar.write(f"**{row['Feature']}:** {row['Importância']:.3f}")
        
        else:
            st.error("❌ Erro ao fazer previsão")
    else:
        st.error("❌ Erro ao treinar modelo")
else:
    st.error("❌ Erro ao carregar dados")
    st.info("🔧 Verifique se o arquivo WINFUT_M5.csv está no diretório correto")

# Footer
st.markdown("---")
st.markdown("🤖 **AI Trading Analyzer** - Desenvolvido com Streamlit e Machine Learning")
