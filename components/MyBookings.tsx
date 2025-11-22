"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { signOut } from "next-auth/react";
import BookingModal from "./BookingModal";
import Toast from "./Toast";

interface Booking {
    id: string;
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location: { displayName: string };
    preview: string;
    attendees?: { emailAddress: { address: string; name: string } }[];
}

export default function MyBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/my-bookings");
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            } else if (res.status === 401) {
                // Handle expired token
                const errorData = await res.json().catch(() => ({}));
                if (errorData.error === 'TOKEN_EXPIRED') {
                    setToast({
                        message: "Session expired. Please sign in again.",
                        type: "error"
                    });
                    // Auto sign out after showing toast
                    setTimeout(() => {
                        signOut({ callbackUrl: '/' });
                    }, 2000);
                }
            } else {
                setToast({ message: "Failed to load bookings.", type: "error" });
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
            setToast({ message: "An error occurred while loading bookings.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-20 bg-white/50 dark:bg-zinc-800/50 rounded-xl"></div>;
    }

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 dark:border-zinc-700/50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Upcoming Bookings
                </h2>
                <button
                    onClick={fetchBookings}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500"
                    title="Refresh"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No upcoming bookings found.</p>
                ) : (
                    bookings.map((booking) => (
                        <div
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className="group p-4 rounded-xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                                        {booking.subject || "No Subject"}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>
                                            {format(new Date(booking.start.dateTime + "Z"), "MMM d, HH:mm")} -{" "}
                                            {format(new Date(booking.end.dateTime + "Z"), "HH:mm")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span>{booking.location.displayName}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                                        Upcoming
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">Click to manage</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {selectedBooking && (
                <BookingModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onUpdate={fetchBookings}
                />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
