import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph";
import { authOptions } from "@/lib/auth";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const client = getGraphClient(session.accessToken as string);

        // Fetch events for the next 30 days
        const start = startOfDay(new Date()).toISOString();
        const end = endOfDay(addDays(new Date(), 30)).toISOString();

        const response = await client
            .api("/me/calendarView")
            .query({
                startDateTime: start,
                endDateTime: end,
                $select: "subject,start,end,location,attendees,bodyPreview",
                $orderby: "start/dateTime",
                $top: 50,
            })
            .get();

        const bookings = response.value.map((event: any) => ({
            id: event.id,
            subject: event.subject,
            start: event.start,
            end: event.end,
            location: event.location,
            attendees: event.attendees,
            preview: event.bodyPreview,
        }));

        return NextResponse.json(bookings);
    } catch (error: any) {
        console.error("Error fetching bookings:", error);

        // Check if error is due to expired token
        if (error?.statusCode === 401 || error?.code === 'InvalidAuthenticationToken') {
            return NextResponse.json(
                { error: 'TOKEN_EXPIRED', message: 'Your session has expired. Please sign in again.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'FETCH_FAILED', message: 'Failed to fetch bookings.' },
            { status: 500 }
        );
    }
}
