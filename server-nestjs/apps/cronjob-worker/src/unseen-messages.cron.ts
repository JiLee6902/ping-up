import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, User } from '@app/entity';
import { EmailService } from '@app/external-infra/email';

@Injectable()
export class UnseenMessagesCron {
  private readonly logger = new Logger(UnseenMessagesCron.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  // Run daily at 9 AM EST (14:00 UTC)
  @Cron('0 14 * * *', { timeZone: 'UTC' })
  async handleUnseenMessagesNotification() {
    this.logger.log('Running unseen messages notification job');

    try {
      // Get all unseen messages grouped by recipient
      const unseenMessages = await this.messageRepository
        .createQueryBuilder('message')
        .select('message.toUserId', 'userId')
        .addSelect('COUNT(*)', 'count')
        .where('message.seen = :seen', { seen: false })
        .groupBy('message.toUserId')
        .getRawMany();

      this.logger.debug(`Found ${unseenMessages.length} users with unseen messages`);

      for (const { userId, count } of unseenMessages) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (user) {
          await this.emailService.sendEmail({
            to: user.email,
            subject: `You have ${count} unread message${count > 1 ? 's' : ''} on PingUp`,
            html: `
              <h2>Unread Messages</h2>
              <p>Hi ${user.fullName},</p>
              <p>You have <strong>${count}</strong> unread message${count > 1 ? 's' : ''} waiting for you on PingUp.</p>
              <p>Log in to read and respond to your messages.</p>
            `,
          });

          this.logger.debug(`Sent notification email to ${user.email}`);
        }
      }

      this.logger.log('Unseen messages notification job completed');
    } catch (error) {
      this.logger.error(`Unseen messages notification job failed: ${error.message}`);
    }
  }
}
