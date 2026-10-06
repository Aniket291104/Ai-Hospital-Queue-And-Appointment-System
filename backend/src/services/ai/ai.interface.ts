export interface ITriageRecommendation {
  recommendedDepartment: string;
  priority: 'Regular' | 'Priority' | 'Emergency';
  reasoning: string;
  confidenceScore?: number;
  potentialConditions?: string[];
  suggestedActions?: string[];
  redFlags?: string[];
}

export interface IOcrMedicine {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  instructions?: string;
  frequency?: string;
}

export interface IAIService {
  recommendAppointmentDetails(symptoms: string): Promise<ITriageRecommendation>;
  ocrPrescriptionImage(base64Image: string): Promise<IOcrMedicine[]>;
  chatHealthAssistant(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<string>;
}

