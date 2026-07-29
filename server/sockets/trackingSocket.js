import Sentry from '../sentry.js';
import { logger } from '../utils/logger.js';

export function setupTrackingSockets(io) {
  io.on('connection', (socket) => {
    logger.info(`[WebSocket Connected] Client ID: ${socket.id}`, { category: 'WEBSOCKET', socketId: socket.id });

    socket.on('error', (err) => {
      logger.error(`[WebSocket Error] Client ID: ${socket.id}`, { category: 'WEBSOCKET', error: err.message });
      Sentry.captureException(err);
    });

    socket.on('join-alert-room', (alertId) => {
      try {
        socket.join(`alert-${alertId}`);
      } catch (err) {
        Sentry.captureException(err);
      }
    });

    socket.on('leave-alert-room', (alertId) => {
      try {
        socket.leave(`alert-${alertId}`);
      } catch (err) {
        Sentry.captureException(err);
      }
    });

    socket.on('join-admin', () => {
      try {
        socket.join('admin-room');
      } catch (err) {
        Sentry.captureException(err);
      }
    });

    socket.on('stream-location', ({ alertId, location, batteryLevel }) => {
      try {
        io.to(`alert-${alertId}`).emit('location-updated', { alertId, location, batteryLevel });
        io.to('admin-room').emit('admin-location-updated', { alertId, location, batteryLevel });
      } catch (err) {
        Sentry.captureException(err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[WebSocket Disconnected] Client ID: ${socket.id}`, { category: 'WEBSOCKET', socketId: socket.id });
    });
  });
}
