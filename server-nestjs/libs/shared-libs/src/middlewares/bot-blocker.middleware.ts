import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BotBlockerMiddleware implements NestMiddleware {
  // Suspicious paths that bots commonly scan
  private readonly blockedPatterns: RegExp[] = [
    /\/api\/v1\/(finchat|account|tokens)/i,
    /\/api\/(login|auth|register|resetpassword|authentication)$/i,
    /\/api\/auth\/v1/i,
    /\/(wp-admin|wp-login|wordpress|xmlrpc)/i,
    /\/(phpmyadmin|pma|mysql|adminer)/i,
    /\/(\.env|\.git|\.aws|\.ssh)/i,
    /\/(admin|administrator|manager|console)$/i,
    /\/(config|backup|dump|sql)/i,
    /\.(php|asp|aspx|jsp|cgi)$/i,
    /\/oauth\/(token|ticket|authorize)/i,
  ];

  // Suspicious user agents
  private readonly blockedUserAgents: RegExp[] = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /python-requests\/2\.[0-9]+/i,
    /curl\/[0-9]/i,
    /wget/i,
    /scanner/i,
    /bot(?!.*google|.*bing|.*facebook)/i,
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    const userAgent = req.headers['user-agent'] || '';

    // Check blocked paths
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(path)) {
        return res.status(403).end();
      }
    }

    // Check blocked user agents
    for (const pattern of this.blockedUserAgents) {
      if (pattern.test(userAgent)) {
        return res.status(403).end();
      }
    }

    next();
  }
}
