import { createClerkClient } from '@clerk/backend'
import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function sendClerkInvite(
  email: string,
  firstName: string,
  lastName: string,
  talentId: string
): Promise<{ inviteId: string, inviteToken: string }> {
  try {
    // Gerar token único para o convite
    const inviteToken = uuidv4()
    
    // Criar convite no Clerk (simulado por enquanto)
    // TODO: Implementar quando CLERK_SECRET_KEY estiver configurada
    const invitation = { id: `inv_${uuidv4()}` } // Simulação
    /*
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${window.location.origin}/complete-profile?token=${inviteToken}`,
      publicMetadata: {
        talentId,
        inviteToken,
        role: 'TALENT'
      }
    })
    */
    
    // Atualizar talento com informações do convite
    await prisma.talent.update()
    
    return {
      inviteId: invitation.id,
      inviteToken
    }
  } catch (error) {
    console.error('Erro ao enviar convite Clerk:', error)
    throw new Error('Erro ao enviar convite de cadastro')
  }
}

export async function resendClerkInvite(talentId: string): Promise<void> {
  try {
    const talent = await prisma.talent.findUnique()
    
    if (!talent || !talent.email) {
      throw new Error('Talento não encontrado ou sem email')
    }
    
    if (talent.clerkInviteId) {
      // Reenviar convite existente (simulado)
      // await clerkClient.invitations.revokeInvitation(talent.clerkInviteId)
    }
    
    // Criar novo convite
    const nameParts = talent.fullName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || '-'
    
    await sendClerkInvite(talent.email, firstName, lastName, talentId)
  } catch (error) {
    console.error('Erro ao reenviar convite:', error)
    throw new Error('Erro ao reenviar convite')
  }
}

export async function completeUserRegistration(
  clerkUserId: string,
  inviteToken: string
): Promise<void> {
  try {
    // Buscar talento pelo token
    const talent = await prisma.talent.findUnique()
    
    if (!talent) {
      throw new Error('Token de convite inválido')
    }
    
    // Atualizar usuário existente com clerk_id
    await prisma.user.update()
    
    // Limpar token do convite
    await prisma.talent.update()
  } catch (error) {
    console.error('Erro ao completar registro:', error)
    throw new Error('Erro ao completar registro do usuário')
  }
}