import { type AdminLoginInput } from '../schema';

export async function adminLogin(input: AdminLoginInput): Promise<{ success: boolean }> {
  try {
    // Hardcoded credentials for admin login
    if (input.username === 'admin' && input.password === 'admin') {
      return { success: true };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
}