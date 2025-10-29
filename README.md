# 🏦 Sistema de Gestão Financeira - Igreja

> Sistema completo para controle de fluxo de caixa de igrejas, com controle de dízimos, ofertas, despesas e relatórios.

## 📋 Sobre o Projeto

Este sistema foi desenvolvido para facilitar a gestão financeira de igrejas, permitindo o controle transparente de:

- 💰 **Dízimos e Ofertas** - Com rateio automático 60/40 (Central/Local)
- 🍞 **Ofertas de Santa Ceia** - 100% destinado a Missões
- 📊 **Saldos Separados** - Local, Central e Missões
- 💳 **Formas de Pagamento** - PIX e Dinheiro (caixa físico)
- 📤 **Despesas e Contas a Pagar** - Controle completo de saídas
- 📈 **Relatórios** - Visão completa das finanças

---

## ✨ Funcionalidades

### ✅ Implementado
- Estrutura inicial do projeto
- Configuração do ambiente de desenvolvimento

### 🚧 Em Desenvolvimento
- [ ] Sistema de Entradas (Dízimos, Ofertas, Santa Ceia)
- [ ] Rateio Automático 60/40
- [ ] Controle de Saldos Separados
- [ ] Sistema de Despesas
- [ ] Dashboard e Relatórios
- [ ] Sistema de Autenticação

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | O que faz | Por que usar |
|------------|-----------|--------------|
| **React** | Biblioteca para criar interfaces | Moderna, rápida e muito usada |
| **Vite** | Ferramenta de build | Super rápido para desenvolvimento |
| **Firebase** | Backend completo do Google | Gratuito, banco de dados em tempo real |
| **Vercel** | Hospedagem | Deploy automático e gratuito |

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- ✅ **Node.js** (versão 18 ou superior) - [Download aqui](https://nodejs.org/)
- ✅ **Git** - [Download aqui](https://git-scm.com/)
- ✅ **Conta Google** (para o Firebase)
- ✅ **Editor de Código** - Recomendo o [VS Code](https://code.visualstudio.com/)

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/MetusaelFigueiredo/gestao-financeira-igreja.git
cd gestao-financeira-igreja
```

### 2️⃣ Entre na pasta do frontend

```bash
cd frontend
```

### 3️⃣ Instale as dependências

```bash
npm install
```

### 4️⃣ Configure o Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative o **Firestore Database**
4. Ative o **Authentication** (Email/Password)
5. Copie as credenciais do Firebase

### 5️⃣ Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Abra o arquivo .env e preencha com suas credenciais do Firebase
```

### 6️⃣ Rode o projeto

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## 📁 Estrutura do Projeto

```
gestao-financeira-igreja/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Integração com Firebase
│   │   ├── utils/           # Funções auxiliares
│   │   ├── App.jsx          # Componente principal
│   │   └── main.jsx         # Ponto de entrada
│   ├── public/              # Arquivos públicos
│   ├── index.html           # HTML principal
│   ├── package.json         # Dependências
│   └── vite.config.js       # Configuração do Vite
├── docs/                     # Documentação
│   ├── GUIA_INICIANTE.md    # Guia para iniciantes
│   └── ARQUITETURA.md       # Arquitetura do sistema
└── README.md                 # Este arquivo
```

---

## 📚 Documentação

- 📖 [Guia do Iniciante](docs/GUIA_INICIANTE.md) - Para quem está começando
- 🏗️ [Arquitetura do Sistema](docs/ARQUITETURA.md) - Detalhes técnicos

---

## 🗺️ Roadmap

### Fase 1 - Estrutura Base ✅
- [x] Configuração inicial do projeto
- [x] Documentação básica

### Fase 2 - Sistema de Entradas 🚧
- [ ] Formulário de entrada de dízimos
- [ ] Formulário de entrada de ofertas
- [ ] Formulário de oferta de Santa Ceia
- [ ] Rateio automático 60/40
- [ ] Seleção de forma de pagamento (PIX/Dinheiro)

### Fase 3 - Controle de Saldos
- [ ] Visualização de saldo Local
- [ ] Visualização de saldo Missões
- [ ] Visualização de saldo Central (informativo)
- [ ] Separação por forma de pagamento

### Fase 4 - Sistema de Despesas
- [ ] Cadastro de despesas
- [ ] Lançamento de contas a pagar
- [ ] Controle de parcelas
- [ ] Pagamento de contas

### Fase 5 - Relatórios e Dashboard
- [ ] Dashboard principal
- [ ] Relatório mensal
- [ ] Gráficos de entrada/saída
- [ ] Exportação para PDF/Excel

### Fase 6 - Autenticação
- [ ] Sistema de login
- [ ] Diferentes níveis de acesso
- [ ] Registro de ações (auditoria)

---

## 💡 Dicas para Iniciantes

1. **Comece pelo básico** - Rode o projeto primeiro, depois entenda o código
2. **Leia a documentação** - Está tudo explicado no `docs/GUIA_INICIANTE.md`
3. **Faça pequenas mudanças** - Teste uma coisa de cada vez
4. **Use o Git** - Faça commits frequentes
5. **Peça ajuda** - A comunidade está aqui para isso!

---

## 🆘 Problemas Comuns

### Erro: "npm não é reconhecido"
**Solução:** Instale o Node.js novamente e reinicie o terminal

### Erro: "Cannot find module"
**Solução:** Rode `npm install` novamente

### Erro ao conectar com Firebase
**Solução:** Verifique se o arquivo `.env` está configurado corretamente

---

## 🤝 Como Contribuir

1. Faça um Fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona nova feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

---

## 📞 Contato

**Desenvolvedor:** Metusael Figueiredo  
**GitHub:** [@MetusaelFigueiredo](https://github.com/MetusaelFigueiredo)

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar e modificar!

---

**Feito com ❤️ para a Igreja**
