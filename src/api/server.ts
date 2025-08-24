import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import path from 'node:path';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

export class APIServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketServer;
  private port: number;
  private DASH_DIR: string;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        methods: ['GET', 'POST']
      }
    });
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.DASH_DIR = path.resolve(process.cwd(), 'dashboard');

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // Security middleware (disable CSP if your dashboard uses inline scripts)
    this.app.use(helmet({ contentSecurityPolicy: false }));

    // CORS (harmless even if same-origin; can remove later)
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true
    }));

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health checks (both paths for compatibility)
    this.app.get('/health', (_req, res) =>
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    );
    this.app.get('/api/health', (_req, res) =>
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    );

    // Runtime config so the dashboard always knows the right API base
    this.app.get('/runtime-config.js', (req, res) => {
      const apiBase = `${req.protocol}://${req.get('host')}/api`;
      res
        .type('application/javascript')
        .send(`window.APP_CONFIG = Object.assign({}, window.APP_CONFIG||{}, { API_BASE: "${apiBase}" });`);
    });

    // Serve dashboard static files (same origin)
    this.app.use('/', express.static(path.join(this.DASH_DIR, 'static'), { fallthrough: true }));

    // Dashboard entry
    this.app.get('/', (_req, res) =>
      res.sendFile(path.join(this.DASH_DIR, 'index.html'))
    );
  }

  private setupRoutes(): void {
    // Import route files
    const { streamersRouter } = require('./routes/streamers');
    const { subscriptionsRouter } = require('./routes/subscriptions');
    const { eventsRouter } = require('./routes/events');
    const { dashboardRouter } = require('./routes/dashboard');
    const scrapersRouter = require('./routes/scrapers').default;
    const { dataExportRouter } = require('./routes/data-export');

    // API routes
    this.app.use('/api/streamers', streamersRouter);
    this.app.use('/api/subscriptions', subscriptionsRouter);
    this.app.use('/api/events', eventsRouter);
    this.app.use('/api/dashboard', dashboardRouter);
    this.app.use('/api/scrapers', scrapersRouter);
    this.app.use('/api/data-export', dataExportRouter);

    // Error handling middleware
    this.app.use((
      error: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      logger.error('API Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.debug(`WebSocket client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.debug(`WebSocket client disconnected: ${socket.id}`);
      });

      socket.on('join-guild', (guildId: string) => {
        socket.join(`guild-${guildId}`);
        logger.debug(`Socket ${socket.id} joined guild room: ${guildId}`);
      });

      socket.on('leave-guild', (guildId: string) => {
        socket.leave(`guild-${guildId}`);
        logger.debug(`Socket ${socket.id} left guild room: ${guildId}`);
      });
    });
  }

  public getSocketServer(): SocketServer {
    return this.io;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, () => {
          logger.info(`API & Dashboard on http://localhost:${this.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('API server stopped');
        resolve();
      });
    });
  }
}
