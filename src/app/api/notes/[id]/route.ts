import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const noteId = params.id;
    const data = await request.json();
    const { content } = data;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verificar se a nota existe e pertence ao usuário
    const noteRef = doc(db, "dailyNotes", noteId);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists()) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    const noteData = noteSnap.data();
    if (noteData.userId !== user.uid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Atualizar a nota
    await updateDoc(noteRef, {
      content,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
} 