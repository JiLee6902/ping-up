import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/entity';
import { EmailService } from '@app/external-infra/email';
import { KafkaProducerService, NotificationEventDto } from '@app/external-infra/kafka';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationConsumer.name);
  private consumer: Consumer;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    const kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID', 'pingup'),
      brokers: this.configService
        .get('KAFKA_BROKERS', 'localhost:9092')
        .split(','),
    });

    this.consumer = kafka.consumer({
      groupId: this.configService.get('KAFKA_CONSUMER_GROUP', 'pingup-group'),
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: this.configService.get(
          'KAFKA_TOPIC_NOTIFICATIONS',
          'notifications',
        ),
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('Kafka consumer connected and listening for notifications');
    } catch (error) {
      this.logger.error(`Failed to connect Kafka consumer: ${error.message}`);
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    try {
      const message = JSON.parse(
        payload.message.value?.toString() || '{}',
      ) as NotificationEventDto;

      this.logger.debug(`Received notification: ${message.type}`);

      switch (message.type) {
        case 'NEW_MESSAGE':
          await this.handleNewMessageNotification(message);
          break;
        case 'CONNECTION_REQUEST':
          await this.handleConnectionRequestNotification(message);
          break;
        case 'CONNECTION_ACCEPTED':
          await this.handleConnectionAcceptedNotification(message);
          break;
        case 'NEW_FOLLOWER':
          await this.handleNewFollowerNotification(message);
          break;
        case 'POST_LIKED':
          await this.handlePostLikedNotification(message);
          break;
        case 'NEW_COMMENT':
          await this.handleNewCommentNotification(message);
          break;
        case 'POST_REPOSTED':
          await this.handleRepostNotification(message);
          break;
        case 'MENTION':
          await this.handleMentionNotification(message);
          break;
        default:
          this.logger.warn(`Unknown notification type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle notification: ${error.message}`);
    }
  }

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
        String(message.data?.followerName || 'Someone'),
      );
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
        String(message.data?.likerName || 'Someone'),
        String(message.data?.postPreview || 'your post'),
      );
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
        String(message.data?.commenterName || 'Someone'),
        String(message.data?.commentPreview || 'commented on your post'),
        String(message.data?.postPreview || 'your post'),
      );
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
        String(message.data?.reposterName || 'Someone'),
        String(message.data?.postPreview || 'your post'),
      );
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
        String(message.data?.mentionerName || 'Someone'),
        String(message.data?.content || ''),
      );
    }
  }
}
