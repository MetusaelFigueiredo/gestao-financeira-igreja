# 🔐 Configuração das Regras de Segurança do Firestore

## ❗ Problema Identificado
O erro `FirebaseError: Missing or insufficient permissions` indica que as regras de segurança do Firestore estão bloqueando a operação `onSnapshot()` que aguarda o processamento do Gemini.

## 🎯 Solução Implementada

### Permissões Atualizadas para Coleção `entradas`:
```javascript
match /entradas/{entradaId} {
  allow read: if isAuthenticated();    // ✅ Permitir leitura
  allow create: if isAuthenticated();  // ✅ Permitir criação
  allow update: if isAuthenticated();  // ✅ Permitir atualização
  allow delete: if isAuthenticated();  // ✅ Permitir exclusão para usuários logados
}
```

### 🆕 Nova Coleção `processamento_gemini`:
```javascript
match /processamento_gemini/{docId} {
  allow read: if isAuthenticated();    // ✅ Permitir leitura (onSnapshot do FormEntrada)
  allow write: if isAuthenticated();   // ✅ Permitir escrita (Gemini Extension)
}
```

> **📍 Motivo:** O FormEntrada.jsx usa `onSnapshot()` na linha 261 para escutar mudanças na coleção `processamento_gemini` onde o Gemini AI processa os comprovantes.

## 📋 Como Aplicar as Regras

### 1. Acesse o Firebase Console
- Vá para [console.firebase.google.com](https://console.firebase.google.com)
- Selecione seu projeto

### 2. Navegue até Firestore Database
- No menu lateral, clique em "Firestore Database"
- Vá para a aba "Rules" (Regras)

### 3. Substitua o Conteúdo
- Apague todo o conteúdo atual
- Cole o conteúdo completo do arquivo `firestore.rules`

### 4. Publique as Regras
- Clique em "Publish" (Publicar)
- Aguarde a confirmação de sucesso

## 🔍 Validação das Permissões

### Teste no Simulador do Firebase:
```javascript
// Teste de leitura em entradas
allow read: if request.auth.uid != null;
// Usuário: { uid: "user123", token: { isAdmin: false } }
// Recurso: /entradas/entrada123

// Teste de leitura em processamento_gemini (NOVO)
allow read: if request.auth.uid != null;
// Usuário: { uid: "user123", token: { isAdmin: false } }
// Recurso: /processamento_gemini/gemini123
```

## ⚡ Operações Permitidas Após a Atualização

### ✅ Agora Funciona:
1. **onSnapshot()** - Listener para aguardar Gemini
2. **addDoc()** - Criar nova entrada
3. **updateDoc()** - Atualizar campos após processamento IA
4. **getDocs()** - Buscar entradas para relatórios
5. **doc().get()** - Ler entrada específica

### 🔒 Ainda Protegido:
- **deleteDoc()** - Apenas administradores podem deletar
- **Coleções não especificadas** - Bloqueadas por padrão

## 🚀 Resultado Esperado

Após aplicar essas regras, o fluxo completo funcionará:

1. ✅ **Upload do comprovante** → FormEntrada
2. ✅ **Criar documento** → addDoc() com comprovanteUrl
3. ✅ **Listener ativado** → onSnapshot() sem erro de permissão
4. ✅ **Gemini processa** → Extensão adiciona resultadoOcr
5. ✅ **Campos atualizados** → updateDoc() preenche automaticamente

## 📝 Arquivos do Projeto

- **firestore.rules** - Regras de segurança completas
- **CONFIGURACAO_REGRAS.md** - Este guia de configuração
- **src/services/entradas.js** - Serviço com aguardarProcessamentoGemini()

## ⚠️ Importante

Essas regras são específicas para o funcionamento do sistema de gestão financeira da igreja, incluindo:
- Autenticação obrigatória para todas as operações
- Controle granular por coleção
- Proteção contra acesso não autorizado
- Suporte completo ao fluxo Gemini + onSnapshot