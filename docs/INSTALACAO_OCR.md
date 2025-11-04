# 🤖 Guia de Instalação - Firebase Extension: Multimodal Tasks with Gemini

## 📝 Passo a Passo para Instalação

### 1. Acesse o Console do Firebase
- Vá para: https://console.firebase.google.com/
- Selecione seu projeto: `gestao-financeira-igreja`

### 2. Navegue para Extensions
- No menu lateral, clique em "Extensions"
- Clique em "Browse Extensions" ou "Explorar Extensões"

### 3. Encontre a Extensão Gemini
- Procure por: "Multimodal Tasks with the Gemini"
- Ou acesse diretamente: https://extensions.dev/extensions/googlecloud/multimodal-gemini
- Clique em "Install in Firebase console"

### 4. Configure a Extensão

#### 🔧 Configurações Obrigatórias:
- **Cloud Storage bucket path**: `comprovantes/{fileName}`
- **Firestore collection path**: `processamento_gemini`
- **Gemini API Model**: `gemini-1.5-flash` (recomendado para velocidade)
- **Prompt Template**:
```
Analise este comprovante PIX e extraia as seguintes informações em formato JSON:

{
  "valor": [valor numérico da transação],
  "data": "[data no formato DD/MM/YYYY]",
  "nome": "[nome completo do pagador/remetente]"
}

Se alguma informação não estiver disponível, use null para o campo.
Retorne apenas o JSON, sem texto adicional.
```

#### 🔧 Configurações Opcionais:
- **Response MIME Type**: `application/json`
- **Temperature**: `0.1` (baixa para maior precisão)
- **Max Output Tokens**: `256`
- **Enable Safety Settings**: `Yes`

### 5. Billing e Permissões
- A extensão requer Gemini API (cobrada por uso)
- Habilite a API do Gemini no Google Cloud Console
- Aceite os termos e clique em "Install Extension"
- Aguarde 3-5 minutos para instalação completa

### 6. Verificar Instalação
- Vá em "Extensions" → "Manage"
- Confirme que "Multimodal Tasks with Gemini" está "Active"

## 🧪 Teste Rápido
1. Faça upload de um comprovante (JPG/PNG/PDF) na pasta `comprovantes/`
2. Verifique se apareceu um documento em `processamento_gemini/`
3. Confirme que o JSON foi gerado corretamente

## ⚠️ Importante
- A extensão processa JPG, PNG e PDF
- Melhor precisão com imagens de alta qualidade
- Cada processamento consome tokens da API Gemini

## 🔗 Links Úteis
- Documentação: https://firebase.google.com/products/extensions
- Gemini API Pricing: https://ai.google.dev/pricing
- Suporte: https://firebase.google.com/support

## 📋 Exemplo de Resposta Esperada
```json
{
  "valor": 125.50,
  "data": "01/11/2025",
  "nome": "Metusael Figueiredo"
}
```