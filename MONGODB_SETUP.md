# Guia de Instalação - MongoDB para MyRecipeHub

## Opção 1: MongoDB Local (Windows)

### Passo 1: Instalar MongoDB Community Edition
1. Visite: https://www.mongodb.com/try/download/community
2. Selecione "Windows" e versão "msi"
3. Execute o instalador e siga as instruções padrão

### Passo 2: Iniciar MongoDB
```powershell
# Por padrão, o MongoDB inicia automaticamente como serviço
# Verificar se está rodando:
Get-Service MongoDB
```

## Opção 2: MongoDB Atlas (Nuvem) - Recomendado para Produção

### Passo 1: Criar Conta
1. Visite: https://www.mongodb.com/cloud/atlas
2. Crie uma conta gratuita
3. Crie um projeto e cluster

### Passo 2: Copiar Connection String
1. No Atlas, clique em "Connect"
2. Selecione "Drivers"
3. Copie a connection string

### Passo 3: Atualizar .env
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
MONGO_DB=myrecipehub
```

## Verificar Conexão

```powershell
# No seu projeto, inicie os serviços:
cd auth-service
npm start

# Você deve ver:
# [auth] connected to MongoDB
```

## Problemas Comuns

### "connect ECONNREFUSED"
- MongoDB não está rodando
- Solução: Inicie o serviço MongoDB ou use MongoDB Atlas

### "Unauthorized: authentication failed"
- Credenciais incorretas no MONGO_URI
- Solução: Verifique usuário/senha no MongoDB Atlas

### "Database not initialized"
- connectDB não foi chamado antes de usar getDB
- Solução: Verifique se os serviços iniciaram corretamente
