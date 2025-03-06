import { NextRequest, NextResponse } from "next/server";
import { updateDocumentWithPermission } from "@/lib/firebase/firebaseUtils";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { noteId, content, userId } = data;

    if (!noteId || !content || !userId) {
      return NextResponse.json(
        { error: "noteId, content, and userId are required" },
        { status: 400 }
      );
    }

    // Atualizar a nota usando a função utilitária
    await updateDocumentWithPermission(
      "dailyNotes",
      noteId,
      { content },
      userId
    );

    return NextResponse.json({ 
      success: true,
      message: "Note updated successfully" 
    });
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update note" },
      { status: 500 }
    );
  }
} 