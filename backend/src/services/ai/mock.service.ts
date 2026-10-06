import { IAIService, ITriageRecommendation, IOcrMedicine } from './ai.interface';

export class MockAIService implements IAIService {
  public async recommendAppointmentDetails(symptoms: string): Promise<ITriageRecommendation> {
    const text = symptoms.toLowerCase();

    if (
      text.includes('chest pain') ||
      text.includes('heart') ||
      text.includes('breathless') ||
      text.includes('shortness of breath') ||
      text.includes('cardiac')
    ) {
      return {
        recommendedDepartment: 'Cardiology',
        priority: 'Emergency',
        reasoning: `Emergency triage: Potential acute cardiovascular or respiratory distress identified from symptoms ("${symptoms.substring(0, 50)}..."). Urgent evaluation recommended.`,
        confidenceScore: 0.94,
        potentialConditions: ['Acute Coronary Syndrome', 'Angina Pectoris', 'Arrhythmia'],
        suggestedActions: ['Keep patient calm and seated', 'Check vitals immediately (BP, SpO2, Pulse)', 'Prepare ECG machine'],
        redFlags: ['Radiating pain to left arm or jaw', 'Dizziness or syncope', 'Cold sweats or nausea'],
      };
    }

    if (
      text.includes('headache') ||
      text.includes('migraine') ||
      text.includes('seizure') ||
      text.includes('numbness') ||
      text.includes('dizziness')
    ) {
      return {
        recommendedDepartment: 'Neurology',
        priority: text.includes('seizure') || text.includes('numbness') ? 'Emergency' : 'Priority',
        reasoning: `Neurological evaluation suggested for reported cephalic or neurological discomfort ("${symptoms.substring(0, 50)}...").`,
        confidenceScore: 0.89,
        potentialConditions: ['Migraine with Aura', 'Tension Headache', 'Transient Neurological Event'],
        suggestedActions: ['Rest in a quiet, dimly lit room', 'Check blood pressure', 'Document symptom onset duration'],
        redFlags: ['Sudden thunderclap headache', 'Weakness on one side of body', 'Slurred speech'],
      };
    }

    if (
      text.includes('rash') ||
      text.includes('skin') ||
      text.includes('itch') ||
      text.includes('acne') ||
      text.includes('allergy')
    ) {
      return {
        recommendedDepartment: 'Dermatology',
        priority: 'Regular',
        reasoning: `Dermatological assessment recommended for cutaneous signs and skin manifestations ("${symptoms.substring(0, 50)}...").`,
        confidenceScore: 0.91,
        potentialConditions: ['Contact Dermatitis', 'Urticaria / Allergy', 'Eczema'],
        suggestedActions: ['Avoid scratching affected areas', 'Do not apply unprescribed topical steroids', 'Keep the skin clean and dry'],
        redFlags: ['Rapidly spreading rash with high fever', 'Swelling of lips, tongue, or throat'],
      };
    }

    if (
      text.includes('bone') ||
      text.includes('fracture') ||
      text.includes('joint') ||
      text.includes('knee') ||
      text.includes('back pain') ||
      text.includes('sprain')
    ) {
      return {
        recommendedDepartment: 'Orthopedics',
        priority: text.includes('fracture') ? 'Emergency' : 'Priority',
        reasoning: `Orthopedic evaluation recommended for musculoskeletal pain or mobility limitation ("${symptoms.substring(0, 50)}...").`,
        confidenceScore: 0.92,
        potentialConditions: ['Musculoskeletal Strain', 'Osteoarthritis', 'Ligament / Tendon Sprain'],
        suggestedActions: ['Immobilize painful limb or joint', 'Apply cold compress if acute injury', 'Avoid weight bearing'],
        redFlags: ['Visible bone deformity', 'Inability to bear any weight', 'Numbness or loss of distal pulse'],
      };
    }

    if (
      text.includes('stomach') ||
      text.includes('abdominal') ||
      text.includes('nausea') ||
      text.includes('vomit') ||
      text.includes('diarrhea') ||
      text.includes('acidity')
    ) {
      return {
        recommendedDepartment: 'Gastroenterology',
        priority: text.includes('severe') || text.includes('blood') ? 'Emergency' : 'Priority',
        reasoning: `Gastrointestinal consultation indicated based on reported digestive or abdominal complaints ("${symptoms.substring(0, 50)}...").`,
        confidenceScore: 0.88,
        potentialConditions: ['Acute Gastroenteritis', 'Gastritis / Peptic Ulcer Disease', 'Biliary Colic'],
        suggestedActions: ['Maintain oral hydration with electrolyte solutions', 'Avoid spicy or heavy foods', 'Monitor bowel movements'],
        redFlags: ['Vomiting blood or coffee-ground material', 'Black tarry stools', 'Rigid or guarded abdomen'],
      };
    }

    if (text.includes('child') || text.includes('baby') || text.includes('infant') || text.includes('kid')) {
      return {
        recommendedDepartment: 'Pediatrics',
        priority: text.includes('high fever') || text.includes('lethargic') ? 'Emergency' : 'Priority',
        reasoning: `Pediatric consultation indicated for pediatric patient with symptoms ("${symptoms.substring(0, 50)}...").`,
        confidenceScore: 0.93,
        potentialConditions: ['Pediatric Viral Infection', 'Upper Respiratory Tract Infection', 'Febrile Illness'],
        suggestedActions: ['Monitor child temperature every 2-3 hours', 'Ensure adequate fluid intake', 'Keep comfortable clothing'],
        redFlags: ['Lethargy or unresponsiveness', 'High continuous fever >39°C (102.2°F)', 'Rapid shallow breathing'],
      };
    }

    return {
      recommendedDepartment: 'General Medicine',
      priority: 'Regular',
      reasoning: `General clinical evaluation recommended for comprehensive screening of reported symptoms: "${symptoms.substring(0, 60)}".`,
      confidenceScore: 0.85,
      potentialConditions: ['Viral Syndrome', 'General Malaise', 'Routine Clinical Assessment'],
      suggestedActions: ['Keep record of symptom timeline and temperature', 'Rest and hydrate adequately'],
      redFlags: ['Persistent high fever over 3 days', 'Difficulty breathing or sudden chest discomfort'],
    };
  }

