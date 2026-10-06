import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIService, ITriageRecommendation, IOcrMedicine } from './ai.interface';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { InternalServerError } from '../../utils/errors';

export class GeminiAIService implements IAIService {
  private genAI: GoogleGenerativeAI;
  private defaultModel = 'gemini-1.5-flash';

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  }

  public async recommendAppointmentDetails(symptoms: string): Promise<ITriageRecommendation> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
        You are an expert clinical triage AI assistant. Carefully analyze the provided patient symptoms: "${symptoms}".
        
        Evaluate the clinical urgency and determine:
        1. "recommendedDepartment": Choose the most appropriate department from:
           ["Cardiology", "Neurology", "Pediatrics", "General Medicine", "Orthopedics", "Dermatology", "Gastroenterology", "Ophthalmology", "Emergency", "ENT", "Pulmonology"]
        2. "priority": Urgency rating:
           - "Emergency" (critical/life-threatening symptoms like acute chest pain, stroke signs, severe hemorrhage, severe breathing difficulty)
           - "Priority" (acute discomfort, high fever, severe pain, possible fractures)
           - "Regular" (routine checkups, mild/subacute chronic symptoms, non-urgent consultation)
        3. "reasoning": A clear, professional medical explanation justifying the priority and department.
        4. "confidenceScore": A number from 0.0 to 1.0 indicating confidence in this triage recommendation.
        5. "potentialConditions": An array of 1 to 3 potential clinical conditions or differential diagnoses to investigate.
        6. "suggestedActions": Immediate non-invasive precautionary recommendations or questions to ask the patient upon arrival.
        7. "redFlags": Array of critical warning signs the patient should watch for that require immediate emergency room escalation.
        
        Return ONLY valid JSON matching this schema:
        {
          "recommendedDepartment": "string",
          "priority": "Regular" | "Priority" | "Emergency",
          "reasoning": "string",
          "confidenceScore": 0.95,
          "potentialConditions": ["string"],
          "suggestedActions": ["string"],
          "redFlags": ["string"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error: any) {
      logger.error('Gemini recommendAppointmentDetails error', error);
      throw new InternalServerError('AI recommendation engine failed');
    }
  }

  public async ocrPrescriptionImage(base64Image: string): Promise<IOcrMedicine[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.defaultModel,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const imageParts = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
      ];

      const prompt = `
        You are an expert medical transcription and OCR engine. Analyze this prescription image (handwritten or printed).
        Transcribe and interpret all prescribed medications accurately, converting standard medical abbreviations (e.g., OD, BD, TDS, QID, PRN, AC, PC, HS, SOS):
        
        For each medication, provide:
        - "name": Full medication name and formulation (e.g. "Amoxicillin 500mg Tablet")
        - "dosage": Amount to take per dose (e.g. "1 Tablet", "500mg", "10ml")
        - "timing": Translated timing instruction (e.g. "Morning & Night after food", "Once daily before breakfast", "When required for pain")
        - "duration": Duration of course (e.g. "5 Days", "1 Week", "Continuous")
        - "instructions": Any special cautionary notes (e.g. "Take with plenty of water", "Avoid alcohol", "Complete full antibiotic course")
        - "frequency": Standardized frequency tag (e.g. "Once Daily", "Twice Daily", "Three Times Daily", "As Needed")
        
        Return ONLY a JSON array of objects matching this schema:
        [
          {
            "name": "string",
            "dosage": "string",
            "timing": "string",
            "duration": "string",
            "instructions": "string",
            "frequency": "string"
          }
        ]
      `;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error: any) {
      logger.error('Gemini OCR error', error);
      throw new InternalServerError('Prescription OCR extraction failed');
    }
  }

  public async chatHealthAssistant(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.defaultModel,
        systemInstruction: `You are HospitalAI Health Assistant, an empathetic, accurate, and professional clinical triage guide.
Help patients understand symptoms, guide them to appropriate hospital departments, explain routine medical concepts in simple terms, and answer hospital service FAQs.
Always prioritize patient safety. If severe red flags are described (chest pain, stroke symptoms, uncontrolled bleeding, severe trauma), advise calling emergency services immediately.
Always end your guidance with a clear, concise medical disclaimer: "Disclaimer: I am an AI health assistant. This information does not replace professional medical diagnosis or treatment."`,
      });

      const chatHistory = history.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      logger.error('Gemini chatbot error', error);
      throw new InternalServerError('Health chatbot failed to respond');
    }
  }
}

