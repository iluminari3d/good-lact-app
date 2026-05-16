import { FOODS_DATA } from '../data/goodLactData';

export const callApi = async (type: string, data: any) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log(`Local AI Analysis Triggered: ${type}`, data);

  // Heuristic Intelligence Logic
  if (type === 'getBaseDishWeight') {
    const name = data.dishName?.toLowerCase() || '';
    if (name.includes('pizza')) return { weight: 350 };
    if (name.includes('pasta') || name.includes('lasagna')) return { weight: 300 };
    if (name.includes('gelato')) return { weight: 150 };
    return { weight: 200 };
  }

  if (type === 'analyzeBaseDish') {
    const name = data.name?.toLowerCase() || '';
    const hidden: any[] = [];

    // Simple pattern matching for "hidden" or common ingredients
    if (name.includes('pizza')) {
        hidden.push({ name: 'Mozzarella', estimatedGrams: 80, lactoseAmount: 0.56, isActive: true });
        if (name.includes('4 formaggi') || name.includes('quattro')) {
            hidden.push({ name: 'Gorgonzola', estimatedGrams: 30, lactoseAmount: 0.015, isActive: true });
            hidden.push({ name: 'Fontina', estimatedGrams: 30, lactoseAmount: 0.03, isActive: true });
        }
    }

    if (name.includes('lasagna')) {
        hidden.push({ name: 'Besciamella', estimatedGrams: 100, lactoseAmount: 4.5, isActive: true });
        hidden.push({ name: 'Parmigiano', estimatedGrams: 20, lactoseAmount: 0.002, isActive: true });
    }

    if (name.includes('carbonara')) {
        hidden.push({ name: 'Pecorino', estimatedGrams: 30, lactoseAmount: 0.003, isActive: true });
        // Some places use cream!
        hidden.push({ name: 'Panna (possibile)', estimatedGrams: 50, lactoseAmount: 1.9, isActive: true });
    }

    return { 
        estimatedLactose: hidden.reduce((acc, curr) => acc + curr.lactoseAmount, 0),
        hiddenIngredients: hidden 
    };
  }

  return {};
};
