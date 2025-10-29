# 🏗️ Arquitetura do Sistema - Gestão Financeira Igreja

> Documentação técnica da arquitetura e regras de negócio do sistema.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Regras de Negócio](#regras-de-negócio)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Componentes React](#componentes-react)
7. [Segurança e Autenticação](#segurança-e-autenticação)

---

## 🎯 Visão Geral

### Objetivo do Sistema
Gerenciar o fluxo de caixa completo de uma igreja, incluindo:
- Entradas (dízimos, ofertas)
- Saídas (despesas, contas a pagar)
- Controle de saldos separados
- Relatórios financeiros

### Público-alvo
- Tesoureiros da igreja
- Pastores
- Líderes financeiros
- Membros com acesso a relatórios

---

## 🛠️ Arquitetura Técnica

### Stack Tecnológica

```
┌─────────────────────────────────────┐
│         FRONTEND (React)            │
│  - Interface do usuário             │
│  - Validações                       │
│  - Formatação de dados              │
└─────────────────┬───────────────────┘
                  │
                  │ HTTP/HTTPS
                  │
┌─────────────────▼───────────────────┐
│       FIREBASE (Backend)            │
│  - Firestore Database               │
│  - Authentication                   │
│  - Cloud Functions (futuro)         │
│  - Hosting                          │
└─────────────────────────────────────┘
```

### Frontend (React + Vite)

**Tecnologias:**
- React 18+ (biblioteca de UI)
- Vite (build tool)
- React Router (navegação)
- Firebase SDK (comunicação com backend)

**Estrutura de Pastas:**

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Header.jsx       # Cabeçalho
│   │   ├── Button.jsx       # Botão customizado
│   │   ├── Card.jsx         # Card de informações
│   │   └── FormInput.jsx    # Input de formulário
│   │
│   ├── pages/               # Páginas da aplicação
│   │   ├── Home.jsx         # Dashboard principal
│   │   ├── Entradas.jsx     # Tela de entradas
│   │   ├── Despesas.jsx     # Tela de despesas
│   │   ├── Relatorios.jsx   # Tela de relatórios
│   │   └── Login.jsx        # Tela de login
│   │
│   ├── services/            # Serviços/APIs
│   │   ├── firebase.js      # Configuração Firebase
│   │   ├── entradas.js      # CRUD de entradas
│   │   ├── despesas.js      # CRUD de despesas
│   │   └── relatorios.js    # Geração de relatórios
│   │
│   ├── utils/               # Funções utilitárias
│   │   ├── calculos.js      # Cálculos financeiros
│   │   ├── formatacao.js    # Formatação de valores
│   │   └── validacao.js     # Validações
│   │
│   ├── App.jsx              # Componente raiz
│   └── main.jsx             # Entry point
│
└── public/                  # Arquivos estáticos
```

### Backend (Firebase)

**Serviços utilizados:**

1. **Firestore Database** - Banco de dados NoSQL em tempo real
2. **Authentication** - Sistema de login e autenticação
3. **Hosting** - Hospedagem do frontend
4. **Cloud Functions** (futuro) - Funções serverless para lógica complexa

---

## 📊 Regras de Negócio

### 1. Entradas (Receitas)

#### 1.1 Tipos de Entrada

| Tipo | Descrição | Rateio |
|------|-----------|--------|
| **Dízimo** | 10% da renda dos membros | 60% Central / 40% Local |
| **Oferta Comum** | Ofertas do culto | 60% Central / 40% Local |
| **Oferta Santa Ceia** | Oferta especial | 100% Missões |

#### 1.2 Formas de Recebimento

- **PIX / Transferência** → Conta bancária
- **Dinheiro** → Caixa físico da igreja

#### 1.3 Rateio Automático

**Para Dízimos e Ofertas Comuns:**

```javascript
// Exemplo de cálculo
const valorTotal = 1000.00;
const valorCentral = valorTotal * 0.60;  // R$ 600,00
const valorLocal = valorTotal * 0.40;    // R$ 400,00
```

**Para Oferta de Santa Ceia:**

```javascript
// 100% vai para Missões
const valorTotal = 500.00;
const valorMissoes = valorTotal;  // R$ 500,00
```

### 2. Saldos Separados

O sistema mantém **4 tipos de saldo**:

```javascript
{
  // 1. Saldo Local (40% de dízimos e ofertas comuns)
  saldoLocal: {
    total: 0,
    pix: 0,      // Quanto tem na conta bancária
    dinheiro: 0  // Quanto tem no caixa físico
  },
  
  // 2. Saldo Missões (100% ofertas Santa Ceia)
  saldoMissoes: {
    total: 0,
    pix: 0,
    dinheiro: 0
  },
  
  // 3. Saldo Central (60% de dízimos e ofertas comuns)
  // Apenas informativo - não é usado para pagar despesas locais
  saldoCentral: {
    total: 0,
    pix: 0,
    dinheiro: 0
  },
  
  // 4. Consolidado por forma de pagamento
  formasPagamento: {
    totalPix: 0,
    totalDinheiro: 0
  }
}
```

### 3. Saídas (Despesas)

#### 3.1 Tipos de Despesa

- **Despesas Fixas** - Ex: Aluguel, água, luz, internet
- **Despesas Variáveis** - Ex: Material de limpeza, manutenção
- **Despesas Parceladas** - Ex: Equipamento de som (6x)
- **Despesas de Missões** - Pagas com saldo de Missões

#### 3.2 Regras de Pagamento

```javascript
// Despesa Local - Pode pagar com Saldo Local
{
  tipo: "local",
  valor: 300.00,
  origem: "saldoLocal",
  formaPagamento: "pix"
}

// Despesa Missões - Pode pagar com Saldo Missões
{
  tipo: "missoes",
  valor: 200.00,
  origem: "saldoMissoes",
  formaPagamento: "dinheiro"
}
```

**IMPORTANTE:** Despesas locais NÃO podem usar saldo de Missões, e vice-versa!

#### 3.3 Contas a Pagar vs Contas Pagas

- **Conta a Pagar** - Lançada no sistema, mas ainda não paga (não abate saldo)
- **Conta Paga** - Efetivamente paga (abate do saldo)

```javascript
// Exemplo de fluxo:
// 1. Lançar conta a pagar
{
  descricao: "Conta de luz",
  valor: 150.00,
  vencimento: "2025-01-15",
  status: "pendente"  // NÃO abate saldo ainda
}

// 2. Marcar como paga
{
  ...,
  status: "paga",
  dataPagamento: "2025-01-15",
  formaPagamento: "pix"
  // AGORA abate do saldo
}
```

### 4. Parcelas

```javascript
// Exemplo: Compra de equipamento em 6x de R$ 500
{
  descricao: "Equipamento de som",
  valorTotal: 3000.00,
  numeroParcelas: 6,
  valorParcela: 500.00,
  parcelas: [
    { numero: 1, vencimento: "2025-01-10", status: "paga" },
    { numero: 2, vencimento: "2025-02-10", status: "paga" },
    { numero: 3, vencimento: "2025-03-10", status: "pendente" },
    { numero: 4, vencimento: "2025-04-10", status: "pendente" },
    { numero: 5, vencimento: "2025-05-10", status: "pendente" },
    { numero: 6, vencimento: "2025-06-10", status: "pendente" }
  ]
}
```

---

## 🗄️ Estrutura do Banco de Dados (Firestore)

### Collections (Coleções)

#### 1. `entradas`

```javascript
{
  id: "auto-gerado",
  tipo: "dizimo" | "oferta" | "santa_ceia",
  descricao: "Dízimos do culto",
  valor: 2000.00,
  data: Timestamp,
  formaRecebimento: "pix" | "dinheiro",
  
  // Rateio calculado automaticamente
  rateio: {
    central: 1200.00,    // 60%
    local: 800.00,       // 40%
    missoes: 0           // 0% (exceto Santa Ceia)
  },
  
  observacao: "Culto da noite",
  criadoPor: "userId",
  criadoEm: Timestamp
}
```

#### 2. `despesas`

```javascript
{
  id: "auto-gerado",
  descricao: "Conta de luz",
  valor: 150.00,
  categoria: "utilidades",
  tipo: "local" | "missoes",
  
  vencimento: Timestamp,
  status: "pendente" | "paga" | "vencida",
  
  // Se paga:
  dataPagamento: Timestamp,
  formaPagamento: "pix" | "dinheiro",
  origemSaldo: "local" | "missoes",
  
  // Se parcelado:
  parcelado: true,
  numeroParcela: 2,
  totalParcelas: 6,
  idPrincipal: "id-da-despesa-principal",
  
  observacao: "",
  criadoPor: "userId",
  criadoEm: Timestamp
}
```

#### 3. `saldos`

```javascript
{
  id: "unico",  // Apenas 1 documento
  
  local: {
    total: 5000.00,
    pix: 3000.00,
    dinheiro: 2000.00
  },
  
  missoes: {
    total: 1500.00,
    pix: 1000.00,
    dinheiro: 500.00
  },
  
  central: {
    total: 7500.00,  // Informativo
    pix: 5000.00,
    dinheiro: 2500.00
  },
  
  atualizadoEm: Timestamp
}
```

#### 4. `usuarios`

```javascript
{
  id: "userId",
  nome: "João Silva",
  email: "joao@igreja.com",
  role: "admin" | "tesoureiro" | "visualizador",
  ativo: true,
  criadoEm: Timestamp
}
```

### Índices do Firestore

Para melhor performance, criar índices para:

- `entradas`: `data` (DESC)
- `despesas`: `vencimento` (ASC), `status` (ASC)
- `despesas`: `status` (ASC), `tipo` (ASC)

---

## 🔄 Fluxo de Dados

### Fluxo de Entrada (Dízimo/Oferta)

```
1. Usuário preenche formulário
   ↓
2. Frontend valida dados
   ↓
3. Frontend calcula rateio (60/40)
   ↓
4. Frontend envia para Firestore
   ↓
5. Firestore salva na collection "entradas"
   ↓
6. Cloud Function (futuro) atualiza saldos
   ↓
7. Frontend atualiza UI em tempo real
```

### Fluxo de Pagamento de Despesa

```
1. Usuário marca despesa como "paga"
   ↓
2. Frontend verifica se tem saldo suficiente
   ↓
3. Se SIM: Frontend atualiza status da despesa
   ↓
4. Cloud Function (futuro) abate do saldo correspondente
   ↓
5. Frontend atualiza saldo na UI
   ↓
6. Se NÃO: Frontend mostra erro "Saldo insuficiente"
```

---

## 🧩 Componentes React

### Componentes Principais

```
App (raiz)
│
├── Header (cabeçalho fixo)
│   ├── Logo
│   ├── Menu
│   └── UserInfo
│
├── Router (navegação)
│   │
│   ├── HomePage (dashboard)
│   │   ├── ResumoSaldos
│   │   ├── GraficoEntradas
│   │   └── ProximasContas
│   │
│   ├── EntradasPage
│   │   ├── FormEntrada
│   │   └── ListaEntradas
│   │
│   ├── DespesasPage
│   │   ├── FormDespesa
│   │   └── ListaDespesas
│   │
│   └── RelatoriosPage
│       ├── FiltroRelatorio
│       ├── TabelaRelatorio
│       └── BotaoExportar
│
└── Footer
```

### Componentes Reutilizáveis

```javascript
// Button.jsx
<Button variant="primary" onClick={handleClick}>
  Salvar
</Button>

// Card.jsx
<Card title="Saldo Local">
  <p>R$ 5.000,00</p>
</Card>

// FormInput.jsx
<FormInput 
  label="Valor" 
  type="currency" 
  value={valor}
  onChange={setValor}
/>

// Table.jsx
<Table 
  columns={colunas}
  data={dados}
  onRowClick={handleRowClick}
/>
```

---

## 🔐 Segurança e Autenticação

### Níveis de Acesso

| Papel | Permissões |
|-------|------------|
| **Admin** | Acesso total (CRUD completo) |
| **Tesoureiro** | Pode lançar entradas e despesas, ver relatórios |
| **Visualizador** | Apenas visualizar relatórios |

### Regras do Firestore (Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar se está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função para verificar se é admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Entradas: apenas autenticados podem ler, apenas admin/tesoureiro podem escrever
    match /entradas/{entradaId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Despesas: mesmas regras
    match /despesas/{despesaId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Saldos: todos podem ler, mas não podem escrever diretamente
    match /saldos/{saldoId} {
      allow read: if isAuthenticated();
      allow write: if false;  // Só Cloud Functions podem escrever
    }
    
    // Usuários: apenas admin pode gerenciar
    match /usuarios/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

### Autenticação

```javascript
// Exemplo de login
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

async function login(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    // Redirecionar para dashboard
  } catch (error) {
    console.error("Erro no login:", error);
  }
}
```

---

## 📱 Responsividade

### Mobile First

O design é pensado **mobile-first**, ou seja, primeiro otimizado para celular:

```css
/* Mobile (padrão) */
.container {
  padding: 15px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 40px;
  }
}
```

### Breakpoints

| Dispositivo | Largura | Layout |
|-------------|---------|--------|
| Mobile | < 768px | 1 coluna |
| Tablet | 768px - 1024px | 2 colunas |
| Desktop | > 1024px | 3+ colunas |

---

## 🚀 Otimizações Futuras

### Cloud Functions

Criar funções serverless para:

1. **Atualizar saldos automaticamente** quando entrada/despesa é criada
2. **Enviar notificações** de contas próximas do vencimento
3. **Gerar relatórios** automaticamente no fim do mês
4. **Backup automático** dos dados

### PWA (Progressive Web App)

Transformar em PWA para:
- Funcionar offline
- Ser instalável no celular
- Receber notificações push

### Exportação de Relatórios

- PDF com logo da igreja
- Excel para análises
- Envio automático por e-mail

---

## 📊 Exemplo de Fluxo Completo

### Cenário: Culto de Domingo

**1. Entrada de Dízimos:**
```javascript
// Usuário lança: R$ 2.000,00 em dízimos via PIX
{
  tipo: "dizimo",
  valor: 2000.00,
  formaRecebimento: "pix",
  rateio: {
    central: 1200.00,  // 60%
    local: 800.00,     // 40%
    missoes: 0
  }
}

