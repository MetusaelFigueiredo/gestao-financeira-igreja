import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import imageCompression from 'browser-image-compression';

function UploadComprovante({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [erro, setErro] = useState('');

  const comprimirImagem = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`✅ Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      return file;
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      setErro('Apenas arquivos JPG, PNG ou PDF são permitidos');
      return;
    }
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo: 5MB');
      return;
    }
    
    setErro('');
    setUploading(true);
    setProgress(0);
    
    try {
      // Comprimir se for imagem
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        fileToUpload = await comprimirImagem(file);
      }
      
      // Gerar nome único
      const timestamp = Date.now();
      const nomeArquivo = `comprovantes/${timestamp}_${file.name}`;
      
      // Upload para Firebase Storage
      const storageRef = ref(storage, nomeArquivo);
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progresso = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progresso);
        },
        (error) => {
          console.error('Erro no upload:', error);
          setErro('Erro ao fazer upload do arquivo');
          setUploading(false);
        },
        async () => {
          // Upload completo
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const comprovante = {
            url: downloadURL,
            nome: file.name,
            tipo: file.type,
            tamanho: fileToUpload.size
          };
          
          setUploading(false);
          setProgress(0);
          
          if (onUploadComplete) {
            onUploadComplete(comprovante);
          }
          
          console.log('✅ Upload concluído:', downloadURL);
        }
      );
      
    } catch (error) {
      console.error('Erro no upload:', error);
      setErro('Erro ao processar arquivo');
      setUploading(false);
    }
  };

  return (
    <div style={{
      border: '2px dashed #dadce0',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: uploading ? '#f8f9fa' : '#ffffff',
      transition: 'all 0.3s ease'
    }}>
      {!uploading ? (
        <>
          <div style={{
            fontSize: '2rem',
            marginBottom: '12px'
          }}>
            📎
          </div>
          
          <label style={{
            padding: '10px 20px',
            backgroundColor: '#1a73e8',
            color: '#ffffff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'inline-block',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1765cc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a73e8'}>
            Selecionar Arquivo
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </label>
          
          <div style={{
            fontSize: '0.8125rem',
            color: '#5f6368',
            marginTop: '12px'
          }}>
            JPG, PNG ou PDF • Máximo 5MB
          </div>
        </>
      ) : (
        <>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '12px'
          }}>
            ⏳
          </div>
          
          <div style={{
            fontSize: '0.875rem',
            color: '#5f6368',
            marginBottom: '12px',
            fontWeight: '500'
          }}>
            Enviando arquivo... {Math.round(progress)}%
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e8eaed',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#1a73e8',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </>
      )}
      
      {erro && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#fce8e6',
          color: '#c5221f',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {erro}
        </div>
      )}
    </div>
  );
}

export default UploadComprovante;