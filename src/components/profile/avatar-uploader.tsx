"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/lib/actions/addresses";

export function AvatarUploader({
  userId,
  avatarUrl,
  fullName,
}: {
  userId: string;
  avatarUrl: string | null;
  fullName: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran maksimal 2MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      toast.error(`Gagal mengunggah: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const res = await updateAvatarUrl(publicUrl);
    if (!res.ok) {
      toast.error(res.message);
      setUploading(false);
      return;
    }

    setPreview(publicUrl);
    toast.success("Foto profil diperbarui.");
    setUploading(false);
    router.refresh();
  }

  const initials = (fullName ?? "U").trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-border bg-muted">
        {preview ? (
          <Image src={preview} alt={fullName ?? "Avatar"} fill sizes="112px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-3xl font-bold text-muted-foreground">
            {initials}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="h-4 w-4" /> Ganti Foto
      </Button>
    </div>
  );
}
