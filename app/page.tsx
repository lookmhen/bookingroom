import LoginButton from "@/components/LoginButton";
import RoomList from "@/components/RoomList";
import MyBookings from "@/components/MyBookings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
    const session = await getServerSession(authOptions);

    return (
        <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-red-100 to-yellow-100 dark:from-indigo-900 dark:via-purple-900 dark:to-zinc-900 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 pb-2">
                            Meeting Room Booking
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                            Simple, fast, and efficient room management.
                        </p>
                    </div>
                    <div className="bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-white/20">
                        <LoginButton />
                    </div>
                </header>

                {session ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Room List */}
                        <div className="lg:col-span-2 space-y-8">
                            <RoomList />
                        </div>

                        {/* Sidebar - My Bookings */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <MyBookings />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome Back!</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md text-lg">
                            Please sign in to view available rooms and manage your bookings.
                        </p>
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <LoginButton />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
