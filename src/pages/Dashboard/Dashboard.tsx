import React, { useState, useEffect } from 'react';
import { Truck, Users, Package, Fuel, Calendar, TrendingUp } from 'lucide-react';
import { caminhaoService } from '../../services/caminhaoService';
import { motoristaService } from '../../services/motoristaService';
import { freteService } from '../../services/freteService';
import { abastecimentoService } from '../../services/abastecimentoService';
import './Dashboard.css';

interface DashboardStats {
  totalCaminhoes: number;
  motoristasAtivos: number;
  fretesAndamento: number;
  abastecimentosHoje: number;
}

interface RecentActivity {
  id: number;
  tipo: string;
  descricao: string;
  data: string;
  valor?: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCaminhoes: 0,
    motoristasAtivos: 0,
    fretesAndamento: 0,
    abastecimentosHoje: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo
      const [caminhoes, motoristas, fretes, abastecimentos] = await Promise.all([
        caminhaoService.getAll(),
        motoristaService.getAll(),
        freteService.getAll(),
        abastecimentoService.getAll()
      ]);

      // Calcular estatísticas
      const totalCaminhoes = caminhoes.filter(c => c.status === 'Ativo').length;
      const motoristasAtivos = motoristas.filter(m => m.status === 'Ativo').length;
      const fretesAndamento = fretes.filter(f => 
        f.situacao === 'Em Andamento' || f.situacao === 'Pendente'
      ).length;

      // Abastecimentos de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const abastecimentosHoje = abastecimentos.filter(a => 
        a.data_abastecimento.startsWith(hoje)
      ).length;

      setStats({
        totalCaminhoes,
        motoristasAtivos,
        fretesAndamento,
        abastecimentosHoje
      });

      // Criar atividades recentes
      const activities: RecentActivity[] = [];

      // Últimos fretes (máximo 3)
      const ultimosFretes = fretes
        .sort((a, b) => new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime())
        .slice(0, 3);

      ultimosFretes.forEach(frete => {
        activities.push({
          id: frete.id!,
          tipo: 'Frete',
          descricao: `${frete.origem} → ${frete.destino}`,
          data: frete.data_emissao,
          valor: frete.valor_frete
        });
      });

      // Últimos abastecimentos (máximo 2)
      const ultimosAbastecimentos = abastecimentos
        .sort((a, b) => new Date(b.data_abastecimento).getTime() - new Date(a.data_abastecimento).getTime())
        .slice(0, 2);

      ultimosAbastecimentos.forEach(abast => {
        const caminhao = caminhoes.find(c => c.id === abast.caminhao_id);
        activities.push({
          id: abast.id!,
          tipo: 'Abastecimento',
          descricao: `${caminhao?.placa || 'N/A'} - ${abast.quantidade_litros}L`,
          data: abast.data_abastecimento,
          valor: abast.preco_total
        });
      });

      // Ordenar por data mais recente
      activities.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setError('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const dashboardStats = [
    {
      title: 'Total de Caminhões',
      value: stats.totalCaminhoes.toString(),
      icon: Truck,
      color: 'var(--primary-red)'
    },
    {
      title: 'Motoristas Ativos',
      value: stats.motoristasAtivos.toString(),
      icon: Users,
      color: '#28a745'
    },
    {
      title: 'Fretes em Andamento',
      value: stats.fretesAndamento.toString(),
      icon: Package,
      color: '#17a2b8'
    },
    {
      title: 'Abastecimentos Hoje',
      value: stats.abastecimentosHoje.toString(),
      icon: Fuel,
      color: '#ffc107'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard - Sistema de Logística</h1>
          <p>Carregando dados...</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard - Sistema de Logística</h1>
          <p className="error-message">{error}</p>
        </div>
        <button className="btn-primary" onClick={loadDashboardData}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard - Sistema de Logística</h1>
        <p>Visão geral das operações em tempo real</p>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                <Icon size={24} color="white" />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="activities-section">
          <div className="section-header">
            <h2>
              <TrendingUp size={20} />
              Atividades Recentes
            </h2>
            <button className="btn-secondary" onClick={loadDashboardData}>
              Atualizar
            </button>
          </div>
          
          {recentActivities.length > 0 ? (
            <div className="activities-list">
              {recentActivities.map((activity) => (
                <div key={`${activity.tipo}-${activity.id}`} className="activity-item">
                  <div className="activity-icon">
                    {activity.tipo === 'Frete' ? (
                      <Package size={16} />
                    ) : (
                      <Fuel size={16} />
                    )}
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <span className="activity-type">{activity.tipo}</span>
                      <span className="activity-date">
                        <Calendar size={14} />
                        {formatDate(activity.data)}
                      </span>
                    </div>
                    <p className="activity-description">{activity.descricao}</p>
                    {activity.valor && (
                      <span className="activity-value">{formatCurrency(activity.valor)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activities">
              <p>Nenhuma atividade recente encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 