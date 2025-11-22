import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    if (!id) {
        return new NextResponse("Booking ID is required", { status: 400 });
    }

    try {
        const client = getGraphClient(session.accessToken as string);

        // Delete the event from the user's calendar
        await client.api(`/me/events/${id}`).delete();

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    if (!id) {
        return new NextResponse("Booking ID is required", { status: 400 });
    }

    try {
        const { subject, description, attendees, start, end, isOnlineMeeting } = await request.json();
        const client = getGraphClient(session.accessToken as string);

        const updateData: any = {};

        if (subject) updateData.subject = subject;
        if (description !== undefined) {
            updateData.body = {
                contentType: "HTML",
                content: description,
            };
        }
        if (start && end) {
            updateData.start = { dateTime: start, timeZone: "UTC" };
            updateData.end = { dateTime: end, timeZone: "UTC" };
        }

        if (attendees && Array.isArray(attendees)) {
            const eventAttendees = attendees.map((email: string) => ({
                emailAddress: {
                    address: email.trim(),
                    name: email.trim(),
                },
                type: "required",
            }));
            updateData.attendees = eventAttendees;
        }

        // Update Teams Meeting settings
        if (isOnlineMeeting !== undefined) {
            updateData.isOnlineMeeting = isOnlineMeeting;
            if (isOnlineMeeting) {
                updateData.onlineMeetingProvider = "teamsForBusiness";
            }
        }

        const response = await client.api(`/me/events/${id}`).patch(updateData);

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error updating booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
