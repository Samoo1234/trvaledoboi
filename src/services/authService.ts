import { supabase } from './supabaseClient';

export interface Usuario {
  id?: number;
  email: string;
  nome: string;
  tipo_usuario: 'Admin' | 'Operador';
  status: 'Ativo' | 'Inativo';
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface CreateUserData {
  email: string;
  nome: string;
  senha: string;
  tipo_usuario: 'Admin' | 'Operador';
  status: 'Ativo' | 'Inativo';
}

class AuthService {
  private readonly STORAGE_KEY = 'valedoboi_auth_token';
  private readonly USER_KEY = 'valedoboi_user_data';

  // Login do usuário
  async login(credentials: LoginCredentials): Promise<Usuario> {
    try {
      const { data, error } = await supabase
        .rpc('authenticate_user', {
          p_email: credentials.email,
          p_senha: credentials.senha
        });

      if (error) {
        throw new Error('Erro na autenticação: ' + error.message);
      }

      if (!data || data.length === 0) {
        throw new Error('Email ou senha incorretos');
      }

      const user = data[0];
      
      if (user.status !== 'Ativo') {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
      }

      // Gerar token simples (em produção usar JWT)
      const token = this.generateToken(user);
      
      // Salvar no localStorage
      localStorage.setItem(this.STORAGE_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Logout do usuário
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Verificar se usuário está logado
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEY);
    const user = localStorage.getItem(this.USER_KEY);
    return !!(token && user);
  }

  // Obter usuário atual
  getCurrentUser(): Usuario | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Verificar se usuário é admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.tipo_usuario === 'Admin';
  }

  // Listar todos os usuários (apenas admin)
  async getUsers(): Promise<Usuario[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, nome, tipo_usuario, status, created_at, updated_at')
        .order('nome');

      if (error) {
        throw new Error('Erro ao buscar usuários: ' + error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  // Criar novo usuário (apenas admin)
  async createUser(userData: CreateUserData): Promise<Usuario> {
    try {
      const { data, error } = await supabase
        .rpc('create_user_with_hash', {
          p_email: userData.email,
          p_nome: userData.nome,
          p_senha: userData.senha,
          p_tipo_usuario: userData.tipo_usuario,
          p_status: userData.status
        });

      if (error) {
        throw new Error('Erro ao criar usuário: ' + error.message);
      }

      return data[0];
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário (apenas admin)
  async updateUser(id: number, userData: Partial<Usuario>): Promise<Usuario> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao atualizar usuário: ' + error.message);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Alterar senha do usuário
  async changePassword(userId: number, novaSenha: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('change_user_password', {
          p_user_id: userId,
          p_nova_senha: novaSenha
        });

      if (error) {
        throw new Error('Erro ao alterar senha: ' + error.message);
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  // Inativar usuário (soft delete)
  async deactivateUser(id: number): Promise<void> {
    try {
      await this.updateUser(id, { status: 'Inativo' });
    } catch (error) {
      console.error('Erro ao inativar usuário:', error);
      throw error;
    }
  }

  // Gerar token simples (em produção usar JWT)
  private generateToken(user: Usuario): string {
    const payload = {
      id: user.id,
      email: user.email,
      tipo: user.tipo_usuario,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(payload));
  }

  // Verificar validade do token
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();
      const tokenAge = now - payload.timestamp;
      
      // Token expira em 8 horas (28800000 ms)
      return tokenAge < 28800000;
    } catch {
      return false;
    }
  }

  // Validar sessão atual
  async validateSession(): Promise<boolean> {
    const token = localStorage.getItem(this.STORAGE_KEY);
    const user = localStorage.getItem(this.USER_KEY);

    if (!token || !user) {
      return false;
    }

    if (!this.isTokenValid(token)) {
      this.logout();
      return false;
    }

    return true;
  }
}

export const authService = new AuthService(); 