  public async ocrPrescriptionImage(base64Image: string): Promise<IOcrMedicine[]> {
    return [
      {
        name: 'Amoxicillin & Clavulanate Potassium (Augmentin 625mg)',
        dosage: '625mg (1 Tablet)',
        timing: 'Twice daily after meals (Morning & Night)',
        duration: '5 Days',
        instructions: 'Complete the entire course even if feeling better. Take with water after food.',
        frequency: 'Twice Daily (BD)',
      },
      {
        name: 'Paracetamol (Dolo 650mg)',
        dosage: '650mg (1 Tablet)',
        timing: 'Every 6-8 hours as needed (SOS)',
        duration: '3 Days',
        instructions: 'Take only when fever exceeds 100°F or severe body pain occurs. Maximum 3 tabs/day.',
        frequency: 'As Needed (PRN / SOS)',
      },
      {
        name: 'Pantoprazole 40mg Tablet',
        dosage: '40mg (1 Tablet)',
        timing: 'Once daily in the morning (30 mins before breakfast)',
        duration: '5 Days',
        instructions: 'Take with half glass of water before food to reduce gastric irritation.',
        frequency: 'Once Daily (OD / AC)',
      },
    ];
  }

  public async chatHealthAssistant(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<string> {
    const text = message.toLowerCase();
    let response = '';

    if (text.includes('appointment') || text.includes('book') || text.includes('queue')) {
      response = `You can easily book an appointment or check in to our live queue! Go to the **Patient Portal** and select **Book Appointment** or **AI Smart Triage** to get routed to the right specialist with real-time wait estimation.`;
    } else if (text.includes('headache') || text.includes('fever') || text.includes('pain')) {
      response = `For mild symptoms like fever or headache, rest well and stay hydrated. If your fever stays high (>102°F) or headache is severe, please visit our **General Medicine** or **Emergency** department for direct doctor consultation.`;
    } else {
      response = `Hello! I am your **HospitalAI Health Assistant**. I can help guide you through our medical departments, explain prescription details, or assist with hospital queue management. How can I assist your health journey today?`;
    }

    return `${response}\n\n*Disclaimer: I am an AI health assistant. This information does not replace professional medical advice, diagnosis, or treatment.*`;
  }
}

