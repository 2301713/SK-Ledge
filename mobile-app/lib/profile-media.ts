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

  const response = await fetch(avatar.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: avatar.mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message || "Could not upload your photo. Please try again.",
    );
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message || "Could not save your photo.");
  }

  return publicUrl;
}
