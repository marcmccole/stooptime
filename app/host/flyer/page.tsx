"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactCrop, { type PercentCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import StepLayout from "@/components/onboarding/StepLayout";
import { savePartyState } from "@/lib/party-state";
import { track } from "@/lib/mixpanel";
import { supabase } from "@/lib/supabase";

function centerSquareCrop(width: number, height: number): PercentCrop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
    width,
    height
  ) as PercentCrop;
}

function getCroppedDataUrl(img: HTMLImageElement, crop: PercentCrop): string {
  const canvas = document.createElement("canvas");
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  const pixelCrop = {
    x: (crop.x / 100) * img.naturalWidth,
    y: (crop.y / 100) * img.naturalHeight,
    width: (crop.width / 100) * img.naturalWidth,
    height: (crop.height / 100) * img.naturalHeight,
  };
  const MAX = 1200;
  const size = Math.min(MAX, Math.max(pixelCrop.width, pixelCrop.height));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function Step7() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/host/auth");
    });
  }, [router]);

  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic") && !file.name.toLowerCase().endsWith(".heif")) return;

    let blob: Blob = file;
    if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().match(/\.heic|\.heif$/)) {
      const heic2any = (await import("heic2any")).default;
      blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 }) as Blob;
    }

    const reader = new FileReader();
    reader.onload = e => {
      setRawSrc(e.target?.result as string);
      setCrop(undefined);
      setPreview(null);
    };
    reader.readAsDataURL(blob);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  };

  const applyCrop = () => {
    if (!imgRef.current || !crop) return;
    const cropped = getCroppedDataUrl(imgRef.current, crop);
    setPreview(cropped);
    setRawSrc(null);
  };

  const reset = () => {
    setPreview(null);
    setRawSrc(null);
    setCrop(undefined);
  };

  return (
    <StepLayout step={7} backHref="/host/about">
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.2 }}>
        Put a face to the family portrait!
      </h1>
      <p style={{ fontSize: 15, color: "#888", marginBottom: 36, lineHeight: 1.6 }}>
        A photo of you (or your family) makes neighbors{" "}
        <strong style={{ color: "#1A1A1A" }}>twice as likely</strong> to show up.
      </p>

      {/* Crop UI */}
      {rawSrc && (
        <div style={{ marginBottom: 24 }}>
          <ReactCrop
            crop={crop}
            onChange={(_px, pct) => setCrop(pct)}
            aspect={1}
            circularCrop
            style={{ borderRadius: 12, overflow: "hidden", display: "block" }}
          >
            <img
              ref={imgRef}
              src={rawSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxWidth: "100%", maxHeight: 400, display: "block" }}
            />
          </ReactCrop>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              onClick={applyCrop}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 10,
                background: "#E8521A", color: "white", border: "none",
                fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Use this crop
            </button>
            <button
              onClick={reset}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 10,
                background: "transparent", color: "#999", border: "0.5px solid #E8E8E8",
                fontSize: 15, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload circle — shown when no crop in progress */}
      {!rawSrc && (
        <>
          <div
            className={`photo-upload-circle${dragOver ? " drag-over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{ marginBottom: 32 }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Family photo preview"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "#FDF0E8", display: "flex", alignItems: "center",
                  justifyContent: "center", marginBottom: 12,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#E8521A", marginBottom: 4 }}>
                  Drag or click to upload
                </span>
                <span style={{ fontSize: 12, color: "#BBBBBB" }}>JPG, PNG, HEIC welcome</span>
              </>
            )}
          </div>

          {preview && (
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: "#BBBBBB", display: "block",
                margin: "-20px auto 28px", textDecoration: "underline",
              }}
            >
              Change photo
            </button>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {!rawSrc && (
        <div style={{ marginTop: "auto" }}>
          <a
            href="/host/preview"
            onClick={() => { savePartyState({ photoDataUrl: preview }); track(preview ? "Photo Uploaded" : "Photo Skipped"); }}
            className="btn-primary"
            style={{ display: "block", textAlign: "center" }}
          >
            {preview ? "Create my flyer →" : "Continue without a photo"}
          </a>
          <p style={{ fontSize: 12, color: "#999999", textAlign: "center", marginTop: 12 }}>
            We'll use this on your flyer
          </p>
        </div>
      )}
    </StepLayout>
  );
}
