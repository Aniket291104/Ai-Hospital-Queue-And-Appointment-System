'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Menu, X } from 'lucide-react';

export default function ReceptionistDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'Receptionist') {
      router.push('/login');
      return;
    }

    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch appointments');
    }
  };

  const handleApprove = async (apptId: string) => {
    try {
      await api.put(`/appointments/${apptId}/status`, { status: 'Approved' });
      toast.success('Appointment approved successfully!');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to approve appointment');
    }
  };

  const handleCheckIn = async (apptId: string) => {
    try {
      await api.post('/queues/check-in', { appointmentId: apptId });
      toast.success('Patient checked in and token generated!');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const handleUpdatePayment = async (apptId: string, paymentStatus: string) => {
    try {
      await api.put(`/appointments/${apptId}/status`, { paymentStatus });
      toast.success('Payment updated to Paid!');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const pName = `${appt.patient?.firstName} ${appt.patient?.lastName}`.toLowerCase();
    const docName = `${appt.doctor?.user?.firstName} ${appt.doctor?.user?.lastName}`.toLowerCase();
    const token = appt.queueToken ? appt.queueToken.toLowerCase() : '';
    const query = searchQuery.toLowerCase();

    return pName.includes(query) || docName.includes(query) || token.includes(query);
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-card border-r border-border p-6 flex flex-col justify-between fixed md:sticky inset-y-0 left-0 z-50 md:z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:flex shadow-xl md:shadow-none`}>
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
              onClick={() => setIsSidebarOpen(false)}
              className="w-full text-left px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm"
            >
              Appointments & Check-in
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
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-w-5xl mx-auto w-full no-scrollbar">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-secondary rounded-xl border border-border flex items-center justify-center cursor-pointer text-muted-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reception Dashboard</h1>
              <p className="text-muted text-xs sm:text-sm mt-1">Manage walk-ins, approve bookings, and run QR check-ins.</p>
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

        {/* Search Bar */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center gap-3">
          <span className="text-muted text-lg">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, doctor, or token..."
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
        </div>

        {/* Appointments Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold">Appointments List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-xs text-muted font-semibold uppercase">
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">Doctor</th>
                  <th className="py-4 px-6">Schedule</th>
                  <th className="py-4 px-6">Payment</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr key={appt._id} className="border-b border-border/50 hover:bg-secondary/10">
                      <td className="py-4 px-6 font-semibold">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </td>
                      <td className="py-4 px-6">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {appt.paymentStatus === 'Paid' ? (
                          <span className="px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/10 text-emerald-500">
                            Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpdatePayment(appt._id, 'Paid')}
                            className="px-2.5 py-1 text-[10px] rounded font-bold uppercase bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer transition-all border border-red-500/20"
                          >
                            Pending
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          appt.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                          appt.status === 'Approved' ? 'bg-blue-500/10 text-blue-500' :
                          appt.status === 'CheckedIn' ? 'bg-indigo-500/10 text-indigo-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => handleApprove(appt._id)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded"
                          >
                            Approve
                          </button>
                        )}
                        {appt.status === 'Approved' && (
                          <button
                            onClick={() => handleCheckIn(appt._id)}
                            className="px-3 py-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded"
                          >
                            Check-in
                          </button>
                        )}
                        {appt.queueToken && (
                          <span className="font-bold text-sm bg-secondary px-2.5 py-1 rounded text-primary">
                            Token: {appt.queueToken}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
