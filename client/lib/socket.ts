import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
// Extract base origin (e.g., http://localhost:5001) from the API URL
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                autoConnect: true,
                transports: ['polling', 'websocket']
            });

        }
        return this.socket;
    }

    joinTrip(tripId: string) {
        const s = this.connect();
        if (s) {
            s.emit('join_trip', { tripId });

        }
    }

    leaveTrip(tripId: string) {
        if (this.socket) {
            this.socket.emit('leave_trip', { tripId });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
