'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { Menu, X, Upload, Activity, FileText, Loader2, Eye, Trash2, Plus, Check, Edit, ShieldAlert, Sparkles } from 'lucide-react';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  // AI Triage
  const [symptoms, setSymptoms] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRec, setAiRec] = useState<any>(null);
  const [bookingPriority, setBookingPriority] = useState('Regular');

  // Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prescriptions'>('dashboard');

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  // OCR state
  const [ocrImageBase64, setOcrImageBase64] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [editingMedicines, setEditingMedicines] = useState<any[]>([]);
  const [editingInstructions, setEditingInstructions] = useState('');

  // QR Check-in Mock
  const [qrOpen, setQrOpen] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  // Specialists Directory States
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [selectedDetailDoctor, setSelectedDetailDoctor] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch base data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchAppointments();
    fetchHospitals();
    fetchAllDoctors();
    fetchPrescriptions();
  }, [user]);

  // Socket for live queue updates
  useEffect(() => {
    const socket = io('http://localhost:5000');

    appointments.forEach((appt) => {
      if (appt.status === 'CheckedIn' && appt.doctor?._id) {
        socket.on(`queue-update-${appt.doctor._id}`, (updatedQueue) => {
          const queueUser = updatedQueue.patients.find((p: any) => p.user === user?.id);
          if (queueUser) {
            toast.success(`Queue position updated! You are now position: ${queueUser.position}`);
            fetchAppointments();
          }
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [appointments]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading, chatOpen]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data.data);
    } catch (err) {
      console.error('Failed to fetch appointments');
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/hospitals');
      setHospitals(response.data.data);
    } catch (err) {
      console.error('Failed to fetch hospitals');
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setAllDoctors(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch all doctors');
    }
  };

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const response = await api.get('/prescriptions');
      setPrescriptions(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch prescriptions');
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const selectDoctorFromDirectory = async (doc: any) => {
    setSelectedHospital(doc.hospital?._id || '');
    setSelectedDepartment(doc.department?._id || '');
    
    try {
      const deptRes = await api.get(`/hospitals/${doc.hospital?._id}/departments`);
      setDepartments(deptRes.data.data || []);
      
      const docRes = await api.get(`/doctors?hospital=${doc.hospital?._id}&department=${doc.department?._id}`);
      setDoctors(docRes.data.data || []);
      
      setSelectedDoctor(doc._id);
      toast.success(`Selected Dr. ${doc.user?.firstName} in booking form!`);
    } catch (err) {
      toast.error('Failed to prefill booking details');
    }
  };

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospital(hospitalId);
    setSelectedDepartment('');
    setSelectedDoctor('');
    try {
      const response = await api.get(`/hospitals/${hospitalId}/departments`);
      const deptList = response.data.data || [];
      setDepartments(deptList);

      if (aiRec?.recommendedDepartment && deptList.length > 0) {
        const match = deptList.find((d: any) => 
          d.name.toLowerCase().includes(aiRec.recommendedDepartment.toLowerCase()) ||
          aiRec.recommendedDepartment.toLowerCase().includes(d.name.toLowerCase())
        );
        if (match) {
          setSelectedDepartment(match._id);
          const docRes = await api.get(`/doctors?hospital=${hospitalId}&department=${match._id}`);
          setDoctors(docRes.data.data || []);
          toast.success(`Automatically selected recommended department: ${match.name}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDepartment(deptId);
    setSelectedDoctor('');
    try {
      const response = await api.get(`/doctors?hospital=${selectedHospital}&department=${deptId}`);
      setDoctors(response.data.data);
    } catch (err) {
      console.error('Failed to fetch doctors');
    }
  };

  const handleTriage = async () => {
    if (!symptoms) return;
    setAiLoading(true);
    try {
      const response = await api.post('/ai/triage', { symptoms });
      const rec = response.data.data;
      setAiRec(rec);
      setBookingPriority(rec.priority || 'Regular');
      toast.success('AI Triage recommendation loaded!');

      if (departments.length > 0 && rec.recommendedDepartment) {
        const match = departments.find(d => 
          d.name.toLowerCase().includes(rec.recommendedDepartment.toLowerCase()) ||
          rec.recommendedDepartment.toLowerCase().includes(d.name.toLowerCase())
        );
        if (match) {
          setSelectedDepartment(match._id);
          const docRes = await api.get(`/doctors?hospital=${selectedHospital}&department=${match._id}`);
          setDoctors(docRes.data.data || []);
          toast.success(`Automatically selected recommended department: ${match.name}`);
        }
      }
    } catch (err) {
      toast.error('AI Triage request failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor,
        hospitalId: selectedHospital,
        departmentId: selectedDepartment,
        date,
        timeSlot,
        symptoms,
        priority: bookingPriority,
        aiRecommendation: aiRec ? {
          suggestedDoctor: aiRec.recommendedDepartment,
          priorityReasoning: aiRec.reasoning,
        } : undefined,
      });
      toast.success('Appointment booked successfully!');
      fetchAppointments();
      setSelectedHospital('');
      setDepartments([]);
      setDoctors([]);
      setDate('');
      setTimeSlot('');
      setSymptoms('');
      setAiRec(null);
      setBookingPriority('Regular');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed');
    }
  };

  const handlePayment = async (apptId: string, amount: number) => {
    try {
      const orderRes = await api.post('/payments/order', {
        appointmentId: apptId,
        amount: amount || 500,
      });
      
      await api.post('/payments/verify', {
        razorpayOrderId: orderRes.data.orderId,
      });

      toast.success('Payment completed successfully!');
      fetchAppointments();
    } catch (err) {
      toast.error('Payment processing failed');
    }
  };

  const handleCheckIn = async (apptId: string) => {
    try {
      await api.post('/queues/check-in', { appointmentId: apptId });
      toast.success('Checked in successfully! You are now in the live queue.');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const msg = chatMessage;
    const newHistory = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(newHistory);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: msg,
        history: newHistory,
      });
      setChatHistory([...newHistory, { role: 'model', content: response.data.data }]);
    } catch (err) {
      toast.error('Chat bot failed to reply');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectSuggestion = async (text: string) => {
    const newHistory = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: text,
        history: newHistory,
      });
      setChatHistory([...newHistory, { role: 'model', content: response.data.data }]);
    } catch (err) {
      toast.error('Chat bot failed to reply');
    } finally {
      setChatLoading(false);
    }
  };

  const handlePrescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setOcrImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePatientRunOcr = async () => {
    if (!ocrImageBase64) {
      toast.error('Please upload an image first');
      return;
    }
    setOcrLoading(true);
    setEditingMedicines([]);
    setEditingInstructions('');
    try {
      const res = await api.post('/ai/ocr', { image: ocrImageBase64 });
      const prescription = res.data.data;
      setEditingMedicines(prescription.medicines || []);
      setEditingInstructions(prescription.instructions || 'Extracted automatically via OCR.');
      setEditingPrescriptionId(prescription._id);
      toast.success('OCR analysis complete! You can now edit the medicines below.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OCR request failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const updateMedicineRow = (index: number, field: string, value: string) => {
    setEditingMedicines(prev => prev.map((med, idx) => {
      if (idx === index) {
        return { ...med, [field]: value };
      }
      return med;
    }));
  };

  const deleteMedicineRow = (index: number) => {
    setEditingMedicines(prev => prev.filter((_, idx) => idx !== index));
  };

  const addMedicineRow = () => {
    setEditingMedicines(prev => [...prev, { name: '', dosage: '', timing: '', duration: '' }]);
  };

  const handleSavePrescription = async () => {
    if (editingMedicines.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }
    try {
      if (editingPrescriptionId) {
        await api.put(`/prescriptions/${editingPrescriptionId}`, {
          medicines: editingMedicines,
          instructions: editingInstructions,
        });
        toast.success('Prescription updated and saved successfully!');
      } else {
        await api.post('/prescriptions', {
          medicines: editingMedicines,
          instructions: editingInstructions,
        });
        toast.success('Prescription saved successfully!');
      }
      setOcrImageBase64('');
      setEditingPrescriptionId(null);
      setEditingMedicines([]);
      setEditingInstructions('');
      fetchPrescriptions();
    } catch (err) {
      toast.error('Failed to save prescription');
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      toast.success('Prescription deleted successfully');
      fetchPrescriptions();
    } catch (err) {
      toast.error('Failed to delete prescription');
    }
  };

  const loadPrescriptionForEditing = (pres: any) => {
    setEditingPrescriptionId(pres._id);
    setEditingMedicines(pres.medicines || []);
    setEditingInstructions(pres.instructions || '');
    setOcrImageBase64(pres.imageUrl || '');
    setActiveTab('prescriptions');
    toast.success('Loaded prescription for editing!');
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex">
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 shrink-0 bg-card border-r border-border p-6 flex flex-col justify-between fixed md:sticky inset-y-0 left-0 z-50 md:z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:flex shadow-xl md:shadow-none`}>
        <div>
          <div className="flex justify-between items-center mb-8">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              HospitalAI
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-secondary rounded-lg border text-muted-foreground flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-2">
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setChatOpen(false);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard' && !chatOpen
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-secondary text-muted-foreground'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => {
                setActiveTab('prescriptions');
                setChatOpen(false);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'prescriptions' && !chatOpen
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-secondary text-muted-foreground'
              }`}
            >
              My Prescriptions & OCR
            </button>
            <button 
              onClick={() => {
                setChatOpen(true);
                setIsSidebarOpen(false);
              }} 
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                chatOpen 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-secondary text-muted-foreground'
              }`}
            >
              AI Chat Assistant
            </button>
          </nav>
        </div>
        <div>
          <div className="text-xs text-muted mb-4">Logged in as {user?.firstName}</div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 border border-border hover:bg-red-500/10 hover:text-red-500 text-sm font-semibold rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto w-full no-scrollbar">
        <div className="max-w-5xl mx-auto w-full p-6 md:p-10 flex-grow space-y-8">
          {/* Welcome Banner */}
          <header className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-secondary rounded-xl border border-border flex items-center justify-center cursor-pointer text-muted-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {user?.firstName}!</h1>
                <p className="text-muted text-xs sm:text-sm mt-1">Smart Queue. Better Care.</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="md:hidden py-1 px-3 border border-border hover:bg-red-500/10 hover:text-red-500 text-xs font-semibold rounded-lg"
            >
              Logout
            </button>
          </header>

        {activeTab === 'dashboard' ? (
          <>
        {/* Live Queue status cards for patient */}
        {appointments.some((appt) => appt.status === 'CheckedIn') && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {appointments
              .filter((appt) => appt.status === 'CheckedIn')
              .map((appt) => (
                <div key={appt._id} className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-blue-100">Live Consultation</p>
                      <h4 className="font-bold text-lg">Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-xs uppercase font-bold tracking-wider">
                      {appt.queueToken}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                    <div>
                      <span className="text-[10px] text-blue-100 block">Queue Position</span>
                      <span className="text-2xl font-bold">{appt.queuePosition}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-100 block">Est. Wait Time</span>
                      <span className="text-2xl font-bold">{appt.estimatedWaitingTime}m</span>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-blue-100 font-semibold">
                      <span>Live Queue Progress</span>
                      <span>{appt.queuePosition > 1 ? `${appt.queuePosition - 1} patients ahead` : 'Next in line!'}</span>
                    </div>
                    <div className="w-full bg-white/25 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.max(10, Math.min(100, 100 - (appt.queuePosition * 15)))}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* Medical Specialists Directory */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#2C3137]">Featured Medical Specialists</h3>
              <p className="text-xs text-muted-foreground font-semibold">Browse our clinical experts, specializations, and availability slots</p>
            </div>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search specialists by name or department..."
                value={searchDoctorQuery}
                onChange={(e) => setSearchDoctorQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
              <span className="absolute left-3 top-2 text-muted-foreground text-xs">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allDoctors
              .filter((d: any) => 
                !searchDoctorQuery ||
                `${d.user?.firstName} ${d.user?.lastName}`.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                d.specialization?.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                d.department?.name?.toLowerCase().includes(searchDoctorQuery.toLowerCase())
              )
              .map((d: any) => (
                <div key={d._id} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {d.user?.firstName?.[0] || 'D'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#2C3137]">Dr. {d.user?.firstName} {d.user?.lastName}</h4>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[#6AB8FF] text-[9px] font-extrabold uppercase tracking-wide">
                            {d.specialization}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-500">⭐ {d.rating || '4.8'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {d.bio || 'Experienced consultant specialist dedicated to patient health and welfare.'}
                    </p>
                  </div>

                  <div className="border-t border-border/60 pt-3 flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
                    <span className="bg-secondary/40 px-2 py-1 rounded-md">💼 {d.experience} Yrs Exp</span>
                    <span className="bg-secondary/40 px-2 py-1 rounded-md">💳 INR {d.fees}</span>
                    <span className="bg-secondary/40 px-2 py-1 rounded-md">🏥 {d.hospital?.name}</span>
                  </div>

                  <button 
                    onClick={() => setSelectedDetailDoctor(d)}
                    className="w-full py-2 bg-[#6AB8FF]/10 hover:bg-[#6AB8FF] text-[#6AB8FF] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    View Detailing & Schedule
                  </button>
                </div>
              ))}
          </div>
        </section>

        {/* Appointment Booking Panel */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xl font-bold mb-2">Book Appointment</h3>

            {/* AI Triage Help */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-blue-500 uppercase tracking-wide">AI Triage Symptom Advisor</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms: e.g. I have fever, body aches and a bad headache since morning."
                rows={2}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTriage}
                disabled={aiLoading}
                className="py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing...' : 'Get AI Recommendation'}
              </button>

              {aiRec && (
                <div className="bg-background border border-border/80 p-3 rounded-lg text-xs space-y-1.5 mt-2 animate-fade-in">
                  <p><strong>Department:</strong> {aiRec.recommendedDepartment}</p>
                  <p><strong>Priority:</strong> <span className="font-bold text-red-500">{aiRec.priority}</span></p>
                  <p className="text-muted leading-relaxed"><strong>Reason:</strong> {aiRec.reasoning}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleBook} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Select Hospital</label>
                <select
                  required
                  value={selectedHospital}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Choose Hospital</option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedHospital && (
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Select Department</label>
                  <select
                    required
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Choose Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedDepartment && (
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Select Doctor</label>
                  <select
                    required
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Choose Doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.user?.firstName} {d.user?.lastName} (INR {d.fees})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Triage Priority (AI Recommended or Custom)</label>
                <select
                  required
                  value={bookingPriority}
                  onChange={(e) => setBookingPriority(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm font-semibold"
                >
                  <option value="Regular">Regular (Normal check)</option>
                  <option value="Priority">Priority (Faster check)</option>
                  <option value="Emergency">Emergency (Immediate care)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Time Slot</label>
                  <select
                    required
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Slot</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
              >
                Confirm Booking
              </button>
            </form>
          </div>

          {/* Booked Appointments Listing */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">My Bookings</h3>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px] pr-2">
              {appointments.length === 0 ? (
                <p className="text-sm text-muted text-center py-10">No bookings yet.</p>
              ) : (
                appointments.map((appt) => (
                  <div key={appt._id} className="p-4 border border-border/80 rounded-xl bg-background/50 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted">
                          {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase tracking-wider ${
                          appt.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                          appt.status === 'Approved' ? 'bg-blue-500/10 text-blue-500' :
                          appt.status === 'CheckedIn' ? 'bg-indigo-500/10 text-indigo-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mt-1">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{appt.hospital?.name} • {appt.department?.name}</p>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-border/40 pt-3">
                      {appt.paymentStatus === 'Pending' && (
                        <button
                          onClick={() => handlePayment(appt._id, appt.doctor?.fees)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Pay INR {appt.doctor?.fees || 500}
                        </button>
                      )}
                      {appt.paymentStatus === 'Paid' && appt.status === 'Approved' && (
                        <button
                          onClick={() => handleCheckIn(appt._id)}
                          className="px-3 py-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      {appt.paymentStatus === 'Paid' && (
                        <a
                          href={`http://localhost:5000/api/payments/invoice/${appt._id}`}
                          className="px-3 py-1 border border-border hover:bg-secondary text-xs font-semibold rounded text-center"
                        >
                          Invoice PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
          </>
        ) : (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-[#2C3137]">My Medical Prescriptions</h3>
              <p className="text-xs text-muted-foreground font-semibold">Digitize and manage your prescriptions using Google Gemini OCR or add them manually.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: OCR Scanner & Editor */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h4 className="text-sm font-extrabold text-[#2C3137]">Prescription Scanner & Editor</h4>
                    <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">Gemini Vision</span>
                  </div>

                  {/* Image Upload Area */}
                  <div className="border-2 border-dashed border-[#DAE3EE] hover:border-[#6AB8FF]/50 transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 bg-[#DAE3EE]/10 cursor-pointer min-h-[160px] relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePrescriptionFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-8 h-8 text-[#7C7C7C]" />
                    <div>
                      <p className="text-xs font-bold text-gray-700">Choose prescription file or drag here</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">Supports PNG, JPG, JPEG</p>
                    </div>
                  </div>

                  {ocrImageBase64 && (
                    <div className="mt-4 p-3 bg-[#DAE3EE]/20 rounded-xl flex items-center justify-between border">
                      <div className="flex items-center gap-2.5">
                        <img src={ocrImageBase64} alt="Preview" className="w-10 h-10 object-cover rounded-lg border shadow-sm" />
                        <span className="text-[11px] font-bold text-gray-700">Prescription image selected</span>
                      </div>
                      <button 
                        onClick={() => {
                          setOcrImageBase64('');
                          setEditingPrescriptionId(null);
                        }}
                        className="text-[10px] text-red-500 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {ocrImageBase64 && !editingPrescriptionId && (
                    <button
                      disabled={ocrLoading}
                      onClick={handlePatientRunOcr}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white font-bold rounded-xl shadow-sm text-xs disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {ocrLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Analyzing with Gemini Vision...
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          Extract prescription details
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Editor Area (for parsed or manual entry) */}
                {(editingMedicines.length > 0 || editingPrescriptionId) && (
                  <div className="space-y-4 pt-4 border-t mt-4">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-extrabold text-[#7C7C7C] uppercase tracking-wider">Medicines & Dosage List</h5>
                      <button
                        onClick={addMedicineRow}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#6AB8FF] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Row
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-[250px] border rounded-xl bg-background/50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-secondary/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="p-2">Medicine Name</th>
                            <th className="p-2">Dosage</th>
                            <th className="p-2">Timing</th>
                            <th className="p-2">Duration</th>
                            <th className="p-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingMedicines.map((m, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-[#DAE3EE]/10">
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={(e) => updateMedicineRow(i, 'name', e.target.value)}
                                  className="w-full p-1 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded"
                                  placeholder="e.g. Paracetamol"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={m.dosage}
                                  onChange={(e) => updateMedicineRow(i, 'dosage', e.target.value)}
                                  className="w-full p-1 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded"
                                  placeholder="e.g. 500mg"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={m.timing}
                                  onChange={(e) => updateMedicineRow(i, 'timing', e.target.value)}
                                  className="w-full p-1 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded"
                                  placeholder="e.g. Morning, Night"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={m.duration}
                                  onChange={(e) => updateMedicineRow(i, 'duration', e.target.value)}
                                  className="w-full p-1 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded"
                                  placeholder="e.g. 5 days"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  onClick={() => deleteMedicineRow(i)}
                                  className="p-1 hover:bg-red-500/10 text-red-500 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#7C7C7C] uppercase tracking-wider">Instructions & Notes</label>
                      <textarea
                        value={editingInstructions}
                        onChange={(e) => setEditingInstructions(e.target.value)}
                        rows={2}
                        className="w-full p-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Additional notes about timing, meals, or side effects..."
                      />
                    </div>

                    <button
                      onClick={handleSavePrescription}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Save Prescription to Profile
                    </button>
                  </div>
                )}

                {editingMedicines.length === 0 && !editingPrescriptionId && (
                  <button
                    onClick={() => setEditingMedicines([{ name: '', dosage: '', timing: '', duration: '' }])}
                    className="w-full py-2.5 border border-border hover:bg-secondary text-xs font-bold rounded-xl mt-4 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Enter Prescription Details Manually
                  </button>
                )}
              </div>

              {/* Right Column: History of saved prescriptions */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4 flex flex-col h-[500px]">
                <h4 className="text-sm font-extrabold text-[#2C3137] border-b pb-3 mb-2">My Saved Prescriptions ({prescriptions.length})</h4>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {prescriptionsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-xs text-muted">Loading prescriptions...</p>
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-semibold flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-gray-300" />
                      <p className="text-xs">No prescriptions saved yet.</p>
                      <p className="text-[10px] text-gray-400">Use the scanner on the left to digitize your first prescription!</p>
                    </div>
                  ) : (
                    prescriptions.map((pres) => (
                      <div key={pres._id} className="p-4 border border-border/80 rounded-2xl bg-background/50 hover:border-primary/30 transition-all space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block">Digitized On {new Date(pres.createdAt).toLocaleDateString()}</span>
                            {pres.appointment?.doctor ? (
                              <h5 className="font-extrabold text-sm text-[#2C3137]">Dr. {pres.appointment.doctor.user?.firstName} {pres.appointment.doctor.user?.lastName}</h5>
                            ) : (
                              <h5 className="font-extrabold text-sm text-gray-600">Personal / OCR Upload</h5>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => loadPrescriptionForEditing(pres)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Edit prescription"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePrescription(pres._id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Delete prescription"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto border rounded-lg bg-background/80">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b bg-secondary/30 font-bold text-gray-500">
                                <th className="p-1.5">Medicine</th>
                                <th className="p-1.5">Dosage</th>
                                <th className="p-1.5">Timing</th>
                                <th className="p-1.5">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pres.medicines?.map((m: any, idx: number) => (
                                <tr key={idx} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                                  <td className="p-1.5 font-bold text-gray-700">{m.name}</td>
                                  <td className="p-1.5 text-gray-600">{m.dosage}</td>
                                  <td className="p-1.5 text-gray-500">{m.timing}</td>
                                  <td className="p-1.5 text-gray-600 font-semibold">{m.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {pres.instructions && (
                          <div className="text-[10px] bg-secondary/50 p-2.5 rounded-xl text-gray-600 border border-border/30">
                            <p className="font-bold text-gray-400 uppercase tracking-wider text-[8px] mb-0.5">Instructions</p>
                            <p className="font-semibold leading-relaxed">{pres.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <footer className="w-full flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground pt-6 border-t border-border gap-4 mt-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-extrabold text-[#2C3137]">Hospital ERP v1.0.0 • Patient Console</span>
            <span className="hidden sm:inline opacity-30">|</span>
            <span className="font-semibold">&copy; {new Date().getFullYear()} HospitalAI Inc.</span>
          </div>
          <div className="flex gap-6 font-bold text-[#6AB8FF]">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Support</a>
          </div>
        </footer>
      </main>

      {/* Floating Chat Box */}
      {chatOpen ? (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50">
          <div className="p-4 bg-primary text-primary-foreground font-bold flex justify-between items-center">
            <span>AI Health Assistant</span>
            <button onClick={() => setChatOpen(false)} className="text-white hover:text-white/80 font-bold">×</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[400px]">
            <p className="text-[10px] text-muted italic bg-secondary p-2 rounded">
              Disclaimer: Not medical advice. For triage & guidance only.
            </p>
            {chatHistory.map((ch, i) => (
              <div key={i} className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2.5 rounded-lg text-sm max-w-[80%] leading-relaxed ${
                  ch.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-secondary text-foreground rounded-tl-none'
                }`}>
                  {ch.content}
                </div>
              </div>
            ))}
            {chatLoading && <div className="text-xs text-muted animate-pulse">Assistant typing...</div>}

            {chatHistory.length === 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "I have a high fever & headache",
                    "Which department handles joint pain?",
                    "How to check-in for appointment?",
                    "Need guidance on heart palpitations"
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className="text-[10px] bg-secondary hover:bg-primary/10 text-gray-700 hover:text-primary px-2.5 py-1 rounded-full border border-border/85 transition-all text-left font-semibold cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendChatMessage} className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask anything about health or departments..."
              className="flex-1 p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="py-2 px-3 bg-primary text-primary-foreground font-semibold rounded-lg text-sm">Send</button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all text-2xl cursor-pointer"
        >
          💬
        </button>
      )}

      {/* Doctor Deep Detailing Modal */}
      {selectedDetailDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
            <button 
              onClick={() => setSelectedDetailDoctor(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground text-xl font-bold cursor-pointer"
            >
              ×
            </button>

            <div className="flex gap-4 items-start border-b border-border pb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                {selectedDetailDoctor.user?.firstName?.[0] || 'D'}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-foreground">
                  Dr. {selectedDetailDoctor.user?.firstName} {selectedDetailDoctor.user?.lastName}
                </h3>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">
                  {selectedDetailDoctor.specialization} • {selectedDetailDoctor.department?.name}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500 font-bold">⭐ {selectedDetailDoctor.rating || '4.8'}</span>
                  <span className="text-muted-foreground opacity-60">|</span>
                  <span className="text-muted-foreground font-semibold">{selectedDetailDoctor.reviewsCount || '18'} Patient Reviews</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-[#7C7C7C] uppercase tracking-wider text-[10px]">Medical Biography</h5>
                <p className="text-muted-foreground font-medium">
                  {selectedDetailDoctor.bio || 'Dedicated medical consultant with extensive training and clinical practice history in advanced symptom management.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-secondary/50 p-3.5 rounded-2xl border border-border/40">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Experience</span>
                  <span className="font-bold text-foreground">{selectedDetailDoctor.experience} Years Practice</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Consultation Fee</span>
                  <span className="font-bold text-foreground">INR {selectedDetailDoctor.fees}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Hospital Facility</span>
                  <span className="font-bold text-foreground">{selectedDetailDoctor.hospital?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Average Visit Time</span>
                  <span className="font-bold text-foreground">{selectedDetailDoctor.averageConsultationTime || '15'} Minutes</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold text-[#7C7C7C] uppercase tracking-wider text-[10px]">Availability & Schedule</h5>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {selectedDetailDoctor.availability && selectedDetailDoctor.availability.length > 0 ? (
                    selectedDetailDoctor.availability.map((slot: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-background border p-2 rounded-lg font-semibold">
                        <span className="text-foreground">{slot.day}</span>
                        <span className="text-blue-500 font-bold">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic text-center py-2">No active availability slots.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => selectDoctorFromDirectory(selectedDetailDoctor)}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-95 transition-all text-center cursor-pointer"
              >
                Choose This Specialist to Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
