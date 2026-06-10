import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { motoristaService, Motorista } from '../../services/motoristaService';
import jsPDF from 'jspdf';
import './CadastroMotoristas.css';
import CadastroMotoristasForm from './components/CadastroMotoristasForm';
import CadastroMotoristasTable from './components/CadastroMotoristasTable';

const CadastroMotoristas: React.FC = () => {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    cnh: '',
    categoria_cnh: 'B',
    vencimento_cnh: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    data_nascimento: '',
    tipo_motorista: 'Funcionário',
    status: 'Ativo',
    porcentagem_comissao: '',
    observacoes: ''
  });

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Carregar motoristas do Supabase
  useEffect(() => {
    loadMotoristas();
  }, []);

  const loadMotoristas = async () => {
    try {
      setLoading(true);
      const data = await motoristaService.getAll();
      setMotoristas(data);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
      alert('Erro ao carregar motoristas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      rg: '',
      cnh: '',
      categoria_cnh: 'B',
      vencimento_cnh: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
          data_nascimento: '',
    tipo_motorista: 'Funcionário',
    status: 'Ativo',
    porcentagem_comissao: '',
    observacoes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (motorista: Motorista) => {
    setFormData({
      nome: motorista.nome,
      cpf: motorista.cpf,
      rg: motorista.rg,
      cnh: motorista.cnh,
      categoria_cnh: motorista.categoria_cnh,
      vencimento_cnh: motorista.vencimento_cnh,
      telefone: motorista.telefone,
      email: motorista.email || '',
      endereco: motorista.endereco,
      cidade: motorista.cidade,
      estado: motorista.estado,
      cep: motorista.cep,
      data_nascimento: motorista.data_nascimento,
      tipo_motorista: motorista.tipo_motorista,
      status: motorista.status,
      porcentagem_comissao: motorista.porcentagem_comissao?.toString() || '',
      observacoes: motorista.observacoes || ''
    });
    setEditingId(motorista.id || null);
    setShowForm(true);
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações
      if (formData.cpf.replace(/\D/g, '').length !== 11) {
        alert('CPF deve ter 11 dígitos');
        return;
      }

      if (formData.cep.replace(/\D/g, '').length !== 8) {
        alert('CEP deve ter 8 dígitos');
        return;
      }

      // Verificar se CPF já existe
      const cpfExists = await motoristaService.checkCpfExists(
        formData.cpf.replace(/\D/g, ''), 
        editingId || undefined
      );
      if (cpfExists) {
        alert('CPF já cadastrado para outro motorista');
        return;
      }

      // Verificar se CNH já existe
      const cnhExists = await motoristaService.checkCnhExists(
        formData.cnh, 
        editingId || undefined
      );
      if (cnhExists) {
        alert('CNH já cadastrada para outro motorista');
        return;
      }

      const motoristaData = {
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ''),
        rg: formData.rg,
        cnh: formData.cnh,
        categoria_cnh: formData.categoria_cnh,
        vencimento_cnh: formData.vencimento_cnh,
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email || undefined,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep.replace(/\D/g, ''),
        data_nascimento: formData.data_nascimento,
        tipo_motorista: formData.tipo_motorista,
        status: formData.status,
        porcentagem_comissao: formData.porcentagem_comissao ? parseFloat(formData.porcentagem_comissao) : undefined,
        observacoes: formData.observacoes || undefined
      };

      if (editingId) {
        // Atualizar motorista existente
        const updatedMotorista = await motoristaService.update(editingId, motoristaData);
        setMotoristas(motoristas.map(m => m.id === editingId ? updatedMotorista : m));
        alert('Motorista atualizado com sucesso!');
      } else {
        // Criar novo motorista
        const newMotorista = await motoristaService.create(motoristaData);
        setMotoristas([newMotorista, ...motoristas]);
        alert('Motorista cadastrado com sucesso!');
      }
      
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
      alert('Erro ao salvar motorista. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este motorista?')) {
      try {
        await motoristaService.delete(id);
        setMotoristas(motoristas.filter(m => m.id !== id));
        alert('Motorista excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        alert('Erro ao excluir motorista.');
      }
    }
  };

  const formatCpfDisplay = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatTelefoneDisplay = (telefone: string) => {
    if (telefone.length === 11) {
      return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper para adicionar logo
    const addLogo = async (pdfDoc: any, x: number, y: number, w: number, h: number): Promise<void> => {
      try {
        const response = await fetch('/assets/images/logo.png');
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onload = function (e) {
              if (e.target?.result) {
                try {
                  pdfDoc.addImage(e.target.result as string, 'PNG', x, y, w, h);
                } catch (error) {
                  console.log('Erro ao adicionar logo no PDF:', error);
                }
              }
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.log('Logo não encontrada, continuando sem logo:', error);
      }
    };

    await addLogo(doc, 20, 10, 25, 25);

    // Cabeçalho da empresa
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 0, 0); // Cor vermelha
    doc.text('VALE DO BOI TRANSPORTE', 55, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('Transporte de Bovinos', 55, 24);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Rua XV de novembro, 1016 - Centro - Barra do Garças - MT - CEP 78600-000 | CNPJ: 27.244.973/0001-22', 55, 30);

    // Título do Relatório
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Motoristas', pageWidth / 2, 39, { align: 'center' });

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 0, 0);
    doc.line(20, 44, pageWidth - 20, 44);

    // Data de geração
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, 51, { align: 'center' });

    // Configurações da tabela
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 62;

    // Cabeçalho da tabela
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    const colWidths = [60, 40, 40, 40]; // Larguras das colunas
    const headers = ['Nome', 'CPF', 'Telefone', 'Tipo'];

    // Desenhar cabeçalho da tabela
    let xPosition = margin;
    headers.forEach((header, index) => {
      doc.rect(xPosition, yPosition - 5, colWidths[index], lineHeight + 2);
      doc.text(header, xPosition + 2, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += lineHeight + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    motoristas.forEach((motorista, index) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
        
        // Redesenhar cabeçalho da tabela
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        xPosition = margin;
        headers.forEach((header, headerIndex) => {
          doc.rect(xPosition, yPosition - 5, colWidths[headerIndex], lineHeight + 2);
          doc.text(header, xPosition + 2, yPosition);
          xPosition += colWidths[headerIndex];
        });
        yPosition += lineHeight + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
      
      // Dados da linha
      xPosition = margin;
      const dados = [
        motorista.nome,
        formatCpfDisplay(motorista.cpf),
        formatTelefoneDisplay(motorista.telefone),
        motorista.tipo_motorista
      ];
      
      dados.forEach((dado, colIndex) => {
        doc.rect(xPosition, yPosition - 5, colWidths[colIndex], lineHeight + 2);
        doc.text(dado, xPosition + 2, yPosition);
        xPosition += colWidths[colIndex];
      });
      
      yPosition += lineHeight + 2;
    });
    
    // Rodapé com total
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Total de motoristas: ${motoristas.length}`, margin, yPosition);
    
    // Salvar o PDF
    const fileName = `relatorio_motoristas_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="cadastro-motoristas">
        <div className="page-header">
          <h1>Cadastro de Motoristas</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando motoristas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-motoristas">
      <div className="page-header">
        <h1>Cadastro de Motoristas</h1>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={generatePDFReport}
            disabled={motoristas.length === 0}
            title="Gerar relatório em PDF"
          >
            <FileText size={20} />
            Relatório PDF
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Novo Motorista
          </button>
        </div>
      </div>

      <CadastroMotoristasForm
        showForm={showForm}
        setShowForm={setShowForm}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        formatCpf={formatCpf}
        formatCep={formatCep}
        formatTelefone={formatTelefone}
        estados={estados}
      />

      <CadastroMotoristasTable
        motoristas={motoristas}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        formatCpfDisplay={formatCpfDisplay}
        formatTelefoneDisplay={formatTelefoneDisplay}
      />
    </div>
  );
};

export default CadastroMotoristas; 