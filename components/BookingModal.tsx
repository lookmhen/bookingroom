"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format, addMinutes, setHours, setMinutes, startOfDay, isBefore, isEqual, isAfter } from "date-fns";
import Toast from "./Toast";
import ConfirmDialog from "./ConfirmDialog";

interface Booking {
    id: string;
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location: { displayName: string };
    preview: string;
    attendees?: { emailAddress: { address: string; name: string } }[];
}

interface BookingModalProps {
    booking: Booking;
    onClose: () => void;
    onUpdate: () => void;
}

export default function BookingModal({ booking, onClose, onUpdate }: BookingModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<any[]>([]);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Helper to parse date safely
    const parseBookingDate = (dateStr: string) => {
        try {
            if (!dateStr) return new Date();
            const cleanStr = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
            return new Date(cleanStr);
        } catch (e) {
            return new Date();
        }
    };

    // Form State
    const [subject, setSubject] = useState(booking.subject);
    const [description, setDescription] = useState(booking.preview || "");
    const [attendees, setAttendees] = useState(
        booking.attendees?.map((a) => a.emailAddress.address).join(", ") || ""
    );
    const [isOnlineMeeting, setIsOnlineMeeting] = useState(false);

    const [selectedDate, setSelectedDate] = useState(parseBookingDate(booking.start.dateTime));
    const [startSlot, setStartSlot] = useState<Date | null>(parseBookingDate(booking.start.dateTime));
    const [endSlot, setEndSlot] = useState<Date | null>(parseBookingDate(booking.end.dateTime));

    // Extract room email from booking location
    const roomEmail = booking.location?.displayName || "";

    // Sync state if booking prop changes
    useEffect(() => {
        setSubject(booking.subject);
        setDescription(booking.preview || "");
        setAttendees(booking.attendees?.map((a) => a.emailAddress.address).join(", ") || "");

        const start = parseBookingDate(booking.start.dateTime);
        const end = parseBookingDate(booking.end.dateTime);

        setSelectedDate(start);
        setStartSlot(start);
        setEndSlot(end);
    }, [booking]);

    // Generate time slots from 08:00 to 18:00 based on selectedDate
    const timeSlots: Date[] = [];
    let currentTime = setMinutes(setHours(startOfDay(selectedDate), 8), 0);
    const endTimeSlot = setMinutes(setHours(startOfDay(selectedDate), 18), 0);

    while (currentTime < endTimeSlot) {
        timeSlots.push(currentTime);
        currentTime = addMinutes(currentTime, 30);
    }

    // Check for conflicts when time selection changes
    useEffect(() => {
        if (startSlot && endSlot && roomEmail && isEditing) {
            checkAvailability();
        } else {
            setHasConflict(false);
            setConflictDetails([]);
        }
    }, [startSlot, endSlot, selectedDate, isEditing]);

    const checkAvailability = async () => {
        if (!startSlot || !endSlot || !roomEmail) return;

        setCheckingConflict(true);
        try {
            const res = await fetch("/api/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomEmails: [roomEmail],
                    startTime: startSlot.toISOString(),
                    endTime: endSlot.toISOString(),
                    excludeEventId: booking.id,
                    checkConflicts: true,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setHasConflict(data.hasConflict || false);
                setConflictDetails(data.conflicts || []);
            }
        } catch (error) {
            console.error("Error checking availability:", error);
        } finally {
            setCheckingConflict(false);
        }
    };

    const handleSlotClick = (slot: Date) => {
        if (!startSlot || (startSlot && endSlot)) {
            setStartSlot(slot);
            setEndSlot(null);
        } else {
            if (isBefore(slot, startSlot)) {
                setStartSlot(slot);
                setEndSlot(null);
            } else {
                setEndSlot(addMinutes(slot, 30));
            }
        }
    };

    const handleSave = async () => {
        if (!startSlot || !endSlot) {
            setToast({ message: "Please select a time range.", type: "error" });
            return;
        }

        // Block save if there's a conflict
        if (hasConflict) {
            setToast({ message: "Cannot save: Time slot conflicts with another booking.", type: "error" });
            return;
        }

        setLoading(true);
        try {
            const attendeeList = attendees.split(",").map(e => e.trim()).filter(e => e);

            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    description,
                    attendees: attendeeList,
                    start: startSlot.toISOString(),
                    end: endSlot.toISOString(),
                    isOnlineMeeting: isOnlineMeeting,
                }),
            });

            if (res.ok) {
                setToast({ message: "Booking updated successfully!", type: "success" });
                setTimeout(() => {
                    onUpdate();
                    onClose();
                }, 1500);
            } else {
                setToast({ message: "Failed to update booking.", type: "error" });
            }
        } catch (error) {
            console.error("Update error", error);
            setToast({ message: "An error occurred.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = () => {
        setShowCancelConfirm(true);
    };

    const confirmCancelBooking = async () => {
        setShowCancelConfirm(false);
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${booking.id}`, {
                method: "DELETE",
            });

            if (res.ok || res.status === 204) {
                setToast({ message: "Booking cancelled.", type: "success" });
                setTimeout(() => {
                    onUpdate();
                    onClose();
                }, 1500);
            } else {
                setToast({ message: "Failed to cancel booking.", type: "error" });
            }
        } catch (error) {
            console.error("Cancel error", error);
            setToast({ message: "An error occurred.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-[95vw] max-w-7xl rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {isEditing ? "Edit Booking" : "Booking Details"}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {isEditing ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subject</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={5}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Attendees</label>
                                        <input
                                            type="text"
                                            value={attendees}
                                            onChange={(e) => setAttendees(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Comma separated emails</p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Teams Meeting</p>
                                                <p className="text-xs text-purple-600 dark:text-purple-400">Add online meeting link</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsOnlineMeeting(!isOnlineMeeting)}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${isOnlineMeeting ? 'bg-purple-600' : 'bg-gray-300 dark:bg-zinc-700'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${isOnlineMeeting ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-zinc-800/30 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800">
                                    <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Date & Time</label>
                                    <input
                                        type="date"
                                        value={format(selectedDate, "yyyy-MM-dd")}
                                        onChange={(e) => {
                                            const newDate = new Date(e.target.value);
                                            if (!isNaN(newDate.getTime())) {
                                                setSelectedDate(newDate);
                                                setStartSlot(null);
                                                setEndSlot(null);
                                            }
                                        }}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                                    />

                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {timeSlots.map((slot, idx) => {
                                            let isSelected = false;
                                            if (startSlot && endSlot) {
                                                isSelected = (isAfter(slot, startSlot) || isEqual(slot, startSlot)) && isBefore(slot, endSlot);
                                            } else if (startSlot) {
                                                isSelected = isEqual(slot, startSlot);
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSlotClick(slot)}
                                                    className={`p-3 text-sm font-medium rounded-xl transition-all duration-200 ${isSelected
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-105"
                                                            : "bg-white dark:bg-zinc-900 text-gray-600 border border-gray-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-md"
                                                        }`}
                                                >
                                                    {format(slot, "HH:mm")}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {startSlot && endSlot && (
                                        <>
                                            <div className={`mt-6 p-4 rounded-xl text-center border ${hasConflict
                                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                                                }`}>
                                                <p className={`text-sm mb-1 ${hasConflict ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    Selected Time
                                                </p>
                                                <p className={`text-lg font-bold ${hasConflict ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                                    {format(startSlot, "HH:mm")} - {format(endSlot, "HH:mm")}
                                                </p>
                                                {checkingConflict && (
                                                    <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Checking availability...
                                                    </p>
                                                )}
                                            </div>
                                            {hasConflict && (
                                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                                    <div className="flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        <div>
                                                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                                                Time Conflict Detected
                                                            </p>
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                                This time slot overlaps with another booking. Please select a different time.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                                                {format(parseBookingDate(booking.start.dateTime), "MMMM d, yyyy")}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {format(parseBookingDate(booking.start.dateTime), "HH:mm")} - {format(parseBookingDate(booking.end.dateTime), "HH:mm")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Location</p>
                                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{booking.location.displayName}</p>
                                        </div>
                                    </div>
                                </div>

                                {booking.preview && (
                                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 h-full">
                                        <p className="text-sm text-gray-500 mb-2 font-medium">Description</p>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{booking.preview}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-700 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || hasConflict || checkingConflict}
                            >
                                {loading ? "Saving..." : hasConflict ? "Conflict Detected" : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancelBooking}
                                className="px-6 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                                disabled={loading}
                            >
                                {loading ? "Cancelling..." : "Cancel Booking"}
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2.5 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium shadow-lg dark:shadow-none"
                            >
                                Edit Booking
                            </button>
                        </>
                    )}
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmDialog
                isOpen={showCancelConfirm}
                title="Cancel Booking"
                message={`Are you sure you want to cancel "${booking.subject}"? This action cannot be undone.`}
                confirmText="Yes, Cancel Booking"
                cancelText="No, Keep It"
                confirmVariant="danger"
                onConfirm={confirmCancelBooking}
                onCancel={() => setShowCancelConfirm(false)}
            />
        </div>,
        document.body
    );
}
