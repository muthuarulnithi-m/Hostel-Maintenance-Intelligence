import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import staffApi from '../api/staffApi';

/**
 * useStaffProfile
 * Resolves the current logged-in staff member's staff profile.
 *
 * The backend has no GET /staff/me endpoint.
 * Strategy:
 *   1. Get current user id from AuthContext (user.id)
 *   2. Fetch GET /staff (full list)
 *   3. Find the entry where staff.user_id === user.id
 *
 * Returns:
 *   staffProfile  — { id, user_id, employee_code, availability_status, joined_at }
 *   staffId       — the staff.id (used for API calls like PATCH /staff/{id}/availability)
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
      const allStaff = await staffApi.getAllStaff();
      // Match by user_id
      const mine = allStaff.find(s => s.user_id === user.id);
      if (mine) {
        setStaffProfile(mine);
      } else {
        setError('Staff profile not found for this account.');
      }
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
    staffId:  staffProfile?.id   || null,
    loading,
    error,
    refresh:  resolve,
  };
}

export default useStaffProfile;