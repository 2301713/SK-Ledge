import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestPermissions: vi.fn(),
  launchLibrary: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  updateEq: vi.fn(),
  update: vi.fn(),
}));

vi.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: mocks.requestPermissions,
  launchImageLibraryAsync: mocks.launchLibrary,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mocks.upload,
        getPublicUrl: mocks.getPublicUrl,
      }),
    },
    from: () => ({ update: mocks.update }),
  },
}));

import {
  AVATAR_MAX_BYTES,
  pickAvatarImage,
  uploadAvatar,
} from "./profile-media";

beforeEach(() => {
  mocks.update.mockReturnValue({ eq: mocks.updateEq });
  mocks.updateEq.mockResolvedValue({ error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.getPublicUrl.mockReturnValue({
    data: { publicUrl: "https://cdn.example/avatars/u1/avatar.png" },
  });
  mocks.requestPermissions.mockResolvedValue({ granted: true });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(16),
    }),
  );
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const asset = (overrides: Record<string, unknown> = {}) => ({
  uri: "file:///tmp/photo.png",
  mimeType: "image/png",
  fileName: "photo.png",
  fileSize: 1024,
  ...overrides,
});

describe("pickAvatarImage", () => {
  it("explains a denied photo permission", async () => {
    mocks.requestPermissions.mockResolvedValue({ granted: false });

    await expect(pickAvatarImage()).resolves.toEqual({
      status: "error",
      message:
        "Allow photo access in your device settings to change your profile photo.",
    });
    expect(mocks.launchLibrary).not.toHaveBeenCalled();
  });

  it("returns cancelled when the picker is dismissed", async () => {
    mocks.launchLibrary.mockResolvedValue({ canceled: true, assets: null });

    await expect(pickAvatarImage()).resolves.toEqual({ status: "cancelled" });
  });

  it("rejects images above the size limit", async () => {
    mocks.launchLibrary.mockResolvedValue({
      canceled: false,
      assets: [asset({ fileSize: AVATAR_MAX_BYTES + 1 })],
    });

    await expect(pickAvatarImage()).resolves.toEqual({
      status: "error",
      message: "Choose an image smaller than 5 MB.",
    });
  });

  it("returns the picked image details", async () => {
    mocks.launchLibrary.mockResolvedValue({
      canceled: false,
      assets: [asset()],
    });

    await expect(pickAvatarImage()).resolves.toEqual({
      status: "picked",
      avatar: {
        uri: "file:///tmp/photo.png",
        mimeType: "image/png",
        fileName: "photo.png",
      },
    });
  });

  it("falls back to JPEG details when the picker omits them", async () => {
    mocks.launchLibrary.mockResolvedValue({
      canceled: false,
      assets: [asset({ mimeType: undefined, fileName: undefined })],
    });

    const outcome = await pickAvatarImage();

    expect(outcome).toMatchObject({
      status: "picked",
      avatar: { mimeType: "image/jpeg", fileName: "avatar.jpg" },
    });
  });
});

describe("uploadAvatar", () => {
  it("uploads into the vendor's folder and stores the public URL", async () => {
    const url = await uploadAvatar("u1", {
      uri: "file:///tmp/photo.png",
      mimeType: "image/png",
      fileName: "photo.png",
    });

    expect(mocks.upload).toHaveBeenCalledTimes(1);
    const [path, body, options] = mocks.upload.mock.calls[0];
    expect(path).toMatch(/^u1\/avatar-\d+\.png$/);
    expect(options).toMatchObject({ contentType: "image/png", upsert: true });
    expect(body).toBeInstanceOf(ArrayBuffer);
    expect(mocks.update).toHaveBeenCalledWith({
      avatar_url: "https://cdn.example/avatars/u1/avatar.png",
    });
    expect(mocks.updateEq).toHaveBeenCalledWith("id", "u1");
    expect(url).toBe("https://cdn.example/avatars/u1/avatar.png");
  });

  it("keeps the jpg extension for JPEG uploads", async () => {
    await uploadAvatar("u1", {
      uri: "file:///tmp/photo.jpeg",
      mimeType: "image/jpeg",
      fileName: "photo.jpeg",
    });

    expect(mocks.upload.mock.calls[0][0]).toMatch(/^u1\/avatar-\d+\.jpg$/);
  });

  it("surfaces a storage failure", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "Bucket not found" } });

    await expect(
      uploadAvatar("u1", {
        uri: "file:///tmp/photo.png",
        mimeType: "image/png",
        fileName: "photo.png",
      }),
    ).rejects.toThrow("Bucket not found");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("surfaces a profile update failure", async () => {
    mocks.updateEq.mockResolvedValue({ error: { message: "Row not found" } });

    await expect(
      uploadAvatar("u1", {
        uri: "file:///tmp/photo.png",
        mimeType: "image/png",
        fileName: "photo.png",
      }),
    ).rejects.toThrow("Row not found");
  });
});
