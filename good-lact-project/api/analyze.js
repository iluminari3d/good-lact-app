// Mocked API for analysis
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case 'analyzeFoodItem': {
        const { name, weight } = data;
        // Simple heuristic for demo purposes
        let lactoseAmount = 0;
        const n = name.toLowerCase();
        if (n.includes('latte')) lactoseAmount = (weight / 100) * 4.8;
        else if (n.includes('mozzarella')) lactoseAmount = (weight / 100) * 1.0;
        else if (n.includes('yogurt')) lactoseAmount = (weight / 100) * 4.0;
        else if (n.includes('panna')) lactoseAmount = (weight / 100) * 3.2;
        
        return res.status(200).json({ lactoseAmount });
      }

      case 'getBaseDishWeight': {
        const { dishName } = data;
        const n = dishName.toLowerCase();
        let weight = 200;
        if (n.includes('pizza')) weight = 325;
        else if (n.includes('risotto')) weight = 190;
        else if (n.includes('pasta')) weight = 180;
        
        return res.status(200).json({ weight });
      }

      case 'analyzeBaseDish': {
        const { name } = data;
        const n = name.toLowerCase();
        let hiddenIngredients = [];
        if (n.includes('pizza')) {
          hiddenIngredients.push({ name: 'Mozzarella', estimatedGrams: 100, lactoseAmount: 1.0 });
        } else if (n.includes('risotto')) {
          hiddenIngredients.push({ name: 'Burro', estimatedGrams: 15, lactoseAmount: 0.1 });
          hiddenIngredients.push({ name: 'Parmigiano', estimatedGrams: 10, lactoseAmount: 0 });
        }
        
        return res.status(200).json({ estimatedLactose: 0, hiddenIngredients });
      }

      case 'getIngredientQuantity': {
        return res.status(200).json({ quantity: 50 });
      }

      default:
        return res.status(400).json({ message: 'Unknown type' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
