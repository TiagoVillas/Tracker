import { NextRequest, NextResponse } from "next/server";
import { createDocumentWithPermission } from "@/lib/firebase/firebaseUtils";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { content, userId } = data;

    if (!content || !userId) {
      return NextResponse.json(
        { error: "content and userId are required" },
        { status: 400 }
      );
    }

    // Criar nova nota usando a função utilitária
    const newNote = await createDocumentWithPermission(
      "dailyNotes",
      { content },
      userId
    );

    return NextResponse.json({ 
      success: true,
      noteId: newNote.id,
      message: "Note created successfully" 
    });
  } catch (error: any) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
} 