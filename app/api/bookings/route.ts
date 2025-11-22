import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { subject, start, end, roomId, roomEmail, description, attendees, isOnlineMeeting } = await request.json();
        const client = getGraphClient(session.accessToken as string);

        const eventAttendees = [
            {
                emailAddress: {
                    address: roomEmail,
                    name: "Meeting Room",
                },
                type: "resource",
            },
        ];

        if (attendees && Array.isArray(attendees)) {
            attendees.forEach((email: string) => {
                if (email && email.trim() !== "") {
                    eventAttendees.push({
                        emailAddress: {
                            address: email.trim(),
                            name: email.trim(), // Graph will resolve name if possible
                        },
                        type: "required",
                    });
                }
            });
        }

        const event: any = {
            subject: subject,
            body: {
                contentType: "HTML",
                content: description || "",
            },
            start: {
                dateTime: start,
                timeZone: "UTC",
            },
            end: {
                dateTime: end,
                timeZone: "UTC",
            },
            location: {
                displayName: roomEmail, // Or room name
                locationEmailAddress: roomEmail,
            },
            attendees: eventAttendees,
        };

        // Add Teams Meeting if requested
        if (isOnlineMeeting) {
            event.isOnlineMeeting = true;
            event.onlineMeetingProvider = "teamsForBusiness";
        }

        // Create event in user's calendar
        const response = await client.api("/me/events").post(event);

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error creating booking:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
