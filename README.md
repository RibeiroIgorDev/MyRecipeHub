# MyRecipeHub - Projeto 1: Programação Web Fullstack

## Descrição do Projeto

**MyRecipeHub** é uma aplicação web SPA (Single Page Application) desenvolvida em React.js que permite aos usuários buscar e visualizar receitas detalhadas a partir de uma API JSON externa. O projeto demonstra competências em desenvolvimento de frontend com React, consumo de APIs REST, gerenciamento de estado com Context API e implementação de hooks avançados.

## Requisitos Atendidos

### ✅ Arquitetura e Estrutura

- **SPA (Single Page Application)**: Aplicação desenvolvida em uma única página sem redirecionamentos
- **Gerenciador de Projeto**: Create React App (CRA)
- **Estrutura de Pastas**:
  - `src/components/` - Componentes React em JSX
  - `src/contexts/` - Context API para gerenciamento de estado

### ✅ API JSON

- **API Utilizada**: [RecipeAPI](https://recipeapi.io/)
- **Autenticação**: Bearer Token (sk_live_...)
- **Endpoints Implementados**:
  - `GET /api/v1/recipes?search=...&page=...&per_page=...` - Busca receitas
  - `GET /api/v1/recipes/{id}` - Detalhe da receita

### ✅ Hook React Selecionado: useReducer

Implementado em `src/contexts/RecipeContext.js`:
- **Motivo**: Excelente para gerenciar múltiplos estados relacionados (recipes, loading, error, page, searchTerm, etc.)
- **Benefícios**: Lógica centralizada, fácil testabilidade, escalabilidade
- **Ações Implementadas**:
  - `SET_LOADING` - Estado de carregamento
  - `SET_RECIPES` - Lista de receitas
  - `SET_ERROR` - Mensagens de erro
  - `SET_VALIDATION_ERROR` - Erros de validação
  - `SET_SELECTED_RECIPE` - Receita selecionada para visualização de detalhes
  - `SET_SEARCH_TERM` - Termo de busca
  - `SET_PAGE` / `SET_PAGINATION` - Paginação

### ✅ Biblioteca Externa: styled-components

- **Instalado via**: `npm install styled-components`
- **Benefícios**: CSS-in-JS, componentização de estilos, sem conflitos de nomenclatura
- **Arquivos**:
  - `src/components/SearchBar.styles.js`
  - `src/components/RecipeCard.styles.js`
  - `src/components/RecipeDetails.styles.js`
  - `src/components/App.styles.js`

### ✅ Validação de Campos Obrigatórios

- **Campo de Busca**: Validação de campo obrigatório
- **Mensagem de Erro**: Exibição clara de erros de validação antes do envio
- **Prevenção**: Submit desabilitado enquanto campo vazio

### ✅ Tratamento de Erros

- **Validação Anterior ao Envio**: Verificação de campo vazio
- **Tratamento de Erros da API**: Captura e exibição de mensagens de erro
- **Feedback ao Usuário**:
  - Mensagens de erro em componente visual destacado
  - Estados de carregamento
  - Status de resultados encontrados

### ✅ Comunicação Entre Componentes

- **Context API**: Implementada em `RecipeContext.js`
- **Provider Pattern**: `RecipeProvider` envolve a aplicação
- **Hook Customizado**: `useRecipes()` para acesso ao contexto
- **Componentes Comunicados**:
  - `SearchBar` → emite ações de busca
  - `RecipeCard` → dispara carregamento de detalhes
  - `RecipeDetails` → exibe dados do contexto

### ✅ Busca com Parâmetros

- **Parâmetros Implementados**:
  - `search` - Termo de busca (obrigatório)
  - `page` - Número da página
  - `per_page` - Itens por página (12)
- **Paginação**: Navegação entre páginas de resultados

### ✅ Geração de Deployment

- **Build Production**: Comando `npm run build`
- **Pasta Deploy**: `build/` pronta para deploy em servidor web
- **Otimizações**:
  - Minificação de JS/CSS
  - Code splitting
  - Tree shaking

## Estrutura de Pastas

```
src/
├── components/
│   ├── App.js               # Componente principal (SPA)
│   ├── App.styles.js        # Estilos do App (styled-components)
│   ├── SearchBar.js         # Campo de busca com validação
│   ├── SearchBar.styles.js
│   ├── RecipeCard.js        # Card de receita (lista)
│   ├── RecipeCard.styles.js
│   ├── RecipeDetails.js     # Modal de detalhes da receita
│   └── RecipeDetails.styles.js
├── contexts/
│   └── RecipeContext.js     # Context API com useReducer
├── index.js                 # Ponto de entrada
├── index.css                # Estilos globais
└── App.test.js              # Testes
```

## Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 19.2.6 | Framework principal |
| styled-components | ^6.0 | Estilização CSS-in-JS |
| React Hooks | Built-in | useReducer, useContext, useEffect, useCallback |
| Context API | Built-in | Gerenciamento de estado global |
| JavaScript | ES6+ | Linguagem base |

## Funcionalidades Principais

### 1. Busca de Receitas
- Campo de entrada com validação
- Mensagem de erro se campo vazio
- Busca por termo (pratos, ingredientes, estilos)

### 2. Listagem de Receitas
- Grid responsivo (3 colunas → 2 → 1)
- Cartões com imagem, nome e metadados
- Paginação com navegação

### 3. Detalhes da Receita
- Modal com informações completas
- Ingredientes em lista
- Instruções passo-a-passo
- Informações nutricionais
- Metadados (culinária, dieta, tipo de refeição, tempos)

### 4. Estados da Aplicação
- Carregamento com feedback visual
- Tratamento de erros da API
- Estado vazio quando nenhum resultado

## Como Executar

### Desenvolvimento

```bash
cd myrecipehub
npm install
npm start
```

A aplicação abrirá em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

Gera pasta `build/` otimizada para deploy

### Deploying

```bash
npm install -g serve
serve -s build
```

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
REACT_APP_RECIPE_API_KEY=sua_chave_aqui
```

## Padrões de Desenvolvimento

- **Componentes Funcionais**: Uso exclusivo de hooks
- **Separação de Responsabilidades**: Lógica em contexto, UI em componentes
- **Props Drilling Evitado**: Context API centraliza estado
- **Reutilização**: Componentes genéricos e reutilizáveis
- **Responsive**: Mobile-first com media queries

## Notas de Implementação

1. **useReducer vs useState**: Escolhido para gerenciar múltiplos estados relacionados de forma previsível e centralizada
2. **styled-components**: Proporciona estilos encapsulados e dinâmicos sem conflitos CSS
3. **RecipeAPI Free Plan**: Limitado a 10 resultados por página e 500 requests/mês
4. **Responsividade**: Implementada com grid CSS e media queries
5. **Acessibilidade**: Uso de atributos aria e labels semânticos