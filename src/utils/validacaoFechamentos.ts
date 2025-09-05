// SCRIPT DE VALIDAÇÃO AUTOMÁTICA DE FECHAMENTOS
// Este arquivo contém funções para validar a integridade dos fechamentos

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

export class ValidadorFechamentos {
  // Validar um fechamento individual
  static validarFechamento(fechamento: any): ResultadoValidacao {
    const erros: string[] = [];
    const avisos: string[] = [];

    // 1. Validações básicas
    if (fechamento.valor_bruto < 0) {
      erros.push('Valor bruto não pode ser negativo');
    }

    if (fechamento.valor_comissao < 0) {
      erros.push('Valor de comissão não pode ser negativo');
    }

    if (fechamento.descontos < 0) {
      erros.push('Descontos não podem ser negativos');
    }

    if (fechamento.bonus < 0) {
      erros.push('Bônus não pode ser negativo');
    }

    // 2. Validar cálculo de valor líquido
    const valorLiquidoCalculado = fechamento.valor_comissao - fechamento.descontos + fechamento.bonus;
    if (Math.abs(fechamento.valor_liquido - valorLiquidoCalculado) > 0.01) {
      erros.push(`Valor líquido incorreto. Esperado: R$ ${valorLiquidoCalculado.toFixed(2)}, Atual: R$ ${fechamento.valor_liquido.toFixed(2)}`);
    }

    // 3. Validar comissão baseada no tipo de motorista e configuração do administrador
    if (fechamento.motorista?.tipo_motorista === 'Terceiro') {
      const porcentagemEsperada = fechamento.motorista.porcentagem_comissao || 90; // Padrão 90% para terceiros
      const comissaoEsperada = fechamento.valor_bruto * (porcentagemEsperada / 100);
      if (Math.abs(fechamento.valor_comissao - comissaoEsperada) > 0.01) {
        erros.push(`Comissão incorreta para terceiro. Esperado: R$ ${comissaoEsperada.toFixed(2)} (${porcentagemEsperada}%), Atual: R$ ${fechamento.valor_comissao.toFixed(2)}`);
      }
    } else if (fechamento.motorista?.tipo_motorista === 'Funcionário') {
      const porcentagemEsperada = fechamento.motorista.porcentagem_comissao || 10; // Padrão 10% para funcionários
      const comissaoEsperada = fechamento.valor_bruto * (porcentagemEsperada / 100);
      if (Math.abs(fechamento.valor_comissao - comissaoEsperada) > 0.01) {
        erros.push(`Comissão incorreta para funcionário. Esperado: R$ ${comissaoEsperada.toFixed(2)} (${porcentagemEsperada}%), Atual: R$ ${fechamento.valor_comissao.toFixed(2)}`);
      }
    }

    // 4. Avisos para valores suspeitos
    if (fechamento.valor_bruto > 100000) {
      avisos.push('Valor bruto muito alto - verificar se está correto');
    }

    if (fechamento.descontos > fechamento.valor_comissao) {
      avisos.push('Descontos maiores que comissão - verificar se está correto');
    }

    if (fechamento.valor_liquido < 0) {
      avisos.push('Valor líquido negativo - motorista deve dinheiro');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  // Validar todos os fechamentos de um período
  static validarPeriodo(fechamentos: any[]): {
    total: number;
    validos: number;
    invalidos: number;
    problemas: Array<{
      motorista: string;
      erros: string[];
      avisos: string[];
    }>;
  } {
    const problemas: Array<{
      motorista: string;
      erros: string[];
      avisos: string[];
    }> = [];

    let validos = 0;
    let invalidos = 0;

    fechamentos.forEach(fechamento => {
      const validacao = this.validarFechamento(fechamento);
      
      if (validacao.valido) {
        validos++;
      } else {
        invalidos++;
        problemas.push({
          motorista: fechamento.motorista?.nome || 'Desconhecido',
          erros: validacao.erros,
          avisos: validacao.avisos
        });
      }
    });

    return {
      total: fechamentos.length,
      validos,
      invalidos,
      problemas
    };
  }

  // Gerar relatório de validação
  static gerarRelatorio(validacao: {
    total: number;
    validos: number;
    invalidos: number;
    problemas: Array<{
      motorista: string;
      erros: string[];
      avisos: string[];
    }>;
  }): string {
    let relatorio = `=== RELATÓRIO DE VALIDAÇÃO DE FECHAMENTOS ===\n`;
    relatorio += `Total de fechamentos: ${validacao.total}\n`;
    relatorio += `Válidos: ${validacao.validos}\n`;
    relatorio += `Inválidos: ${validacao.invalidos}\n\n`;

    if (validacao.problemas.length > 0) {
      relatorio += `=== PROBLEMAS ENCONTRADOS ===\n`;
      validacao.problemas.forEach((problema, index) => {
        relatorio += `\n${index + 1}. ${problema.motorista}:\n`;
        
        if (problema.erros.length > 0) {
          relatorio += `   ERROS:\n`;
          problema.erros.forEach(erro => {
            relatorio += `   - ${erro}\n`;
          });
        }
        
        if (problema.avisos.length > 0) {
          relatorio += `   AVISOS:\n`;
          problema.avisos.forEach(aviso => {
            relatorio += `   - ${aviso}\n`;
          });
        }
      });
    } else {
      relatorio += `✅ Todos os fechamentos estão válidos!\n`;
    }

    return relatorio;
  }
}

// Função utilitária para validar fechamentos em tempo real
export const validarFechamentosTempoReal = async (fechamentos: any[]): Promise<void> => {
  const validacao = ValidadorFechamentos.validarPeriodo(fechamentos);
  
  if (validacao.invalidos > 0) {
    const relatorio = ValidadorFechamentos.gerarRelatorio(validacao);
    console.error('ERRO DE VALIDAÇÃO:', relatorio);
    throw new Error(`Encontrados ${validacao.invalidos} fechamentos inválidos. Verifique o console para detalhes.`);
  }
  
  if (validacao.problemas.some(p => p.avisos.length > 0)) {
    const relatorio = ValidadorFechamentos.gerarRelatorio(validacao);
    console.warn('AVISOS DE VALIDAÇÃO:', relatorio);
  }
  
  console.log(`✅ Validação concluída: ${validacao.validos}/${validacao.total} fechamentos válidos`);
};
