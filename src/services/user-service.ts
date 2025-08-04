
import { CurrentUser } from '@/types/whatsapp'

// Mock users database
const mockUsers: (CurrentUser & { clerkId: string })[] = [
  {
    id: 'user_1',
    clerkId: 'user_2pHQnY8H4Xj1KqQqW5mEYxXzLJM',
    email: 'operador@pregiato.com',
    fullName: 'João Silva',
    role: 'OPERATOR'
  },
  {
    id: 'user_2', 
    clerkId: 'user_2pHQnY8H4Xj1KqQqW5mEYxXzLJN',
    email: 'admin@pregiato.com',
    fullName: 'Maria Santos',
    role: 'ADMIN'
  },
  {
    id: 'user_3',
    clerkId: 'user_2pHQnY8H4Xj1KqQqW5mEYxXzLJO', 
    email: 'talent@pregiato.com',
    fullName: 'Ana Clara Santos',
    role: 'TALENT'
  }
]

export class UserService {
  // Get user by email (simulating database query)
  static async getUserByEmail(email: string): Promise<CurrentUser | null> {
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate DB query
    
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return null
    
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  }

  // Get user by Clerk ID
  static async getUserByClerkId(clerkId: string): Promise<CurrentUser | null> {
    await new Promise(resolve => setTimeout(resolve, 200)) // Simulate DB query
    
    const user = mockUsers.find(u => u.clerkId === clerkId)
    if (!user) return null
    
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  }

  // Check if user has permission to access WhatsApp features
  static hasWhatsAppAccess(userRole: string): boolean {
    return userRole !== 'TALENT'
  }
}
