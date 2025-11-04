# 🚀 Guia Completo: Cloud Function para Processamento de PDFs

## 📋 Visão Geral da Arquitetura

### 🔄 Fluxo Automatizado:
1. **Upload** → Usuário faz upload do PDF via UploadComprovante
2. **Trigger** → Cloud Function detecta novo arquivo em `comprovantes/`
3. **Download** → Function baixa o PDF do Firebase Storage
4. **Extração** → usa `pdf-parse` para extrair texto do PDF
5. **Regex** → procura por `R$`, `DD/MM/YYYY` e nomes no texto
6. **Update** → atualiza documento Firestore com dados extraídos

## 🛠️ Instalação

### 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Fazer Login no Firebase
```bash
firebase login
```

### 3. Inicializar Projeto (se necessário)
```bash
cd C:\Fluxo\gestao-financeira-igreja
firebase init
```

### 4. Instalar Dependências da Cloud Function
```bash
cd functions
npm install
```

## 📦 Dependências Instaladas

### Principais:
- **firebase-functions**: Framework para Cloud Functions
- **firebase-admin**: SDK Admin para acessar Firestore/Storage
- **pdf-parse**: Biblioteca para extrair texto de PDFs

### Desenvolvimento:
- **eslint**: Linting de código
- **firebase-functions-test**: Testes das functions

## 🎯 Regex Implementadas

### 💰 Extração de Valor:
```javascript
const regexValor = /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi;
// Encontra: R$ 1.234,56 ou R$1.234,56
```

### 📅 Extração de Data:
```javascript
const regexData = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
// Encontra: 15/11/2024 ou 15/11/24
```

### 👤 Extração de Nome:
```javascript
const regexNome = /(?:Nome|Para|Recebedor|Destinatário):\s*([A-Z\s]{3,50})/gi;
// Encontra: Nome: MARIA APARECIDA DA SILVA
```

## 🚀 Deploy da Cloud Function

### 1. Deploy Completo:
```bash
firebase deploy
```

### 2. Deploy Apenas Functions:
```bash
firebase deploy --only functions
```

### 3. Deploy Function Específica:
```bash
firebase deploy --only functions:processarComprovantePIX
```

## 🧪 Testando a Function

### 1. Teste Local (Emulador):
```bash
cd functions
npm run serve
```

### 2. Teste Manual via HTTP:
```bash
curl -X POST https://your-project.cloudfunctions.net/testarProcessamentoPDF \
  -H "Content-Type: application/json" \
  -d '{"filePath": "comprovantes/exemplo.pdf"}'
```

### 3. Logs em Tempo Real:
```bash
firebase functions:log --only processarComprovantePIX
```

## 📊 Dados Extraídos

### Campos Adicionados ao Firestore:
```javascript
{
  // Dados extraídos do PDF
  valorExtraido: 1234.56,           // Valor em R$
  dataExtraida: "15/11/2024",       // Data da transação
  nomeExtraido: "MARIA APARECIDA",  // Nome do pagador
  
  // Metadata do processamento
  processadoPorCloudFunction: true,
  processamentoEm: Timestamp.now(),
  textoCompletoPDF: "PIX recebido..." // Para debug
}
```

## 🔧 Configurações do Firebase

### 1. Firestore Rules (firestore.rules):
```javascript
match /entradas/{entradaId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated();  // ✅ Necessário para Cloud Function
  allow delete: if isAuthenticated();
}
```

### 2. Storage Rules (storage.rules):
```javascript
match /comprovantes/{allPaths=**} {
  allow read, write: if request.auth != null;  // ✅ Upload e Cloud Function
}
```

## 🐛 Troubleshooting

### Problema: Function não é acionada
**Solução**: Verificar se arquivo está sendo salvo em `comprovantes/`
```javascript
console.log('Caminho do arquivo:', filePath);
// Deve começar com: comprovantes/
```

### Problema: PDF não é processado
**Solução**: Verificar logs da function
```bash
firebase functions:log --only processarComprovantePIX
```

### Problema: Documento não é encontrado
**Solução**: Verificar se comprovanteUrl está correto
```javascript
// URL deve conter o nome do arquivo
const comprovanteUrl = 'https://firebasestorage.googleapis.com/.../comprovantes/arquivo.pdf'
```

## 📈 Monitoramento

### 1. Console do Firebase:
- Functions → Logs → processarComprovantePIX

### 2. Logs Detalhados:
```javascript
console.log('📄 Texto extraído:', textoCompleto);
console.log('🎯 Dados encontrados:', dadosExtraidos);
console.log('📝 Documento atualizado:', doc.id);
```

### 3. Métricas:
- Invocações por minuto
- Duração média
- Taxa de erro

## 🎉 Resultado Final

### Antes (Manual):
1. Upload do PDF
2. Usuário digita valor manualmente
3. Usuário digita data manualmente
4. Usuário digita descrição manualmente

### Depois (Automático):
1. Upload do PDF ✅
2. **Cloud Function extrai valor** 🤖
3. **Cloud Function extrai data** 🤖
4. **Cloud Function extrai nome** 🤖
5. **Dados salvos automaticamente** ✨

## 🔗 Próximos Passos

1. **Deploy**: `firebase deploy --only functions`
2. **Teste**: Upload de um PDF de comprovante
3. **Verificar**: Logs da function para dados extraídos
4. **Validar**: Firestore com novos campos preenchidos

**Pronto! Sistema 100% automatizado sem Extensões! 🚀**