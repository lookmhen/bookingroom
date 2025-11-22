"use client";

import { Room } from "@/types";
import { useState, useMemo } from "react";
import BookingCalendar from "./BookingCalendar";

export default function RoomList() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [capacityFilter, setCapacityFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/rooms");
            const data = await res.json();
            setRooms(data);
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort rooms
    const filteredAndSortedRooms = useMemo(() => {
        let filtered = rooms;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(room =>
                room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply capacity filter
        if (capacityFilter !== "all") {
            filtered = filtered.filter(room => {
                const capacity = room.capacity || 0;
                switch (capacityFilter) {
                    case "small": return capacity >= 2 && capacity <= 4;
                    case "medium": return capacity >= 5 && capacity <= 10;
                    case "large": return capacity > 10;
                    default: return true;
                }
            });
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            } else if (sortBy === "capacity") {
                return (a.capacity || 0) - (b.capacity || 0);
            }
            return 0;
        });

        return sorted;
    }, [rooms, searchQuery, capacityFilter, sortBy]);

    const clearFilters = () => {
        setSearchQuery("");
        setCapacityFilter("all");
        setSortBy("name");
    };

    const hasActiveFilters = searchQuery || capacityFilter !== "all" || sortBy !== "name";

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </span>
                    Available Rooms
                </h2>
                <button
                    onClick={fetchRooms}
                    className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all active:scale-95"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="mb-6 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 dark:border-zinc-700/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Capacity Filter */}
                    <div>
                        <select
                            value={capacityFilter}
                            onChange={(e) => setCapacityFilter(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="all">All Sizes</option>
                            <option value="small">Small (2-4)</option>
                            <option value="medium">Medium (5-10)</option>
                            <option value="large">Large (10+)</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="capacity">Sort by Capacity</option>
                        </select>
                    </div>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 bg-white/50 dark:bg-zinc-800/50 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAndSortedRooms.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white/50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
                            {rooms.length === 0 ? (
                                <p className="text-gray-500">No rooms found. Try refreshing.</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-gray-500">No rooms match your filters.</p>
                                    <button
                                        onClick={clearFilters}
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        filteredAndSortedRooms.map((room) => (
                            <div key={room.id} className="group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20 dark:border-zinc-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-1">{room.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                {room.email}
                                            </p>
                                        </div>
                                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                                            {room.capacity ? `${room.capacity} Seats` : 'Meeting Room'}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedRoom(room)}
                                    className="relative z-10 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl hover:from-blue-500 hover:to-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:gap-3"
                                >
                                    <span>Book Now</span>
                                    <svg className="w-4 h-4 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {selectedRoom && (
                <BookingCalendar room={selectedRoom} onClose={() => setSelectedRoom(null)} />
            )}
        </div>
    );
}
