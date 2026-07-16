import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

// Formula to calculate distance between two lat/lng coordinates in meters
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in meters
}

export default function ClockInOut({ geofenceEnabled, targetLat, targetLng, allowedRadius }) {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const timerRef = useRef(null);

  const checkActiveShift = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', user.id)
        .is('clock_out', null)
        .maybeSingle();

      if (error) throw error;
      setActiveShift(data);
    } catch (err) {
      console.error(err.message);
      setError('Could not verify shift state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) checkActiveShift();
    return () => clearInterval(timerRef.current);
  }, [user]);

  useEffect(() => {
    if (activeShift) {
      const startTime = new Date(activeShift.clock_in).getTime();
      timerRef.current = setInterval(() => {
        const difference = new Date().getTime() - startTime;
        if (difference < 0) return;
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(timerRef.current);
  }, [activeShift]);

  // Request Coordinates (only if geofencing is on)
  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error('Please enable Location access in settings.')),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  };

  const handleClockIn = async () => {
    setError('');
    setActionLoading(true);
    try {
      let lat = null;
      let lng = null;

      if (geofenceEnabled) {
        const coords = await getCoordinates();
        lat = coords.lat;
        lng = coords.lng;

        // Verify bounds
        const distance = getDistanceFromLatLonInM(lat, lng, Number(targetLat), Number(targetLng));
        if (distance > Number(allowedRadius || 150)) {
          throw new Error(`You are too far from the restaurant to clock in. (Distance: ${Math.round(distance)}m)`);
        }
      }

      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          employee_id: user.id,
          clock_in: new Date().toISOString(),
          clock_in_lat: lat,
          clock_in_lng: lng
        }])
        .select()
        .single();

      if (error) throw error;
      setActiveShift(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setError('');
    setActionLoading(true);
    try {
      let lat = null;
      let lng = null;

      if (geofenceEnabled) {
        const coords = await getCoordinates();
        lat = coords.lat;
        lng = coords.lng;
      }

      const { error } = await supabase
        .from('shifts')
        .update({
          clock_out: new Date().toISOString(),
          clock_out_lat: lat,
          clock_out_lng: lng
        })
        .eq('id', activeShift.id);

      if (error) throw error;
      setActiveShift(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-6 text-slate-500">Loading Tracker...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md mx-auto text-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {activeShift ? 'Shift in Progress' : 'Ready to Work'}
        </h2>
        <div className="text-4xl font-mono font-black text-white mt-2">{elapsedTime}</div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-900 text-red-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {activeShift ? (
        <button
          onClick={handleClockOut}
          disabled={actionLoading}
          className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold transition-all"
        >
          {actionLoading ? 'Verifying...' : 'Clock Out'}
        </button>
      ) : (
        <button
          onClick={handleClockIn}
          disabled={actionLoading}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black transition-all"
        >
          {actionLoading ? 'Verifying...' : 'Clock In'}
        </button>
      )}

      {geofenceEnabled && (
        <p className="mt-4 text-center text-[11px] text-slate-500">
          📍 Geofence active. You must be on-site to lock in shifts.
        </p>
      )}
    </div>
  );
}