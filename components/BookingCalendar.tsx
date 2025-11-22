"use client";

import { useState, useEffect } from "react";
import { format, startOfDay, endOfDay, addMinutes, isBefore, isAfter, isEqual, setHours, setMinutes } from "date-fns";
import { Room } from "@/types";
import Toast from "./Toast";

interface ScheduleItem {
    scheduleId: string;
    availabilityView: string;
    scheduleItems: {
        status: string;
        start: { dateTime: string; timeZone: string };
        end: { dateTime: string; timeZone: string };
        subject?: string;
    }[];
}

interface BookingCalendarProps {
    room: Room;
    onClose: () => void;
}

export default function BookingCalendar({ room, onClose }: BookingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedules, setSchedules] = useState<ScheduleItem | null>(null);
    const [loading, setLoading] = useState(false);

    // Range selection state
    const [startSlot, setStartSlot] = useState<Date | null>(null);
    const [endSlot, setEndSlot] = useState<Date | null>(null);

    const [bookingSubject, setBookingSubject] = useState("");
    const [bookingDescription, setBookingDescription] = useState("");
    const [attendees, setAttendees] = useState("");
    const [isOnlineMeeting, setIsOnlineMeeting] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    useEffect(() => {
        fetchAvailability();
        setStartSlot(null);
        setEndSlot(null);
    }, [selectedDate]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const start = startOfDay(selectedDate).toISOString();
            const end = endOfDay(selectedDate).toISOString();

            const res = await fetch("/api/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomEmails: [room.email],
                    startTime: start,
                    endTime: end,
                }),
            });
            const data = await res.json();
            if (data && data.length > 0) {
                setSchedules(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch availability", error);
            setToast({ message: "Failed to load availability", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!startSlot || !endSlot || !bookingSubject) return;
        setIsBooking(true);
        try {
            const attendeeList = attendees.split(",").map(e => e.trim()).filter(e => e);
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: bookingSubject,
                    description: bookingDescription,
                    attendees: attendeeList,
                    start: startSlot.toISOString(),
                    end: endSlot.toISOString(),
                    roomId: room.id,
                    roomEmail: room.email,
                    isOnlineMeeting: isOnlineMeeting,
                }),
            });

            if (res.ok) {
                setToast({ message: "Booking successful!", type: "success" });
                setTimeout(onClose, 2000);
            } else {
                setToast({ message: "Booking failed. Please try again.", type: "error" });
            }
        } catch (error) {
            console.error("Booking error", error);
            setToast({ message: "An unexpected error occurred.", type: "error" });
        } finally {
            setIsBooking(false);
        }
    };

    // Generate time slots from 08:00 to 18:00
    const timeSlots = [];
    let currentTime = setMinutes(setHours(startOfDay(selectedDate), 8), 0);
    const endTime = setMinutes(setHours(startOfDay(selectedDate), 18), 0);

    while (currentTime < endTime) {
        timeSlots.push(currentTime);
        currentTime = addMinutes(currentTime, 30);
    }

    const getBlockedDetails = (time: Date) => {
        if (!schedules?.scheduleItems) return null;
        return schedules.scheduleItems.find((item) => {
            const itemStart = new Date(item.start.dateTime + "Z");
            const itemEnd = new Date(item.end.dateTime + "Z");
            return time >= itemStart && time < itemEnd;
        });
    };

    const handleSlotClick = (slot: Date) => {
        const blockedItem = getBlockedDetails(slot);
        if (blockedItem) {
            const startStr = format(new Date(blockedItem.start.dateTime + "Z"), "HH:mm");
            const endStr = format(new Date(blockedItem.end.dateTime + "Z"), "HH:mm");
            setToast({ message: `Slot booked: ${startStr} - ${endStr} (${blockedItem.status})`, type: "info" });
            return;
        }

        if (!startSlot || (startSlot && endSlot)) {
            setStartSlot(slot);
            setEndSlot(null);
        } else {
            if (isBefore(slot, startSlot)) {
                setStartSlot(slot);
                setEndSlot(null);
            } else {
                let isValid = true;
                let checkTime = startSlot;
                while (checkTime <= slot) {
                    if (getBlockedDetails(checkTime)) {
                        isValid = false;
                        break;
                    }
                    checkTime = addMinutes(checkTime, 30);
                }

                if (isValid) {
                    setEndSlot(addMinutes(slot, 30));
                } else {
                    setToast({ message: "Cannot select range with blocked slots.", type: "error" });
                    setStartSlot(slot);
                    setEndSlot(null);
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-zinc-700/50">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Book {room.name}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">{room.email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
                        <input
                            type="date"
                            value={format(selectedDate, "yyyy-MM-dd")}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex flex-col justify-end">
                        <div className="flex gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 p-3 rounded-xl">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div> Available</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div> Booked</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div> Selected</div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Time Slots (08:00 - 18:00)</h3>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {timeSlots.map((slot, idx) => {
                                const blockedItem = getBlockedDetails(slot);
                                const isBlocked = !!blockedItem;

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
                                        className={`p-2 text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${isBlocked
                                            ? "bg-red-50 text-red-400 cursor-not-allowed border border-red-100"
                                            : isSelected
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                : "bg-white dark:bg-zinc-800 text-gray-600 border border-gray-100 dark:border-zinc-700 hover:border-green-400 hover:text-green-600"
                                            }`}
                                    >
                                        {format(slot, "HH:mm")}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {startSlot && endSlot && (
                    <div className="animate-in slide-in-from-bottom-4 duration-300 border-t border-gray-100 dark:border-zinc-800 pt-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Confirm Booking</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6 flex items-center gap-3 text-blue-700 dark:text-blue-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-medium">{format(startSlot, "HH:mm")} - {format(endSlot, "HH:mm")}</span>
                            <span className="text-blue-400">|</span>
                            <span>{format(selectedDate, "MMMM d, yyyy")}</span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Subject <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={bookingSubject}
                                    onChange={(e) => setBookingSubject(e.target.value)}
                                    placeholder="e.g. Weekly Sync"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    value={bookingDescription}
                                    onChange={(e) => setBookingDescription(e.target.value)}
                                    placeholder="Meeting agenda..."
                                    rows={3}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Attendees</label>
                                <input
                                    type="text"
                                    value={attendees}
                                    onChange={(e) => setAttendees(e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">Separate multiple emails with commas</p>
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

                        <button
                            onClick={handleBook}
                            disabled={isBooking || !bookingSubject}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBooking ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : "Confirm Booking"}
                        </button>
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
