
// Mock Clerk service for frontend-only environment
// In a real application, these functions would call backend APIs

import { v4 as uuidv4 } from 'uuid'

// Mock Clerk client - replace with actual API calls to your backend
const mockClerkClient = {
  invitations: {
    createInvitation: async (data: any) => ({
      id: `inv_${uuidv4()}`,
      emailAddress: data.emailAddress,
      redirectUrl: data.redirectUrl,
      publicMetadata: data.publicMetadata
    }),
    revokeInvitation: async (inviteId: string) => ({
      success: true
    })
  }
}

export async function sendClerkInvite(
  email: string,
  firstName: string,
  lastName: string,
  talentId: string
): Promise<{ inviteId: string, inviteToken: string }> {
  try {
    // Generate unique token for invite
    const inviteToken = uuidv4()
    
    // Create invite via mock (in real app, this would be a backend API call)
    const invitation = await mockClerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${window.location.origin}/complete-profile?token=${inviteToken}`,
      publicMetadata: {
        talentId,
        inviteToken,
        role: 'TALENT'
      }
    })
    
    console.log('Mock Clerk invite sent:', { email, firstName, lastName, talentId, inviteToken })
    
    return {
      inviteId: invitation.id,
      inviteToken
    }
  } catch (error) {
    console.error('Error sending Clerk invite:', error)
    throw new Error('Error sending registration invite')
  }
}

export async function resendClerkInvite(talentId: string): Promise<void> {
  try {
    // In a real app, this would fetch talent data from your backend
    const mockTalent = {
      id: talentId,
      fullName: 'Mock User',
      email: 'mock@example.com',
      clerkInviteId: null
    }
    
    if (!mockTalent.email) {
      throw new Error('Talent not found or missing email')
    }
    
    if (mockTalent.clerkInviteId) {
      // Revoke existing invite
      await mockClerkClient.invitations.revokeInvitation(mockTalent.clerkInviteId)
    }
    
    // Create new invite
    const nameParts = mockTalent.fullName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || '-'
    
    await sendClerkInvite(mockTalent.email, firstName, lastName, talentId)
  } catch (error) {
    console.error('Error resending invite:', error)
    throw new Error('Error resending invite')
  }
}

export async function completeUserRegistration(
  clerkUserId: string,
  inviteToken: string
): Promise<void> {
  try {
    // In a real app, this would validate the token and update user data via backend API
    console.log('Mock user registration completion:', { clerkUserId, inviteToken })
    
    // Mock successful completion
    return Promise.resolve()
  } catch (error) {
    console.error('Error completing registration:', error)
    throw new Error('Error completing user registration')
  }
}
