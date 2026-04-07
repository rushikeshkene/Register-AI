import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. AI features will be limited.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function explainComponent(componentType: string, details: string, lang: 'en' | 'mr' = 'en') {
  const prompt = lang === 'en' 
    ? `Explain what a ${componentType} is and how it works. Details: ${details}. Make it simple for students.`
    : `एका ${componentType} बद्दल माहिती द्या आणि ते कसे कार्य करते ते सांगा. तपशील: ${details}. विद्यार्थ्यांसाठी सोप्या भाषेत सांगा.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI explanation unavailable.";
  }
}

export async function analyzeImage(base64Image: string, lang: 'en' | 'mr' = 'en') {
  const prompt = lang === 'en'
    ? "Analyze this image of an electronic component. Identify the component type (e.g., Resistor, Capacitor, Diode). If it's a resistor, identify the color bands and calculate its resistance value. If the component looks damaged, mention it."
    : "या इलेक्ट्रॉनिक घटकाच्या प्रतिमेचे विश्लेषण करा. घटकाचा प्रकार ओळखा (उदा. रोधक, कपॅसिटर, डायोड). जर तो रोधक असेल, तर त्याचे रंग पट्टे ओळखा आणि त्याचे मूल्य मोजा. जर घटक खराब झालेला दिसत असेल, तर तसे नमूद करा.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
      ],
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return null;
  }
}

export async function suggestReplacement(componentType: string, value: string, damageDescription: string, lang: 'en' | 'mr' = 'en') {
  const prompt = lang === 'en'
    ? `The following ${componentType} with value ${value} is damaged (${damageDescription}). Suggest a suitable replacement component and explain why it's a good fit. Also mention any precautions.`
    : `खालील ${componentType} (मूल्य: ${value}) खराब झाला आहे (${damageDescription}). कृपया योग्य पर्यायी घटक सुचवा आणि तो का योग्य आहे ते सांगा. तसेच काही खबरदारीचे उपाय सांगा.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Replacement Suggestion Error:", error);
    return "Replacement suggestion unavailable.";
  }
}
