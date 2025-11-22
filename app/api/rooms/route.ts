import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getGraphClient } from "@/lib/graph";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const client = getGraphClient(session.accessToken as string);
        // Fetch rooms from MS Graph
        // Note: This requires Place.Read.All permission
        const response = await client.api("/places/microsoft.graph.room").get();

        const rooms = response.value.map((room: any) => ({
            id: room.id,
            name: room.displayName,
            email: room.emailAddress,
            capacity: room.capacity,
        }));

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
