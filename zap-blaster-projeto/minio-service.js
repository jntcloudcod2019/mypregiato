const Minio = require('minio');

class MinIOService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.config = {
            endPoint: process.env.MINIO_PUBLIC_HOST || 'bucket-production-1aef.up.railway.app',
            port: parseInt(process.env.MINIO_PUBLIC_PORT) || 443,
            useSSL: true, // Railway MinIO público usa HTTPS
            accessKey: process.env.MINIO_ROOT_USER || '7bW6zf9Vo0QBtueWnzM73OMhcsTIFuWi',
            secretKey: process.env.MINIO_ROOT_PASSWORD || 'OduQXA4WGbZ83GhL5vclllgRmmVr0xas2QhLCPOq6o8Qhpgt',
            bucketName: 'midias'
        };
        
        console.log('🔧 MinIO Service configurado', {
            endpoint: this.config.endPoint,
            port: this.config.port,
            useSSL: this.config.useSSL,
            bucketName: this.config.bucketName
        });
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
           console.log('🔄 Inicializando MinIO Service...');
            
            // Criar cliente MinIO
            this.client = new Minio.Client({
                endPoint: this.config.endPoint,
                port: this.config.port,
                useSSL: this.config.useSSL,
                accessKey: this.config.accessKey,
                secretKey: this.config.secretKey
            });

            // Verificar se o bucket existe
            const bucketExists = await this.client.bucketExists(this.config.bucketName);
            
            if (!bucketExists) {
                console.log('📦 Criando bucket MinIO:', this.config.bucketName);
                await this.client.makeBucket(this.config.bucketName);
                console.log('✅ Bucket MinIO criado com sucesso:', this.config.bucketName);
            } else {
                console.log('✅ Bucket MinIO encontrado:', this.config.bucketName);
            }

            this.isInitialized = true;
           console.log('🎉 MinIO Service inicializado com sucesso', {
                endpoint: this.config.endPoint,
                bucket: this.config.bucketName
            });

        } catch (error) {
            console.log('❌ Falha ao inicializar MinIO Service:', error.message);
            throw error;
        }
    }



  
}

module.exports = MinIOService;
