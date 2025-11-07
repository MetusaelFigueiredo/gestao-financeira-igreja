# Sistema de Gestão Financeira para Igreja

## Visão Geral
Sistema web para controle financeiro de igreja com dashboard, entradas, despesas, reconciliação PIX/Dinheiro e relatórios.

## Stack Tecnológica
- Frontend: React + Vite + Firebase
- Backend: Firebase (Firestore, Auth, Functions)
- Deploy: Firebase Hosting

## Estrutura Principal

### Frontend (/frontend/src/)
```
pages/
├── Dashboard.jsx - Dashboard principal com cards resumo
├── Entradas.jsx - Controle de entradas (dízimos/ofertas)
├── Despesas.jsx - Controle de despesas
├── Reconciliacao.jsx - Reconciliação PIX vs Dinheiro (60% Central / 40% Local)
├── Relatorios.jsx - Relatórios e exportações
├── Membros.jsx - Cadastro de membros
└── Login.jsx - Autenticação

components/
├── CardSaldoMes.jsx - Cards: Saldo atual, Composição, Entrada total do mês
├── CardResumoFinanceiro.jsx - Cards: Central (PIX/Dinheiro), Local (PIX/Dinheiro)
├── ReconciliacaoFinanceira.jsx - Widget reconciliação PIX vs Dinheiro
├── DespesasPendentes.jsx - Lista despesas pendentes do mês
├── MetaMissoes.jsx - Progresso metas de missões
├── FormDespesa.jsx - Formulário despesas
├── FormEntrada.jsx - Formulário entradas
├── FormMembro.jsx - Formulário membros
└── UploadComprovante.jsx - Upload de comprovantes

services/
├── firebase.js - Configuração Firebase
├── auth.js - Autenticação
├── dashboard.js - Dados dashboard
├── entradas.js - CRUD entradas
├── despesas.js - CRUD despesas
├── membros.js - CRUD membros
└── relatorios.js - Geração relatórios
```

## Lógica de Negócio

### Reconciliação PIX vs Dinheiro
- **Central deve devolver**: 40% do PIX recebido (dízimos/ofertas)
- **Local deve repassar**: 60% do dinheiro recebido (dízimos/ofertas)
- **Resultado**: Diferença entre PIX recebido e dinheiro a repassar

### Estrutura de Dados (Firestore)
```javascript
// Entradas
{
  tipo: 'dizimo' | 'oferta' | 'campanha',
  valor: number,
  formaPagamento: 'pix' | 'dinheiro',
  data: timestamp,
  membro: string,
  observacoes: string
}

// Despesas
{
  categoria: string,
  valor: number,
  data: timestamp,
  descricao: string,
  status: 'pago' | 'pendente',
  comprovante?: string
}
```

### Cards do Dashboard
1. **CardSaldoMes**: Saldo atual, composição (PIX/Dinheiro), entrada total do mês
2. **CardResumoFinanceiro**: Central (PIX/Dinheiro breakdown), Local (PIX/Dinheiro breakdown)
3. **ReconciliacaoFinanceira**: Cálculo reconciliação PIX vs Dinheiro
4. **DespesasPendentes**: Despesas pendentes do mês inteiro
5. **MetaMissoes**: Progresso metas de missões

## Terminologia Religiosa
- Usar "ofertas e dízimos" em vez de "receitas"
- "Resumo do mês" em vez de "performance"
- Linguagem apropriada para contexto religioso
- Evitar termos corporativos

## Características Técnicas
- Responsivo (mobile-first)
- PWA (Progressive Web App)
- Autenticação Firebase
- Deploy automatizado (deploy.bat/deploy.ps1)
- Backup e exportação de dados
- Upload de comprovantes
- OCR para leitura automática

## Estado Atual
- Dashboard funcional com todos os componentes
- Reconciliação PIX/Dinheiro implementada corretamente
- Cards otimizados sem redundâncias
- Terminologia religiosa adequada
- Estrutura limpa e organizada

## Comandos Principais
```bash
# Desenvolvimento
cd frontend && npm run dev

# Deploy
.\deploy.bat  # ou .\deploy.ps1

# Build
cd frontend && npm run build
```

## Observações Importantes
- Reconciliação funciona apenas para dízimos/ofertas (não campanhas)
- Rateio: 60% Central, 40% Local
- PIX vai majoritariamente para Central
- Dinheiro fica majoritariamente no Local
- Sistema otimizado para igreja local