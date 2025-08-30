/**
 * WhatsAppDataExtractor.js
 * 
 * Sistema para extrair e armazenar informações do WhatsApp quando conectado
 * Coleta dados seguros do número conectado, perfil e metadados
 */

const fs = require('fs').promises;
const path = require('path');

class WhatsAppDataExtractor {
    constructor(options = {}) {
        this.dataPath = options.dataPath || './whatsapp_data';
        this.client = null;
        this.lastExtraction = null;
        this.extractionHistory = [];
        
        this.ensureDataDirectory();
    }

    /**
     * Inicializa o extrator com o cliente WhatsApp
     */
    async initialize(client) {
        this.client = client;
        console.log('📊 WhatsApp Data Extractor inicializado');
    }

    /**
     * Extrai informações completas quando o cliente conecta
     */
    async extractConnectionData() {
        if (!this.client || !this.client.info) {
            console.log('⚠️ Cliente não disponível para extração');
            return null;
        }

        try {
            console.log('📊 Iniciando extração de dados do WhatsApp...');
            
            const extractionData = {
                timestamp: new Date().toISOString(),
                extractionId: this.generateExtractionId(),
                accountInfo: await this.extractAccountInfo(),
                profileInfo: await this.extractProfileInfo(),
                settingsInfo: await this.extractSettingsInfo(),
                deviceInfo: await this.extractDeviceInfo(),
                contactsSummary: await this.extractContactsSummary(),
                groupsSummary: await this.extractGroupsSummary(),
                capabilities: await this.extractCapabilities()
            };

            // Salvar dados extraídos
            await this.saveExtractionData(extractionData);
            
            this.lastExtraction = extractionData;
            this.extractionHistory.push({
                id: extractionData.extractionId,
                timestamp: extractionData.timestamp,
                accountNumber: extractionData.accountInfo?.phoneNumber
            });

            console.log('✅ Extração de dados concluída');
            console.log(`📱 Número: ${extractionData.accountInfo?.phoneNumber}`);
            console.log(`👤 Nome: ${extractionData.profileInfo?.displayName}`);
            
            return extractionData;

        } catch (error) {
            console.error('❌ Erro durante extração de dados:', error);
            return null;
        }
    }

