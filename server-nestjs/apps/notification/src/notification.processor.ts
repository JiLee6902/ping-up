import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/entity';
import { EmailService } from '@app/external-infra/email';
import { NOTIFICATION_QUEUE } from '@app/external-infra/queue';
import { NotificationEventDto } from '@app/external-infra/queue';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  @Process('NEW_MESSAGE')
  async handleNewMessage(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing NEW_MESSAGE job ${job.id}`);
    await this.handleNewMessageNotification(job.data);
  }

  @Process('CONNECTION_REQUEST')
  async handleConnectionRequest(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing CONNECTION_REQUEST job ${job.id}`);
    await this.handleConnectionRequestNotification(job.data);
  }

  @Process('CONNECTION_ACCEPTED')
  async handleConnectionAccepted(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing CONNECTION_ACCEPTED job ${job.id}`);
    await this.handleConnectionAcceptedNotification(job.data);
  }

  @Process('NEW_FOLLOWER')
  async handleNewFollower(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing NEW_FOLLOWER job ${job.id}`);
    await this.handleNewFollowerNotification(job.data);
  }

  @Process('POST_LIKED')
  async handlePostLiked(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing POST_LIKED job ${job.id}`);
    await this.handlePostLikedNotification(job.data);
  }

  @Process('NEW_COMMENT')
  async handleNewComment(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing NEW_COMMENT job ${job.id}`);
    await this.handleNewCommentNotification(job.data);
  }

  @Process('POST_REPOSTED')
  async handlePostReposted(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing POST_REPOSTED job ${job.id}`);
    await this.handleRepostNotification(job.data);
  }

  @Process('MENTION')
  async handleMention(job: Job<NotificationEventDto>) {
    this.logger.debug(`Processing MENTION job ${job.id}`);
    await this.handleMentionNotification(job.data);
  }

  // Handler implementations
  private async handleNewMessageNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'New message on PingUp',
        html: `
          <h2>New Message</h2>
          <p>Hi ${user.fullName},</p>
          <p>You have a new message from ${message.data?.senderName || 'someone'}.</p>
          <p>Log in to PingUp to read and respond.</p>
        `,
      });
      this.logger.log(`Email sent for NEW_MESSAGE to ${user.email}`);
    }
  }

  private async handleConnectionRequestNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'New connection request on PingUp',
        html: `
          <h2>Connection Request</h2>
          <p>Hi ${user.fullName},</p>
          <p>${message.data?.senderName || 'Someone'} wants to connect with you on PingUp.</p>
          <p>Log in to accept or decline the request.</p>
        `,
      });
      this.logger.log(`Email sent for CONNECTION_REQUEST to ${user.email}`);
    }
  }

  private async handleConnectionAcceptedNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Connection accepted on PingUp',
        html: `
          <h2>Connection Accepted</h2>
          <p>Hi ${user.fullName},</p>
          <p>${message.data?.accepterName || 'Someone'} accepted your connection request!</p>
          <p>You can now send messages and see their posts.</p>
        `,
      });
      this.logger.log(`Email sent for CONNECTION_ACCEPTED to ${user.email}`);
    }
  }

  private async handleNewFollowerNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendNewFollowerEmail(
        user.email,
        user.fullName,
        message.data?.followerName as string || 'Someone',
      );
      this.logger.log(`Email sent for NEW_FOLLOWER to ${user.email}`);
    }
  }

  private async handlePostLikedNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendPostLikedEmail(
        user.email,
        user.fullName,
        message.data?.likerName as string || 'Someone',
        message.data?.postPreview as string || 'your post',
      );
      this.logger.log(`Email sent for POST_LIKED to ${user.email}`);
    }
  }

  private async handleNewCommentNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendNewCommentEmail(
        user.email,
        user.fullName,
        message.data?.commenterName as string || 'Someone',
        message.data?.commentPreview as string || 'commented on your post',
        message.data?.postPreview as string || 'your post',
      );
      this.logger.log(`Email sent for NEW_COMMENT to ${user.email}`);
    }
  }

  private async handleRepostNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendRepostEmail(
        user.email,
        user.fullName,
        message.data?.reposterName as string || 'Someone',
        message.data?.postPreview as string || 'your post',
      );
      this.logger.log(`Email sent for POST_REPOSTED to ${user.email}`);
    }
  }

  private async handleMentionNotification(message: NotificationEventDto) {
    const user = await this.userRepository.findOne({
      where: { id: message.userId },
    });

    if (user) {
      await this.emailService.sendMentionEmail(
        user.email,
        user.fullName,
        message.data?.mentionerName as string || 'Someone',
        message.data?.content as string || '',
      );
      this.logger.log(`Email sent for MENTION to ${user.email}`);
    }
  }
}
