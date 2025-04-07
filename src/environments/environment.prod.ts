export const environment = {
  production: true,
  apiUrl: 'https://api.example.com', // Substitua pela URL real da API em produção
  database: {
    host: 'db-production.example.com',
    port: 3306,
    name: 'tankBdM',
    user: 'dbuser',
    // Em produção, a string de conexão deve vir de uma variável de ambiente segura
    connectionString: process.env && process.env['DB_CONNECTION_STRING'] || 'mysql://dbuser:password@db-production.example.com:3306/tankBdM'
  },
  security: {
    tokenExpirationTime: 43200, // 12 horas em segundos
    jwtSecret: process.env && process.env['JWT_SECRET'] || 'production_secret_key',
    bcryptSaltRounds: 12
  }
};
