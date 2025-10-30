import { useState } from 'react';
import { adicionarDespesa } from '../services/despesas';
import UploadComprovante from './UploadComprovante';
import '../styles/FormDespesa.css';

const FormDespesa = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    vencimento: '',
    categoria: 'Utilidades',
    formaPagamento: 'Dinheiro',
    status: 'Pendente',
    observacoes: '',
    parcelado: false,
    numeroParcelas: 1
  });
  const [comprovante, setComprovante] = useState(null);

  const categorias = [
    'Utilidades',
    'Salários',
    'Manutenção',
    'Material',
    'Eventos',
    'Outros'
  ];

  const formasPagamento = [
    'Dinheiro',
    'PIX',
    'Débito',
    'Crédito',
    'Transferência',
    'Boleto'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.descricao.trim()) {
      alert('❌ Descrição é obrigatória!');
      return;
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      alert('❌ Valor deve ser maior que zero!');
      return;
    }

    if (!formData.vencimento) {
      alert('❌ Data de vencimento é obrigatória!');
      return;
    }

    setLoading(true);

    try {
      const despesaData = {
        ...formData,
        valor: parseFloat(formData.valor),
        numeroParcelas: formData.parcelado ? parseInt(formData.numeroParcelas) : 1,
        comprovante: comprovante || null
      };

      await adicionarDespesa(despesaData);
      
      alert('✅ Despesa cadastrada com sucesso!');
      
      // Limpar formulário
      setFormData({
        descricao: '',
        valor: '',
        vencimento: '',
        categoria: 'Utilidades',
        formaPagamento: 'Dinheiro',
        status: 'Pendente',
        observacoes: '',
        parcelado: false,
        numeroParcelas: 1
      });
      setComprovante(null);

      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Erro ao cadastrar despesa:', error);
      alert('❌ Erro ao cadastrar despesa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-despesa">
      <h2>📝 Nova Despesa</h2>

      <div className="form-grid">
        {/* Descrição */}
        <div className="form-group full-width">
          <label>Descrição *</label>
          <input
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Ex: Conta de Luz - Novembro"
            required
          />
        </div>

        {/* Valor */}
        <div className="form-group">
          <label>Valor (R$) *</label>
          <input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            placeholder="0,00"
            required
          />
        </div>

        {/* Vencimento */}
        <div className="form-group">
          <label>Vencimento *</label>
          <input
            type="date"
            name="vencimento"
            value={formData.vencimento}
            onChange={handleChange}
            required
          />
        </div>

        {/* Categoria */}
        <div className="form-group">
          <label>Categoria</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Forma de Pagamento */}
        <div className="form-group">
          <label>Forma de Pagamento</label>
          <select
            name="formaPagamento"
            value={formData.formaPagamento}
            onChange={handleChange}
          >
            {formasPagamento.map(forma => (
              <option key={forma} value={forma}>{forma}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Pendente">⏳ Pendente</option>
            <option value="Paga">✅ Paga</option>
            <option value="Vencida">❌ Vencida</option>
          </select>
        </div>

        {/* Parcelado */}
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="parcelado"
              checked={formData.parcelado}
              onChange={handleChange}
            />
            <span>💳 Parcelado</span>
          </label>
        </div>

        {/* Número de Parcelas */}
        {formData.parcelado && (
          <div className="form-group">
            <label>Número de Parcelas</label>
            <input
              type="number"
              name="numeroParcelas"
              value={formData.numeroParcelas}
              onChange={handleChange}
              min="2"
              max="24"
            />
          </div>
        )}

        {/* Observações */}
        <div className="form-group full-width">
          <label>Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="3"
            placeholder="Informações adicionais..."
          />
        </div>

        {/* Upload de Comprovante */}
        <div className="form-group full-width">
          <label>Comprovante</label>
          <UploadComprovante onUploadComplete={setComprovante} />
        </div>
      </div>

      {/* Botões */}
      <div className="form-actions">
        <button 
          type="button" 
          onClick={onCancel}
          className="btn-cancelar"
          disabled={loading}
        >
          ❌ Cancelar
        </button>
        <button 
          type="submit" 
          className="btn-salvar"
          disabled={loading}
        >
          {loading ? '⏳ Salvando...' : '💾 Cadastrar Despesa'}
        </button>
      </div>
    </form>
  );
};

export default FormDespesa;