import { Controller, Get, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Controller()
export class ViewController {
  @Get(['/', '/work/*', '/admin', '/admin/*', '/login'])
  async render(@Req() req: Request, @Res() res: Response) {
    const indexPath = join(process.cwd(), 'dist', 'client', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ message: 'Client build not found' });
    }
  }
}
