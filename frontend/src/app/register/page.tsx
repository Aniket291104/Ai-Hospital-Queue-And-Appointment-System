'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UserPlus, Sparkles, ShieldAlert, Activity } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Patient');
  const [staffAccessKey, setStaffAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Doctor specific fields
  const [specialization, setSpecialization] = useState('General Physician');
  const [experience, setExperience] = useState(5);
  const [fees, setFees] = useState(500);
  const [bio, setBio] = useState('General practitioner dedicated to patient health and family care.');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (role === 'Doctor') {
      fetchHospitals();
    }
  }, [role]);

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/hospitals');
      const hosps = response.data.data || [];
      setHospitals(hosps);
      if (hosps.length > 0) {
        setSelectedHospital(hosps[0]._id);
        fetchDepartments(hosps[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals');
    }
  };

  const fetchDepartments = async (hospitalId: string) => {
    try {
      const response = await api.get(`/hospitals/${hospitalId}/departments`);
      const depts = response.data.data || [];
      setDepartments(depts);
      if (depts.length > 0) {
        setSelectedDepartment(depts[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        staffAccessKey,
        ...(role === 'Doctor' && {
          specialization,
          experience: Number(experience),
          fees: Number(fees),
          bio,
          hospital: selectedHospital,
          department: selectedDepartment,
        }),
      });

      toast.success(response.data.message);
      setOtpSent(true);
      if (response.data.otp) {
        setOtpCode(response.data.otp);
        toast.success(`[DEV] Pre-filled OTP: ${response.data.otp}`, { duration: 8000 });
      }
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        apiErrors.forEach((err: any) => {
          toast.error(err.message || 'Validation error');
        });
      } else {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpCode,
      });

      toast.success('Email verified! Redirecting to login...');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DAE3EE] text-[#2C3137] font-urbanist relative overflow-x-hidden p-4 md:p-8 flex items-center justify-center">
      {/* DNA Helix Background SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.25] z-0 flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full min-w-[1200px]" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6AB8FF" />
              <stop offset="100%" stopColor="#CFA3F6" />
            </linearGradient>
            <linearGradient id="dnaGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#CFA3F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6AB8FF" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            d="M-50,300 C150,150 250,450 450,300 C650,150 750,450 950,300 C1150,150 1200,300 1300,300"
            stroke="url(#dnaGrad1)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M-50,300 C150,450 250,150 450,300 C650,450 750,150 950,300 C1150,450 1200,300 1300,300"
            stroke="url(#dnaGrad2)"
            strokeWidth="4"
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="w-full max-w-md bg-[#FCFDFF] border border-white/50 p-8 rounded-[32px] shadow-2xl z-10 relative space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-bold text-xs">
              H
            </span>
            <span className="text-2xl font-extrabold text-[#2C3137]">HospitalAI</span>
          </Link>
          <p className="text-xs text-[#7C7C7C] font-semibold mt-1">
            {otpSent ? 'Enter OTP sent to your email' : 'Create an account to join the queue'}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Account Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value === 'Patient') setStaffAccessKey('');
                  }}
                  className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Admin">Hospital Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg className="fill-current h-4 w-4 text-[#7C7C7C]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {role !== 'Patient' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Staff Access Key</label>
                <input
                  type="password"
                  required
                  value={staffAccessKey}
                  onChange={(e) => setStaffAccessKey(e.target.value)}
                  placeholder="Enter invitation/staff secret key"
                  className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                />
              </div>
            )}

            {role === 'Doctor' && (
              <div className="space-y-4 border-t border-white/20 pt-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Specialization</label>
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiologist"
                      className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Experience (Years)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      placeholder="e.g. 10"
                      className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Consultation Fee (INR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={fees}
                      onChange={(e) => setFees(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Select Hospital</label>
                    <div className="relative">
                      <select
                        value={selectedHospital}
                        onChange={(e) => {
                          setSelectedHospital(e.target.value);
                          fetchDepartments(e.target.value);
                        }}
                        className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all appearance-none cursor-pointer"
                      >
                        {hospitals.map((h: any) => (
                          <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <svg className="fill-current h-4 w-4 text-[#7C7C7C]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Select Department</label>
                    <div className="relative">
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all appearance-none cursor-pointer"
                      >
                        {departments.map((d: any) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <svg className="fill-current h-4 w-4 text-[#7C7C7C]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">Biography & Treatment Focus</label>
                  <textarea
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe what you specialize in (e.g. Heart Specialist) and what treatments/services you perform (e.g. Angioplasty, heart surgeries, ECGs)."
                    rows={3}
                    className="w-full px-5 py-3 rounded-2xl border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all resize-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-5 py-3 text-center tracking-widest font-extrabold text-sm rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-[#7C7C7C] font-semibold hover:underline mt-2"
            >
              Back to registration
            </button>
          </form>
        )}

        {!otpSent && (
          <p className="text-center text-xs text-[#7C7C7C] font-semibold mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-[#6AB8FF] hover:underline font-extrabold">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
