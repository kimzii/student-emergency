import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export function Avatar({
  src,
  alt,
  fallback,
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={
        "relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-200 items-center justify-center " +
        (className || "")
      }
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      ) : fallback ? (
        fallback
      ) : (
        <span className="text-gray-400 text-3xl">?</span>
      )}
    </div>
  );
}
