import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private groq: Groq;

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get('GROQ_API_KEY', ''),
    });
  }

  async transcribeAudio(file: Express.Multer.File): Promise<string | null> {
    try {
      const audioFile = new File(
        [new Uint8Array(file.buffer)],
        file.originalname,
        { type: file.mimetype || 'audio/webm' },
      );

      const transcription = await this.groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        language: 'vi',
      });

      this.logger.debug(`Audio transcribed: ${transcription.text}`);
      return transcription.text || null;
    } catch (error) {
      this.logger.error(`Failed to transcribe audio: ${error.message}`);
      return null;
    }
  }

  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string | null> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || null;
      this.logger.debug(`Chat completion response: ${response?.substring(0, 100)}`);
      return response;
    } catch (error) {
      this.logger.error(`Chat completion failed: ${error.message}`);
      return null;
    }
  }
}
