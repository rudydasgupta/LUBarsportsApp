import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'admin_session';

// Helper to get adminId from session (for use in protected routes)
export function getAdminIdFromRequest(req: NextRequest): number | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  
  // Handle super admin session
  if (cookie === 'super_admin') {
    return 0; // Return 0 for super admin
  }
  
  // Handle regular admin session
  if (cookie.startsWith('admin_')) {
    const id = Number(cookie.replace('admin_', ''));
    return isNaN(id) ? null : id;
  }
  
  return null;
}

// Helper to check if user is super admin
export function isSuperAdmin(req: NextRequest): boolean {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  return cookie === 'super_admin';
}

