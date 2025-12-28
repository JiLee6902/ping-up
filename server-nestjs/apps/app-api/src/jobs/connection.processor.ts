import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, User } from '@app/entity';
import { ConnectionStatus } from '@app/enum';
import { EmailService } from '@app/external-infra/email';

@Processor('connection')
export class ConnectionProcessor {
  private readonly logger = new Logger(ConnectionProcessor.name);

  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  @Process('connection-reminder')
  async handleConnectionReminder(job: Job<{ connectionId: string }>) {
    const { connectionId } = job.data;
    this.logger.debug(`Checking connection reminder for ${connectionId}`);

    try {
      const connection = await this.connectionRepository.findOne({
        where: { id: connectionId },
        relations: ['fromUser', 'toUser'],
      });

      if (!connection) {
        this.logger.warn(`Connection ${connectionId} not found`);
        return;
      }

      // Only send reminder if still pending
      if (connection.status === ConnectionStatus.PENDING) {
        await this.emailService.sendEmail({
          to: connection.toUser.email,
          subject: 'You have a pending connection request on PingUp',
          html: `
            <h2>Connection Request Reminder</h2>
            <p>Hi ${connection.toUser.fullName},</p>
            <p>${connection.fromUser.fullName} sent you a connection request 24 hours ago and is still waiting for your response.</p>
            <p>Log in to PingUp to accept or decline the request.</p>
          `,
        });

        this.logger.log(
          `Reminder email sent to ${connection.toUser.email} for connection ${connectionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process connection reminder ${connectionId}: ${error.message}`,
      );
      throw error;
    }
  }
}
