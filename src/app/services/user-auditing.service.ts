import { Injectable } from '@angular/core';
import { MySqlService } from './mysql.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AuditLog {
  id: number;
  userId?: number;
  email?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  details?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserAuditingService {
  constructor(private mysqlService: MySqlService) {}

  /**
   * Obtém logs de auditoria para usuários
   * @param limit Número máximo de registros a retornar
   * @param userId ID do usuário específico (opcional)
   * @returns Lista de logs de auditoria
   */
  getAuditLogs(limit: number = 50, userId?: number): Observable<AuditLog[]> {
    let query = `
      SELECT id, user_id, email, action, ip_address, user_agent, status, details, created_at
      FROM auth_logs
      ${userId ? 'WHERE user_id = ?' : ''}
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const params = userId ? [userId, limit] : [limit];
    
    return this.mysqlService.executeQuery(query, params).pipe(
      map(logs => this.mapAuditLogs(logs))
    );
  }

  /**
   * Registra uma ação de auditoria
   * @param logData Dados do log
   * @returns Observable com o ID do log criado
   */
  logAction(logData: Partial<AuditLog>): Observable<number> {
    const query = `
      INSERT INTO auth_logs (user_id, email, action, ip_address, user_agent, status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      logData.userId || null,
      logData.email || null,
      logData.action,
      logData.ipAddress || null,
      logData.userAgent || null,
      logData.status || 'success',
      logData.details || null
    ];
    
    return this.mysqlService.executeQuery(query, params).pipe(
      map((result: any) => result.insertId)
    );
  }

  /**
   * Mapeia os resultados do banco para o formato de objeto AuditLog
   */
  private mapAuditLogs(logs: any[]): AuditLog[] {
    return logs.map(log => ({
      id: log.id,
      userId: log.user_id,
      email: log.email,
      action: log.action,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      status: log.status,
      details: log.details,
      createdAt: new Date(log.created_at)
    }));
  }

  /**
   * Busca logs de auditoria com base em filtros
   */
  searchAuditLogs(filters: {
    startDate?: Date,
    endDate?: Date,
    action?: string,
    status?: string,
    email?: string,
    userId?: number,
    limit?: number,
    offset?: number
  }): Observable<AuditLog[]> {
    const conditions: string[] = []; // Definir explicitamente como array de strings
    const params: (string | number | Date)[] = []; // Definir explicitamente os tipos permitidos

    if (filters.startDate) {
      conditions.push('created_at >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('created_at <= ?');
      params.push(filters.endDate);
    }

    if (filters.action) {
      conditions.push('action = ?');
      params.push(filters.action);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.email) {
      conditions.push('email LIKE ?');
      params.push(`%${filters.email}%`);
    }

    if (filters.userId) {
      conditions.push('user_id = ?');
      params.push(filters.userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT id, user_id, email, action, ip_address, user_agent, status, details, created_at
      FROM auth_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(filters.limit || 50);
    params.push(filters.offset || 0);
    
    return this.mysqlService.executeQuery(query, params).pipe(
      map(logs => this.mapAuditLogs(logs))
    );
  }
}
