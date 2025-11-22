export interface Room {
    id: string;
    name: string;
    email: string;
    capacity?: number;
}

export interface Booking {
    id: string;
    subject: string;
    start: string;
    end: string;
    organizer: string;
}
