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
    return "Photo uploads are blocked for this account. Ask the SK Federation administrator to enable the photo storage permissions for your account.";
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
  // Storage policies scope writes to the signed-in user's folder. Reading the
  // session here both refreshes an expiring token and guarantees the folder we
  // write to is the one auth.uid() reports.
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const session = sessionData.session;
  const ownerId = session?.user?.id;
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;

  if (sessionError || !ownerId || !session?.access_token) {
    throw new Error(
      "Your session expired before the upload. Sign in again, then retry.",
    );
  }

  if (isDev) {
    console.log("[avatars] uploading with session", {
      userId: ownerId,
      role: session.user.role,
      tokenExpiresAt: session.expires_at,
      nowSeconds: Math.floor(Date.now() / 1000),
      tokenPresent: Boolean(session.access_token),
    });
  }

  if (ownerId !== userId) {
    throw new Error(
      "Your account changed while uploading. Reopen your profile and try again.",
    );
  }

  const extension = extensionFor(avatar.mimeType, avatar.fileName);
  const path = `${ownerId}/avatar-${Date.now()}.${extension}`;

  let arrayBuffer: ArrayBuffer;
  try {
    const response = await fetch(avatar.uri);
    arrayBuffer = await response.arrayBuffer();
  } catch {
    throw new Error(
      "Could not read the selected photo. Pick it again from your library.",
    );
  }

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error(
      "Could not read the selected photo. Pick it again from your library.",
    );
  }

  // Each upload gets a fresh file name, so an upsert (and the UPDATE policy it
  // needs) is unnecessary. The bearer token is passed explicitly so the row is
  // written as this user even if the client cannot read the stored session
  // when the request is built, which otherwise fails the folder RLS check.
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: avatar.mimeType,
      upsert: false,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

  if (uploadError) {
    // The friendly text hides which storage rule failed. Development builds
    // append the raw server message and status so the cause is diagnosable.
    if (isDev) {
      console.warn("[avatars] upload failed", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        bucket: "avatars",
        path,
      });
    }

    const detail = isDev
      ? ` [${uploadError.statusCode ?? "no status"}: ${uploadError.message}]`
      : "";

    throw new Error(`${describeAvatarError(uploadError)}${detail}`);
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
