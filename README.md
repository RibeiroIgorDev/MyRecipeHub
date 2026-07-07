# MyRecipeHub - Arquitetura de Microsserviços

```text
myrecipehub/
├── auth-service/
│   ├── package.json
│   └── src/
│       ├── routes/
│       ├── models/
│       └── config/
├── resource-service/
│   ├── package.json
│   └── src/
│       ├── routes/
│       ├── models/
│       └── config/
├── notification-service/
│   ├── package.json
│   └── src/
│       ├── routes/
│       ├── models/
│       └── config/
├── frontend/
└── README.md
```

## Como executar

### 1. Auth service
```bash
cd myrecipehub/auth-service
npm install
npm start
```

### 2. Resource service
```bash
cd myrecipehub/resource-service
npm install
npm start
```

### 3. Notification service
```bash
cd myrecipehub/notification-service
npm install
npm start
```

### 4. Frontend
```bash
cd myrecipehub/frontend
npm install
npm start
```

### Build otimizado (estáticos comprimidos)
```bash
cd myrecipehub/frontend
npm run build
```

O build gera arquivos comprimidos `.gz` e `.br` dentro de `frontend/build` para entrega otimizada em produção (quando o servidor/CDN suporta precompressed assets).

## Credenciais de teste
- Usuário: admin
- Senha: admin123

- Usuário: demo
- Senha: demo123

## Eventos e fila de mensagens
- O resource-service publica eventos de CRUD no notification-service ao final da operação.
- O auth-service publica eventos de autenticação (login/logout) no notification-service.
- Endpoint de enfileiramento: POST /events/queue
- Endpoint de status da fila: GET /events/queue