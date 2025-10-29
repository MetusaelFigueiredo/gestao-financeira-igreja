# 📚 Guia do Iniciante - Sistema de Gestão Financeira

> Este guia foi criado especialmente para quem está começando na programação. Vamos te ajudar passo a passo! 🚀

---

## 📖 Índice

1. [O que é cada tecnologia](#o-que-é-cada-tecnologia)
2. [Instalando as ferramentas necessárias](#instalando-as-ferramentas-necessárias)
3. [Clonando o projeto](#clonando-o-projeto)
4. [Instalando dependências](#instalando-dependências)
5. [Configurando o Firebase](#configurando-o-firebase)
6. [Rodando o projeto](#rodando-o-projeto)
7. [Glossário de termos técnicos](#glossário-de-termos-técnicos)
8. [Problemas comuns e soluções](#problemas-comuns-e-soluções)

---

## 🧩 O que é cada tecnologia?

### React
**O que é?** Uma biblioteca JavaScript para criar interfaces de usuário (as telas que você vê).

**Por que usamos?** 
- É como montar LEGO: você cria pequenos componentes e junta tudo
- Muito usada no mercado
- Facilita fazer sites que atualizam sem recarregar a página

**Exemplo simples:** Imagine que você tem um botão. Em vez de escrever o código do botão toda vez, você cria um componente "Botão" e reutiliza em vários lugares!

---

### Vite
**O que é?** Uma ferramenta que prepara seu código para rodar no navegador.

**Por que usamos?**
- SUPER RÁPIDO! Quando você salva um arquivo, ele atualiza instantaneamente
- Fácil de configurar
- Perfeito para iniciantes

**Analogia:** É como um chef que prepara todos os ingredientes antes de você cozinhar. Tudo fica organizado e rápido!

---

### Firebase
**O que é?** Um serviço do Google que oferece banco de dados, autenticação e hospedagem GRATUITAMENTE.

**Por que usamos?**
- **Gratuito** para projetos pequenos/médios
- Não precisa configurar servidor
- Funciona em tempo real (quando alguém adiciona um dízimo, todos veem na hora!)
- Tem autenticação pronta (login/senha)

**O que tem no Firebase?**
- **Firestore Database:** Onde salvamos dízimos, ofertas, despesas
- **Authentication:** Sistema de login pronto
- **Hosting:** Coloca seu site no ar

---

## 💻 Instalando as ferramentas necessárias

### 1️⃣ Instalar o Node.js

**O que é Node.js?** É o programa que permite rodar JavaScript no seu computador (fora do navegador).

**Como instalar:**

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (Long Term Support) - é a mais estável
3. Execute o instalador
4. Clique em "Next" até finalizar
5. **IMPORTANTE:** Reinicie o computador após instalar

**Como verificar se instalou:**

Abra o terminal/prompt de comando e digite:

```bash
node --version
```

Deve aparecer algo como: `v18.17.0` ou superior ✅

```bash
npm --version
```

Deve aparecer algo como: `9.6.7` ou superior ✅

---

### 2️⃣ Instalar o Git

**O que é Git?** Sistema de controle de versão. Guarda todo histórico de mudanças do código.

**Como instalar:**

**Windows:**
1. Acesse: https://git-scm.com/download/win
2. Baixe e execute o instalador
3. Deixe todas as opções padrão
4. Clique em "Next" até finalizar

**Mac:**
```bash
# Se tiver Homebrew instalado:
brew install git

# Ou baixe diretamente de:
# https://git-scm.com/download/mac
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**Como verificar:**

```bash
git --version
```

Deve aparecer algo como: `git version 2.40.0` ✅

---

### 3️⃣ Instalar um Editor de Código

**Recomendo fortemente o VS Code:**

1. Acesse: https://code.visualstudio.com/
2. Baixe para seu sistema operacional
3. Instale normalmente
4. Abra o VS Code

**Extensões úteis para instalar:**
- **ES7+ React/Redux/React-Native snippets** (atalhos para React)
- **Prettier** (formata o código automaticamente)
- **Auto Rename Tag** (renomeia tags HTML juntas)

---

## 📥 Clonando o projeto

**O que é clonar?** É fazer uma cópia do projeto do GitHub para o seu computador.

### Passo a passo:

1. **Abra o terminal/prompt:**
   - Windows: Pressione `Win + R`, digite `cmd`, Enter
   - Mac: Pressione `Cmd + Espaço`, digite `terminal`, Enter
   - Linux: `Ctrl + Alt + T`

2. **Navegue até a pasta onde quer salvar o projeto:**

```bash
# Exemplo: salvando na área de trabalho (Desktop)
cd Desktop

# Ou em Documentos:
cd Documents
```

3. **Clone o repositório:**

```bash
git clone https://github.com/MetusaelFigueiredo/gestao-financeira-igreja.git
```

4. **Entre na pasta do projeto:**

```bash
cd gestao-financeira-igreja
```

✅ Pronto! O projeto está no seu computador!

---

## 📦 Instalando dependências

**O que são dependências?** São bibliotecas (códigos prontos) que o projeto precisa para funcionar.

### Passo a passo:

1. **Certifique-se de estar na pasta do projeto:**

```bash
# Você deve estar em: gestao-financeira-igreja/
```

2. **Entre na pasta do frontend:**

```bash
cd frontend
```

3. **Instale as dependências:**

```bash
npm install
```

**O que acontece?**
- O npm (gerenciador de pacotes do Node.js) lê o arquivo `package.json`
- Baixa todas as bibliotecas necessárias (React, Firebase, etc.)
- Cria uma pasta chamada `node_modules` com tudo dentro
- Pode demorar alguns minutos na primeira vez

**Aguarde até aparecer algo como:**
```
added 250 packages in 45s
```

✅ Dependências instaladas!

---

## 🔥 Configurando o Firebase

### Passo 1: Criar conta no Firebase

1. Acesse: https://console.firebase.google.com/
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"** ou **"Create a project"**

### Passo 2: Criar o projeto

1. **Nome do projeto:** `gestao-igreja` (ou o que preferir)
2. Clique em **Continuar**
3. **Google Analytics:** Pode desativar por enquanto
4. Clique em **Criar projeto**
5. Aguarde alguns segundos... ✅ Projeto criado!

### Passo 3: Criar um aplicativo Web

1. No painel do Firebase, clique no ícone **</>** (Web)
2. **Nome do app:** `Igreja Frontend`
3. **NÃO** marque "Firebase Hosting" por enquanto
4. Clique em **Registrar app**

### Passo 4: Copiar as credenciais

Você verá um código parecido com este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC2XxYz...",
  authDomain: "gestao-igreja.firebaseapp.com",
  projectId: "gestao-igreja",
  storageBucket: "gestao-igreja.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**COPIE ESSAS INFORMAÇÕES!** Você vai precisar delas.

### Passo 5: Ativar o Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de teste"** (por enquanto)
4. Escolha a localização: **us-central** ou mais próxima
5. Clique em **Ativar**

### Passo 6: Ativar Authentication

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Vamos começar"**
3. Clique em **"E-mail/senha"**
4. **Ative** a primeira opção (E-mail/senha)
5. Clique em **Salvar**

### Passo 7: Configurar no projeto

1. **Volte para o terminal**, na pasta `frontend/`

2. **Copie o arquivo de exemplo:**

```bash
cp .env.example .env
```

3. **Abra o arquivo `.env` no VS Code:**

```bash
code .env
```

4. **Preencha com as credenciais do Firebase:**

```env
VITE_FIREBASE_API_KEY=AIzaSyC2XxYz... (cole o valor do apiKey)
VITE_FIREBASE_AUTH_DOMAIN=gestao-igreja.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gestao-igreja
VITE_FIREBASE_STORAGE_BUCKET=gestao-igreja.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

5. **Salve o arquivo** (`Ctrl + S`)

✅ Firebase configurado!

---

## ▶️ Rodando o projeto

### Passo a passo:

1. **Certifique-se de estar na pasta `frontend/`:**

```bash
cd frontend  # se ainda não estiver
```

2. **Rode o comando:**

```bash
npm run dev
```

3. **Aguarde até aparecer:**

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

4. **Abra o navegador** e acesse: http://localhost:5173

✅ **Projeto rodando!** 🎉

Você deve ver a tela inicial com "Sistema de Gestão Financeira - Igreja"

---

## 📖 Glossário de Termos Técnicos

| Termo | Significado Simples |
|-------|---------------------|
| **Frontend** | A parte visual do site (botões, formulários, cores) |
| **Backend** | A parte que processa dados e regras (servidor) |
| **Banco de Dados (BD)** | Onde os dados são salvos (como um arquivo Excel gigante) |
| **API** | Ponte entre frontend e backend (como um garçom que leva pedidos) |
| **Componente** | Pedaço reutilizável de interface (ex: botão, formulário) |
| **Props** | Informações que você passa para um componente |
| **State** | Dados que podem mudar (ex: saldo atual) |
| **Deploy** | Colocar o site no ar (online) |
| **Commit** | Salvar uma versão do código |
| **Repository** | Pasta com todo o código do projeto |
| **Clone** | Copiar um repositório para seu computador |
| **npm** | Gerenciador de pacotes do Node.js |
| **package.json** | Lista de dependências e configurações do projeto |
| **node_modules** | Pasta com todas as bibliotecas instaladas |
| **.env** | Arquivo com variáveis de ambiente (senhas, chaves) |
| **localhost** | Seu próprio computador (servidor local) |

---

## ❓ Problemas Comuns e Soluções

### ❌ Erro: "npm não é reconhecido como comando"

**Causa:** Node.js não está instalado ou não está no PATH.

**Solução:**
1. Reinstale o Node.js: https://nodejs.org/
2. **IMPORTANTE:** Reinicie o computador
3. Abra um NOVO terminal
4. Teste: `npm --version`

---

### ❌ Erro: "Cannot find module"

**Causa:** Dependências não foram instaladas.

**Solução:**
```bash
cd frontend
npm install
```

---

### ❌ Erro: "Port 5173 already in use"

**Causa:** Já tem um projeto rodando nessa porta.

**Solução:**
1. Feche o outro terminal que está rodando
2. Ou mude a porta no `vite.config.js`:
```javascript
server: {
  port: 3000  // use outra porta
}
```

---

### ❌ Erro ao conectar com Firebase

**Causa:** Arquivo `.env` não está configurado corretamente.

**Solução:**
1. Verifique se o arquivo `.env` existe na pasta `frontend/`
2. Verifique se copiou TODAS as credenciais do Firebase
3. Verifique se não tem espaços extras
4. Reinicie o servidor: `Ctrl + C` e depois `npm run dev`

---

### ❌ Página em branco no navegador

**Causa:** Pode ser erro no código ou no console.

**Solução:**
1. Pressione `F12` no navegador
2. Vá na aba **Console**
3. Veja se tem algum erro vermelho
4. Copie o erro e pesquise no Google ou peça ajuda

---

## 💡 Dicas para Iniciantes

1. **Não tenha medo de errar** - Erros são normais e fazem parte do aprendizado
2. **Leia as mensagens de erro** - Elas geralmente dizem onde está o problema
3. **Use o console do navegador** - Pressione `F12` para ver erros
4. **Faça commits frequentes** - Salve versões do código a cada mudança importante
5. **Comente seu código** - Explique o que cada parte faz
6. **Teste uma coisa de cada vez** - Não mude muita coisa ao mesmo tempo
7. **Pesquise no Google** - A maioria dos erros já foi resolvida por alguém
8. **Peça ajuda** - Comunidade de desenvolvedores é muito colaborativa!

---

## 📚 Recursos para Aprender Mais

### React:
- [Documentação Oficial do React (PT-BR)](https://pt-br.react.dev/)
- [Tutorial Interativo](https://react.dev/learn)

### Firebase:
- [Documentação do Firebase (PT-BR)](https://firebase.google.com/docs?hl=pt-br)
- [Vídeos no YouTube sobre Firebase](https://www.youtube.com/results?search_query=firebase+tutorial+português)

### JavaScript:
- [MDN Web Docs (PT-BR)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
- [JavaScript.info](https://javascript.info/)

---

## 🆘 Precisa de Ajuda?

Se você está travado em algum erro:

1. **Leia a mensagem de erro completa**
2. **Pesquise no Google:** "erro + mensagem de erro"
3. **Verifique os issues no GitHub** do projeto
4. **Pergunte na comunidade:**
   - [Stack Overflow em Português](https://pt.stackoverflow.com/)
   - [Comunidade React Brasil](https://github.com/react-brasil)

---

**Parabéns por chegar até aqui! 🎉**

Você já tem o projeto rodando! Agora é hora de começar a desenvolver as funcionalidades! 💪

**Próximo passo:** Leia o arquivo `docs/ARQUITETURA.md` para entender como o sistema funciona por dentro.

---

**Feito com ❤️ para iniciantes**