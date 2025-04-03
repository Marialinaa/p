import { environment } from '../../environments/environment';

export const DB_CONFIG = {
  host: environment.database.host,
  port: environment.database.port,
  user: environment.database.user,
  password: '', // Deixando em branco - você deve configurar isso de forma segura
  database: environment.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
