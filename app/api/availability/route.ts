import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json(
            { error: 'UNAUTHORIZED', message: 'Authentication required.' },
            { status: 401 }
        );
    }

    try {
        const { roomEmails, startTime, endTime, excludeEventId, checkConflicts } = await request.json();
        const client = getGraphClient(session.accessToken as string);

        // https://learn.microsoft.com/en-us/graph/api/calendar-getschedule
        const response = await client.api("/me/calendar/getSchedule").post({
            schedules: roomEmails,
            startTime: {
                dateTime: startTime,
                timeZone: "UTC",
            },
            endTime: {
                dateTime: endTime,
                timeZone: "UTC",
            },
            availabilityViewInterval: 30,
        });

        // If checking for conflicts, parse the schedule items
        if (checkConflicts && response.value && response.value.length > 0) {
            const schedule = response.value[0];
            const conflicts = (schedule.scheduleItems || []).filter((item: any) => {
                // Filter out the event being edited
                if (excludeEventId && item.scheduleId === excludeEventId) {
                    return false;
                }
                // Only return busy/tentative slots
                return item.status === "busy" || item.status === "tentative";
            });

            return NextResponse.json({
                schedules: response.value,
                hasConflict: conflicts.length > 0,
                conflicts: conflicts.map((item: any) => ({
                    start: item.start,
                    end: item.end,
                    status: item.status,
                    subject: item.subject,
                })),
            });
        }

        return NextResponse.json(response.value);
    } catch (error: any) {
        console.error("Error fetching availability:", error);

        // Check if error is due to expired token
        if (error?.statusCode === 401 || error?.code === 'InvalidAuthenticationToken') {
            return NextResponse.json(
                { error: 'TOKEN_EXPIRED', message: 'Your session has expired. Please sign in again.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'FETCH_FAILED', message: 'Failed to fetch availability.' },
            { status: 500 }
        );
    }
}
