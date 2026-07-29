import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected to backend server');
    });

    return this.socket;
  }

  joinAlertRoom(alertId: string) {
    this.connect().emit('join-alert-room', alertId);
  }

  leaveAlertRoom(alertId: string) {
    if (this.socket) {
      this.socket.emit('leave-alert-room', alertId);
    }
  }

  joinAdmin() {
    this.connect().emit('join-admin');
  }

  streamLocation(alertId: string, location: any, batteryLevel: number) {
    if (this.socket) {
      this.socket.emit('stream-location', { alertId, location, batteryLevel });
    }
  }

  onLocationUpdated(callback: (data: { alertId: string; location: any; batteryLevel: number }) => void) {
    this.connect().on('location-updated', callback);
  }

  onNewAlert(callback: (alert: any) => void) {
    this.connect().on('new-alert', callback);
  }

  onAdminAlertUpdated(callback: (alert: any) => void) {
    this.connect().on('admin-alert-updated', callback);
  }

  onStatusChanged(callback: (data: { alertId: string; status: string }) => void) {
    this.connect().on('status-changed', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
