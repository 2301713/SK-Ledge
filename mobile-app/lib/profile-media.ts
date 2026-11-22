import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export type PickedAvatar = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export type AvatarPickResult =
  | { status: "picked"; avatar: PickedAvatar }
  | { status: "cancelled" }
  | { status: "error"; message: string };

const extensionFor = (mimeType: string, fileName: string) => {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";

  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName === "png" || fromName === "webp" || fromName === "jpg" || fromName === "jpeg") {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  return "jpg";
};

/** Opens the photo library and returns a square, size-checked image. */
export async function pickAvatarImage(): Promise<AvatarPickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      status: "error",
      message:
        "Allow photo access in your device settings to change your profile photo.",
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) {
    return { status: "cancelled" };
  }

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > AVATAR_MAX_BYTES) {
    return { status: "error", message: "Choose an image smaller than 5 MB." };
  }

  return {
    status: "picked",
    avatar: {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? "avatar.jpg",
    },
  };
}

type AvatarStorageError = {
  message?: string;
  statusCode?: string;
  error?: string;
};

/** Turns storage/database failures into instructions the vendor can act on. */
export function describeAvatarError(error: AvatarStorageError): string {
  const message = (error.message ?? "").toLowerCase();
  const status = error.statusCode ?? "";

  if (
    message.includes("row-level security") ||
    message.includes("permission") ||
    message.includes("unauthorized") ||
    status === "401" ||
    status === "403"
  ) {
    return "Photo uploads are blocked for this account. Sign out and sign in again, then retry. If it still fails, contact the SK Federation administrator.";
  }

  if (message.includes("bucket not found") || status === "404") {
    return "Photo storage is not set up yet. Please contact the SK Federation administrator.";
  }

  if (
    message.includes("maximum allowed size") ||
    message.includes("too large") ||
    status === "413"
  ) {
    return "That photo is too large. Choose an image smaller than 5 MB.";
  }

  if (message.includes("mime type") || message.includes("content type")) {
    return "That file type is not supported. Choose a JPG, PNG or WebP image.";
  }

  return "Could not upload your photo. Check your connection and try again.";
}

/**
 * Uploads to avatars/<user id>/… (the only folder the vendor may write to) and
 * stores the public URL on the profile so the web portal shows the same photo.
 */
export async function uploadAvatar(
  userId: string,
  avatar: PickedAvatar,
): Promise<string> {
  const extension = extensionFor(avatar.mimeType, avatar.fileName);
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  let arrayBuffer: ArrayBuffer;
  try {
    const response = await fetch(avatar.uri);
    arrayBuffer = await response.arrayBuffer();
  } catch {
    throw new Error(
      "Could not read the selected photo. Pick it again from your library.",
    );
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: avatar.mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(describeAvatarError(uploadError));
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (profileError) {
    throw new Error(
      "Your photo uploaded, but we could not save it to your profile. Please try again.",
    );
  }

  return publicUrl;
}
