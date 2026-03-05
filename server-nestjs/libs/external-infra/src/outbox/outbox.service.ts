import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { OutboxEvent } from '@app/entity';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
  ) {}

  /**
   * Publish an outbox event within an existing transaction.
   * Use this when you already have a transaction manager from DataSource.transaction().
   */
  async publishInTransaction(
    manager: EntityManager,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<OutboxEvent> {
    const event = manager.create(OutboxEvent, {
      aggregateType,
      aggregateId,
      eventType,
      payload,
    });

    const saved = await manager.save(OutboxEvent, event);
    this.logger.debug(
      `Outbox event published: ${eventType} for ${aggregateType}:${aggregateId}`,
    );
    return saved;
  }

  /**
   * Publish an outbox event without an existing transaction.
   * Convenience method for simple cases where no surrounding transaction is needed.
   */
  async publish(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<OutboxEvent> {
    const event = this.outboxRepository.create({
      aggregateType,
      aggregateId,
      eventType,
      payload,
    });

    const saved = await this.outboxRepository.save(event);
    this.logger.debug(
      `Outbox event published: ${eventType} for ${aggregateType}:${aggregateId}`,
    );
    return saved;
  }

  /**
   * Delete outbox events older than the specified hours.
   * Debezium reads from PostgreSQL WAL, so table rows are only needed as a fallback.
   */
  async cleanupOlderThan(hours: number): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await this.outboxRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff })
      .execute();

    const deleted = result.affected || 0;
    if (deleted > 0) {
      this.logger.log(`Cleaned up ${deleted} outbox events older than ${hours}h`);
    }
    return deleted;
  }
}
