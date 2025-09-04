// Serviço para cálculo de distância entre localizações
// Baseado em Barra do Garças-MT como ponto de referência

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface Endereco {
  logradouro?: string;
  numero?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}

// Coordenadas de Barra do Garças-MT (ponto de referência)
const BARRA_DO_GARCAS: Coordenadas = {
  latitude: -15.8901,
  longitude: -52.2569
};

/**
 * Calcula a distância em quilômetros entre duas coordenadas usando a fórmula de Haversine
 */
export const calcularDistanciaHaversine = (
  coord1: Coordenadas,
  coord2: Coordenadas
): number => {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * 
    Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  
  return Math.round(distancia);
};

/**
 * Busca coordenadas de um endereço usando API de geocoding
 * Por enquanto, retorna coordenadas simuladas baseadas no estado
 */
export const buscarCoordenadas = async (endereco: Endereco): Promise<Coordenadas | null> => {
  try {
    // Por enquanto, vamos usar coordenadas simuladas baseadas no estado
    // Em produção, você pode integrar com Google Maps API, OpenStreetMap, etc.
    
    const coordenadasPorEstado: Record<string, Coordenadas> = {
      'MT': { latitude: -15.8901, longitude: -52.2569 }, // Barra do Garças
      'GO': { latitude: -16.6869, longitude: -49.2648 }, // Goiânia
      'MS': { latitude: -20.4697, longitude: -54.6201 }, // Campo Grande
      'TO': { latitude: -10.1753, longitude: -48.2982 }, // Palmas
      'PA': { latitude: -1.4558, longitude: -48.5044 },  // Belém
      'RO': { latitude: -8.7612, longitude: -63.9024 },  // Porto Velho
      'AC': { latitude: -9.9749, longitude: -67.8243 },  // Rio Branco
      'AM': { latitude: -3.1190, longitude: -60.0217 },  // Manaus
      'RR': { latitude: 2.8195, longitude: -60.6719 },   // Boa Vista
      'AP': { latitude: 0.0389, longitude: -51.0664 }    // Macapá
    };

    const uf = endereco.uf?.toUpperCase();
    if (uf && coordenadasPorEstado[uf]) {
      // Adicionar variação aleatória para simular diferentes cidades
      const base = coordenadasPorEstado[uf];
      const variacao = 0.5; // Variação de ~50km
      
      return {
        latitude: base.latitude + (Math.random() - 0.5) * variacao,
        longitude: base.longitude + (Math.random() - 0.5) * variacao
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error);
    return null;
  }
};

/**
 * Calcula a distância de um endereço até Barra do Garças-MT
 */
export const calcularDistanciaBarraGarcas = async (endereco: Endereco): Promise<number> => {
  try {
    const coordenadas = await buscarCoordenadas(endereco);
    
    if (!coordenadas) {
      // Se não conseguir obter coordenadas, retorna distância estimada baseada no estado
      const distanciasPorEstado: Record<string, number> = {
        'MT': Math.floor(Math.random() * 200) + 50,  // 50-250km
        'GO': Math.floor(Math.random() * 300) + 200, // 200-500km
        'MS': Math.floor(Math.random() * 400) + 300, // 300-700km
        'TO': Math.floor(Math.random() * 500) + 400, // 400-900km
        'PA': Math.floor(Math.random() * 600) + 500, // 500-1100km
        'RO': Math.floor(Math.random() * 800) + 600, // 600-1400km
        'AC': Math.floor(Math.random() * 1000) + 800, // 800-1800km
        'AM': Math.floor(Math.random() * 1200) + 1000, // 1000-2200km
        'RR': Math.floor(Math.random() * 1400) + 1200, // 1200-2600km
        'AP': Math.floor(Math.random() * 1600) + 1400  // 1400-3000km
      };

      const uf = endereco.uf?.toUpperCase();
      return distanciasPorEstado[uf || 'MT'] || 100;
    }

    return calcularDistanciaHaversine(coordenadas, BARRA_DO_GARCAS);
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    return 0;
  }
};

/**
 * Formata endereço completo para exibição
 */
export const formatarEndereco = (endereco: Endereco): string => {
  const partes = [];
  
  if (endereco.logradouro) {
    partes.push(endereco.logradouro);
    if (endereco.numero) {
      partes.push(endereco.numero);
    }
  }
  
  if (endereco.municipio) {
    partes.push(endereco.municipio);
    if (endereco.uf) {
      partes.push(endereco.uf);
    }
  }
  
  return partes.join(', ');
};

/**
 * Valida se o endereço tem informações suficientes para cálculo de distância
 */
export const validarEnderecoParaDistancia = (endereco: Endereco): boolean => {
  return !!(endereco.municipio && endereco.uf);
};



