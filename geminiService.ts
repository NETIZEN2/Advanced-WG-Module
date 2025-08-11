import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A cool, military-style name for the entity." },
    description: { type: Type.STRING, description: "A brief, one-paragraph description of the entity's role and capabilities." },
    sensors: {
      type: Type.ARRAY,
      description: "A list of 2-3 appropriate sensor systems.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Sensor name (e.g., 'AN/SPY-6(V)1')." },
          type: { type: Type.STRING, enum: ['Radar', 'Sonar', 'IRST', 'SIGINT', 'ESM', 'Other'], description: "The type of sensor." },
          range: {
            type: Type.OBJECT,
            properties: {
              value: { type: Type.NUMBER, description: "The sensor's maximum detection range." },
              unit: { type: Type.STRING, enum: ['km', 'nm'], description: "The unit for the range." },
            },
          },
        },
      },
    },
    weapons: {
      type: Type.ARRAY,
      description: "A list of 2-3 appropriate weapon systems.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Weapon name (e.g., 'RIM-162 ESSM')." },
          type: { type: Type.STRING, enum: ['Missile', 'Gun', 'Torpedo', 'Bomb', 'Other'], description: "The type of weapon." },
          range: {
            type: Type.OBJECT,
            properties: {
              value: { type: Type.NUMBER, description: "The weapon's maximum effective range." },
              unit: { type: Type.STRING, enum: ['km', 'nm'], description: "The unit for the range." },
            },
          },
          maxQuantity: { type: Type.NUMBER, description: "Typical number of this weapon carried." },
        },
      },
    },
  },
};

export const suggestEntityDetails = async (entityType: string, entityName: string): Promise<any> => {
  const prompt = `Based on the entity name "${entityName}" which is a type of "${entityType}", generate a plausible set of characteristics, sensors, and weapons.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
          parts: [{ text: prompt }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate entity details from AI.");
  }
};
