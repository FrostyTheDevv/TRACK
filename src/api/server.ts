import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

export class APIServer {
    private app: express.Application;
    private server: http.Server;
    private io: SocketServer;
    private port: number;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new SocketServer(this.server, {
            cors: {
                origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });
        this.port = parseInt(process.env.PORT || '3001');

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet());
        
        // CORS
        this.app.use(cors({
            origin: [
                process.env.CORS_ORIGIN || 'http://localhost:3000',
                'null', // Allow file:// protocol requests
                'http://localhost:3001'
            ],
            credentials: true
        }));

        // Logging
        this.app.use(morgan('combined'));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
    }

    private setupRoutes(): void {
        // Import route files
        const { streamersRouter } = require('./routes/streamers');
        const { subscriptionsRouter } = require('./routes/subscriptions');
        const { eventsRouter } = require('./routes/events');
        const { dashboardRouter } = require('./routes/dashboard');
        const scrapersRouter = require('./routes/scrapers').default;
        const { dataExportRouter } = require('./routes/data-export');
        
        // API routes - re-enabling one by one to test
        this.app.use('/api/streamers', streamersRouter);
        this.app.use('/api/subscriptions', subscriptionsRouter);
        this.app.use('/api/events', eventsRouter);
        this.app.use('/api/dashboard', dashboardRouter);
        this.app.use('/api/scrapers', scrapersRouter);
        this.app.use('/api/data-export', dataExportRouter);

        // Catch-all route - commented out to debug path-to-regexp error
        // this.app.all('*', (req, res) => {
        //     res.status(404).json({ error: 'Route not found' });
        // });

        // Error handling middleware
        this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

            // Join room for specific guild updates
            socket.on('join-guild', (guildId: string) => {
                socket.join(`guild-${guildId}`);
                logger.debug(`Socket ${socket.id} joined guild room: ${guildId}`);
            });

            // Leave guild room
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
                    logger.info(`API server started on port ${this.port}`);
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
