// Questo è un file Node.js che Vercel eseguirà come una Serverless Function.
// Prende la richiesta dal frontend, usa la chiave API segreta e chiama Google.

export default async function handler(request, response) {
    // Controlla che la richiesta sia di tipo POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { type, data } = request.body;
    const apiKey = process.env.GEMINI_API_KEY; // Legge la chiave segreta dalle variabili d'ambiente di Vercel

    if (!apiKey) {
        return response.status(500).json({ message: 'API key not configured' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    let payload;

    // Costruisce il payload corretto in base al tipo di analisi richiesta dal frontend
    switch (type) {
        case 'analyzeFoodItem':
            payload = { contents: [{ role: "user", parts: [{ text: `Stima i grammi di lattosio in ${data.weight}g di "${data.name}". Considera la composizione tipica. Rispondi SOLO con un numero (es. "4.5"). Se l'alimento è tipicamente privo di lattosio, rispondi "0".` }] }] };
            break;
        case 'analyzeBaseDish':
            payload = {
                contents: [{ role: "user", parts: [{ text: `Analizza questo piatto base: "${data.name}" (${data.weight}g). Basandoti sulla ricetta tradizionale italiana, rispondi con un oggetto JSON che contiene: "estimatedLactose" (il lattosio del piatto base stesso, escludendo ingredienti extra) e "hiddenIngredients" (un array di massimo 2 ingredienti "nascosti" comuni con lattosio che un utente potrebbe dimenticare, es. burro per mantecare, panna in una salsa). Ogni oggetto in "hiddenIngredients" deve avere "name" e "estimatedGrams". Se non ci sono ingredienti nascosti comuni, l'array sarà vuoto. Sii conservativo.` }] }],
                generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "estimatedLactose": { "type": "NUMBER" }, "hiddenIngredients": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "name": { "type": "STRING" }, "estimatedGrams": { "type": "NUMBER" } } } } } } }
            };
            break;
        case 'getIngredientQuantity':
             payload = { contents: [{ role: "user", parts: [{ text: `Dato un piatto base come "${data.baseDish}", qual è una quantità realistica in grammi per l'ingrediente "${data.ingredientName}"? Rispondi SOLO con un numero (es. "80").` }] }] };
            break;
        case 'getBaseDishWeight':
             payload = { contents: [{ role: "user", parts: [{ text: `Analizza questo piatto: "${data.dishName}". Stima il suo peso standard in grammi per una singola porzione. Rispondi SOLO con un numero (es. "325" per "Pizza").` }] }] };
            break;
        default:
            return response.status(400).json({ message: 'Invalid analysis type' });
    }

    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const error = await geminiResponse.json();
            console.error("Gemini API Error:", error);
            return response.status(geminiResponse.status).json({ message: 'Error from Gemini API' });
        }

        const result = await geminiResponse.json();
        const textResult = result.candidates[0].content.parts[0].text;
        
        // Prepara la risposta corretta per il frontend
        let finalResponse;
        switch (type) {
             case 'analyzeFoodItem':
                finalResponse = { lactoseAmount: parseFloat(textResult.trim().replace(',', '.')) || 0 };
                break;
            case 'analyzeBaseDish':
                finalResponse = JSON.parse(textResult.replace(/```json\n?/, '').replace(/\n?```/, ''));
                break;
            case 'getIngredientQuantity':
                finalResponse = { quantity: parseFloat(textResult.trim()) || null };
                break;
            case 'getBaseDishWeight':
                 finalResponse = { weight: parseFloat(textResult.trim()) || null };
                break;
        }

        return response.status(200).json(finalResponse);

    } catch (error) {
        console.error('Server-side error:', error);
        return response.status(500).json({ message: 'Internal server error' });
    }
}