// Saldos atualizados:
saldoCentral.pix += 1200.00
saldoLocal.pix += 800.00
```

**2. Entrada de Oferta Comum:**
```javascript
// Usuário lança: R$ 500,00 em ofertas em dinheiro
{
  tipo: "oferta",
  valor: 500.00,
  formaRecebimento: "dinheiro",
  rateio: {
    central: 300.00,   // 60%
    local: 200.00,     // 40%
    missoes: 0
  }
}

// Saldos atualizados:
saldoCentral.dinheiro += 300.00
saldoLocal.dinheiro += 200.00
```

**3. Oferta de Santa Ceia:**
```javascript
// Primeiro domingo do mês: R$ 800,00 em dinheiro
{
  tipo: "santa_ceia",
  valor: 800.00,
  formaRecebimento: "dinheiro",
  rateio: {
    central: 0,
    local: 0,
    missoes: 800.00  // 100%
  }
}

// Saldos atualizados:
saldoMissoes.dinheiro += 800.00
```

**4. Pagamento de Conta de Luz:**
```javascript
// Tesoureiro paga conta de luz: R$ 150,00 via PIX
{
  descricao: "Conta de luz",
  valor: 150.00,
  tipo: "local",
  status: "paga",
  formaPagamento: "pix",
  origemSaldo: "local"
}

// Saldo atualizado:
saldoLocal.pix -= 150.00
```

**Resultado Final do Dia:**
```javascript
{
  saldoLocal: {
    total: 1050.00,
    pix: 650.00,    // 800 - 150
    dinheiro: 200.00
  },
  saldoMissoes: {
    total: 800.00,
    pix: 0,
    dinheiro: 800.00
  },
  saldoCentral: {
    total: 1500.00,
    pix: 1200.00,
    dinheiro: 300.00
  }
}
```

---

## 📚 Recursos Adicionais

### Diagramas

Para visualizar melhor a arquitetura, você pode usar ferramentas como:
- [Excalidraw](https://excalidraw.com/) - Diagramas simples
- [Draw.io](https://app.diagrams.net/) - Diagramas profissionais
- [Figma](https://figma.com/) - Design de interfaces

### Documentação Oficial

- [React](https://react.dev/)
- [Firebase](https://firebase.google.com/docs)
- [Vite](https://vitejs.dev/)

---

**Última atualização:** 29/10/2025  
**Versão:** 1.0.0

---

**Dúvidas sobre a arquitetura?** Abra uma issue no GitHub! 💬