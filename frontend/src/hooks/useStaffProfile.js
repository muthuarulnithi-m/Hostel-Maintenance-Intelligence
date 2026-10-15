import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import staffApi from '../api/staffApi';

/**
 * useStaffProfile
 * Resolves the current logged-in staff member's staff profile.
 *
 * Strategy:
 *   1. Call GET /staff/me  (returns the staff profile for the logged-in user)
 *   2. If that endpoint doesn't exist, falls back to GET /staff filtered by user_id
 *      — but GET /staff is admin/warden only, so we rely on /staff/me first.
 *
 * Returns:
 *   staffProfile  — { id, user_id, employee_code, availability_status, joined_at }
 *   staffId       — the staff.id (used for PATCH /staff/{id}/availability)
 *   loading       — bool
 *   error         — string
 *   refresh       — fn to re-fetch
 */
function useStaffProfile() {
  const { user } = useAuth();
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const resolve = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      // GET /staff/me — returns the staff profile for the currently logged-in user
      const profile = await staffApi.getMyProfile();
      setStaffProfile(profile);
    } catch {
      setError('Unable to load staff profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolve();
  }, [user?.id]);

  return {
    staffProfile,
    staffId:  staffProfile?.id || null,
    loading,
    error,
    refresh:  resolve,
  };
}

export default useStaffProfile;
