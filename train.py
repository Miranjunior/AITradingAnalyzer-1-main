import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

def run_analysis():
    """
    Carrega dados, treina modelo RandomForest e salva o modelo treinado em 'modelo_treinado.joblib'.
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
        print("Arquivo WINFUT_M5.csv não encontrado no repositório.")
        return

    df['RetornoDiario'] = df['Fechamento'].pct_change()
    df['MMS_20'] = df['Fechamento'].rolling(window=20).mean()
    delta = df['Fechamento'].diff()
    ganho = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    perda = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = ganho / perda
    df['RSI'] = 100 - (100 / (1 + rs))
    df.dropna(inplace=True)
    df['Alvo'] = (df['Fechamento'].shift(-1) > df['Fechamento']).astype(int)
    df.dropna(inplace=True)

    if df.empty:
        print("Não há dados suficientes para treinar o modelo após a limpeza.")
        return

    features = ['Abertura', 'Maxima', 'Minima', 'Fechamento', 'Volume', 'RetornoDiario', 'MMS_20', 'RSI']
    X = df[features]
    y = df['Alvo']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    if len(X_train) == 0 or len(X_test) == 0:
        print("Não há dados suficientes nos conjuntos de treino/teste.")
        return

    modelo = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    modelo.fit(X_train, y_train)
    joblib.dump(modelo, 'modelo_treinado.joblib')
    print("Modelo treinado e salvo como 'modelo_treinado.joblib'.")

if __name__ == "__main__":
    run_analysis()