    /**
     * Extrai informações básicas da conta
     */
    async extractAccountInfo() {
        try {
            const info = this.client.info;
            
            return {
                phoneNumber: info?.wid?.user || null,
                serializedId: info?.wid?._serialized || null,
                platform: info?.platform || null,
                clientVersion: info?.version || null,
                isConnected: !!info,
                connectionTime: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Erro ao extrair info da conta:', error);
            return null;
        }
    }

    /**
     * Extrai informações do perfil
     */
    async extractProfileInfo() {
        try {
            const contact = await this.client.getContactById(this.client.info.wid._serialized);
            
            return {
                displayName: contact?.name || contact?.pushname || null,
                about: contact?.about || null,
                profilePicUrl: await this.getProfilePicture(contact),
                isMyContact: contact?.isMyContact || false,
                isGroup: contact?.isGroup || false,
                isUser: contact?.isUser || true
            };
            
        } catch (error) {
            console.error('❌ Erro ao extrair info do perfil:', error);
            return {
                displayName: this.client.info?.pushname || null,
                about: null,
                profilePicUrl: null,
                isMyContact: false,
                isGroup: false,
                isUser: true
            };
        }
    }

    /**
     * Extrai configurações básicas
     */
    async extractSettingsInfo() {
        try {
            // Informações básicas que podem ser obtidas
            return {
                locale: 'pt-BR', // Baseado na configuração do bot
                timezone: 'America/Sao_Paulo',
                extractionCapabilities: [
                    'basic_profile',
                    'contacts_summary',
                    'groups_summary',
                    'device_info'
                ]
            };
            
        } catch (error) {
            console.error('❌ Erro ao extrair configurações:', error);
            return null;
        }
    }

    /**
     * Extrai informações do dispositivo/cliente
     */
    async extractDeviceInfo() {
        try {
            return {
                clientId: 'zap-prod',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                platform: this.client.info?.platform || 'web',
                extractionEnvironment: 'nodejs',
                nodeVersion: process.version,
                whatsappWebJsVersion: require('../package.json').dependencies['whatsapp-web.js'] || 'unknown'
            };
            
        } catch (error) {
            console.error('❌ Erro ao extrair info do dispositivo:', error);
            return null;
        }
    }

    /**
     * Extrai resumo dos contatos (sem dados pessoais)
     */
    async extractContactsSummary() {
        try {
            console.log('📞 Extraindo resumo de contatos...');
            
            const contacts = await this.client.getContacts();
            
            const contactsSummary = {
                totalContacts: contacts.length,
                userContacts: contacts.filter(c => c.isUser && !c.isGroup).length,
                groupContacts: contacts.filter(c => c.isGroup).length,
                businessContacts: contacts.filter(c => c.isBusiness).length,
                contactsWithProfilePic: 0, // Calculado sem baixar imagens
                extractedAt: new Date().toISOString()
            };

            // Contar contatos com foto sem baixar as imagens
            let contactsWithPic = 0;
            for (let i = 0; i < Math.min(contacts.length, 50); i++) { // Limitar para evitar sobrecarga
                try {
                    const profilePic = await contacts[i].getProfilePicUrl();
                    if (profilePic) contactsWithPic++;
                } catch (e) {
                    // Contato sem foto ou erro
                }
            }
            
            contactsSummary.contactsWithProfilePic = contactsWithPic;
            
            console.log(`📞 ${contactsSummary.totalContacts} contatos encontrados`);
            
            return contactsSummary;
            
        } catch (error) {
            console.error('❌ Erro ao extrair contatos:', error);
            return {
                totalContacts: 0,
                userContacts: 0,
                groupContacts: 0,
                businessContacts: 0,
                contactsWithProfilePic: 0,
                extractedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Extrai resumo dos grupos
     */
    async extractGroupsSummary() {
        try {
            console.log('👥 Extraindo resumo de grupos...');
            
            const chats = await this.client.getChats();
            const groups = chats.filter(chat => chat.isGroup);
            
            const groupsSummary = {
                totalGroups: groups.length,
                activeGroups: groups.filter(g => !g.archived).length,
                archivedGroups: groups.filter(g => g.archived).length,
                adminGroups: 0, // Calculado abaixo
                groupsWithUnreadMessages: groups.filter(g => g.unreadCount > 0).length,
                extractedAt: new Date().toISOString()
            };

            // Contar grupos onde o usuário é admin
            for (const group of groups.slice(0, 20)) { // Limitar para evitar sobrecarga
                try {
                    const participants = await group.getParticipants();
                    const myParticipant = participants.find(p => p.id._serialized === this.client.info.wid._serialized);
                    if (myParticipant && myParticipant.isAdmin) {
                        groupsSummary.adminGroups++;
                    }
                } catch (e) {
                    // Erro ao obter participantes
                }
            }
            
            console.log(`👥 ${groupsSummary.totalGroups} grupos encontrados`);
            
            return groupsSummary;
            
        } catch (error) {
            console.error('❌ Erro ao extrair grupos:', error);
            return {
                totalGroups: 0,
                activeGroups: 0,
                archivedGroups: 0,
                adminGroups: 0,
                groupsWithUnreadMessages: 0,
                extractedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Extrai capacidades do cliente
     */
    async extractCapabilities() {
        try {
            const capabilities = {
                canSendMessages: true,
                canReceiveMessages: true,
                canSendMedia: true,
                canCreateGroups: true,
                canManageGroups: true,
                supportsContacts: true,
                supportsChats: true,
                extractionMethods: [
                    'getContacts',
                    'getChats',
                    'getContactById',
                    'getProfilePicUrl',
                    'sendMessage'
                ]
            };
            
            return capabilities;
            
        } catch (error) {
            console.error('❌ Erro ao extrair capacidades:', error);
            return null;
        }
    }

    /**
     * Obtém URL da foto de perfil
     */
    async getProfilePicture(contact) {
        try {
            if (!contact) return null;
            
            const profilePicUrl = await contact.getProfilePicUrl();
            return profilePicUrl || null;
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Salva dados extraídos em arquivo
     */
    async saveExtractionData(data) {
        try {
            const filename = `extraction_${data.extractionId}.json`;
            const filepath = path.join(this.dataPath, filename);
            
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            
            // Salvar também um resumo
            const summary = {
                extractionId: data.extractionId,
                timestamp: data.timestamp,
                phoneNumber: data.accountInfo?.phoneNumber,
                displayName: data.profileInfo?.displayName,
                totalContacts: data.contactsSummary?.totalContacts,
                totalGroups: data.groupsSummary?.totalGroups
            };
            
            await this.updateExtractionSummary(summary);
            
            console.log(`💾 Dados salvos: ${filename}`);
            
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
        }
    }

    /**
     * Atualiza resumo das extrações
     */
    async updateExtractionSummary(summary) {
        try {
            const summaryPath = path.join(this.dataPath, 'extractions_summary.json');
            
            let allSummaries = [];
            try {
                const existingData = await fs.readFile(summaryPath, 'utf8');
                allSummaries = JSON.parse(existingData);
            } catch (e) {
                // Arquivo não existe ainda
            }
            
            allSummaries.push(summary);
            
            // Manter apenas as últimas 100 extrações
            if (allSummaries.length > 100) {
                allSummaries = allSummaries.slice(-100);
            }
            
            await fs.writeFile(summaryPath, JSON.stringify(allSummaries, null, 2));
            
        } catch (error) {
            console.error('❌ Erro ao atualizar resumo:', error);
        }
    }

    /**
     * Obtém histórico de extrações
     */
    async getExtractionHistory() {
        try {
            const summaryPath = path.join(this.dataPath, 'extractions_summary.json');
            const data = await fs.readFile(summaryPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    /**
     * Obtém estatísticas das extrações
     */
    async getExtractionStats() {
        try {
            const history = await this.getExtractionHistory();
            
            const stats = {
                totalExtractions: history.length,
                uniqueNumbers: [...new Set(history.map(h => h.phoneNumber))].length,
                lastExtraction: history[history.length - 1]?.timestamp || null,
                firstExtraction: history[0]?.timestamp || null,
                averageContacts: history.length > 0 ? 
                    Math.round(history.reduce((sum, h) => sum + (h.totalContacts || 0), 0) / history.length) : 0,
                averageGroups: history.length > 0 ? 
                    Math.round(history.reduce((sum, h) => sum + (h.totalGroups || 0), 0) / history.length) : 0
            };
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return null;
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================

    async ensureDataDirectory() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
        } catch (error) {
            console.error('❌ Erro ao criar diretório de dados:', error);
        }
    }

    generateExtractionId() {
        return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gera relatório de extração
     */
    async generateExtractionReport() {
        try {
            const stats = await this.getExtractionStats();
            const history = await this.getExtractionHistory();
            
            console.log('\n📊 === RELATÓRIO DE EXTRAÇÃO DE DADOS ===');
            console.log(`📈 Total de extrações: ${stats.totalExtractions}`);
            console.log(`📱 Números únicos: ${stats.uniqueNumbers}`);
            console.log(`📞 Média de contatos: ${stats.averageContacts}`);
            console.log(`👥 Média de grupos: ${stats.averageGroups}`);
            
            if (stats.lastExtraction) {
                console.log(`⏰ Última extração: ${new Date(stats.lastExtraction).toLocaleString('pt-BR')}`);
            }
            
            if (history.length > 0) {
                console.log('\n📋 Últimas extrações:');
                history.slice(-5).forEach((extraction, index) => {
                    const date = new Date(extraction.timestamp).toLocaleString('pt-BR');
                    console.log(`  ${history.length - 5 + index + 1}. ${extraction.phoneNumber} - ${date}`);
                });
            }
            
            console.log('==========================================\n');
            
            return { stats, history };
            
        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            return null;
        }
    }
}

module.exports = WhatsAppDataExtractor;
