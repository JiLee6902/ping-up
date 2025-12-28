import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get('GMAIL_USER'),
        pass: this.configService.get('GMAIL_APP_PASS'),
      },
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('GMAIL_USER'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.debug(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to PingUp!',
      html: `
        <h1>Welcome to PingUp!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining PingUp. We're excited to have you!</p>
        <p>Start connecting with friends and sharing your moments.</p>
      `,
    });
  }

  async sendConnectionRequestEmail(
    to: string,
    recipientName: string,
    senderName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${senderName} wants to connect with you on PingUp`,
      html: `
        <h2>New Connection Request</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${senderName}</strong> has sent you a connection request.</p>
        <p>Log in to PingUp to accept or decline.</p>
      `,
    });
  }

  async sendConnectionAcceptedEmail(
    to: string,
    recipientName: string,
    accepterName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${accepterName} accepted your connection request!`,
      html: `
        <h2>Connection Accepted!</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${accepterName}</strong> has accepted your connection request.</p>
        <p>You can now send messages and see their updates.</p>
      `,
    });
  }

  async sendPostLikedEmail(
    to: string,
    recipientName: string,
    likerName: string,
    postPreview: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${likerName} liked your post`,
      html: `
        <h2>Your Post Was Liked!</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${likerName}</strong> liked your post:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; color: #666;">${postPreview}</blockquote>
        <p>Log in to PingUp to see more.</p>
      `,
    });
  }

  async sendNewCommentEmail(
    to: string,
    recipientName: string,
    commenterName: string,
    commentPreview: string,
    postPreview: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${commenterName} commented on your post`,
      html: `
        <h2>New Comment on Your Post!</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${commenterName}</strong> commented on your post:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; color: #666;">${postPreview}</blockquote>
        <p>Their comment:</p>
        <blockquote style="border-left: 3px solid #3b82f6; padding-left: 10px; color: #333;">${commentPreview}</blockquote>
        <p>Log in to PingUp to reply.</p>
      `,
    });
  }

  async sendRepostEmail(
    to: string,
    recipientName: string,
    reposterName: string,
    postPreview: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${reposterName} shared your post`,
      html: `
        <h2>Your Post Was Shared!</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${reposterName}</strong> shared your post:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; color: #666;">${postPreview}</blockquote>
        <p>Log in to PingUp to see more.</p>
      `,
    });
  }

  async sendMentionEmail(
    to: string,
    recipientName: string,
    mentionerName: string,
    content: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${mentionerName} mentioned you`,
      html: `
        <h2>You Were Mentioned!</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${mentionerName}</strong> mentioned you:</p>
        <blockquote style="border-left: 3px solid #3b82f6; padding-left: 10px; color: #333;">${content}</blockquote>
        <p>Log in to PingUp to respond.</p>
      `,
    });
  }

  async sendNewFollowerEmail(
    to: string,
    recipientName: string,
    followerName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `${followerName} started following you`,
      html: `
        <h2>New Follower!</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${followerName}</strong> started following you on PingUp!</p>
        <p>Check out their profile and follow them back.</p>
      `,
    });
  }
}
