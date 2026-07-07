"use client";

import { useRouter } from "next/navigation";
import { Lock, Unlock, Trash2, Edit3 } from "lucide-react";

interface CapsuleCardProps {
  id: string;
  title: string;
  openDate: string;
  status: "locked" | "unlocked";
  type: "sent" | "received";
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export default function CapsuleCard({ id, title, openDate, status, type, onDelete }: CapsuleCardProps) {
  const router = useRouter();
  const formattedDate = new Date(openDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCardClick = () => {
    router.push(`/capsule/${id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative h-full flex flex-col justify-between p-8 border transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-sm
        ${status === "locked"
          ? "bg-black/20 border-parchment/10 hover:border-parchment/30 hover:shadow-[0_20px_50px_-15px_rgba(200,169,110,0.1)]"
          : "bg-espresso border-espresso/80 hover:border-gold/30 hover:shadow-[0_20px_50px_-15px_rgba(200,169,110,0.2)]"
        }`}
    >
      {/* Top line decoration */}
      <div className={`absolute top-0 left-0 right-0 h-px transition-all duration-500
        ${status === "locked"
          ? "bg-gradient-to-r from-transparent via-gold/30 to-transparent"
          : "bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        } opacity-0 group-hover:opacity-100`}
      />

      {/* Header */}
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${type === "sent" ? "bg-terracotta/70" : "bg-gold/60"}`} />
            <span className={`font-sans text-[10px] uppercase tracking-[0.25em] ${
              status === "locked" ? "text-parchment/50" : "text-gold/60"
            }`}>
              {type === "sent" ? "Sent" : "Received"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {type === "sent" && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {status === "locked" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/capsule/edit/${id}`);
                    }}
                    className="p-1.5 hover:bg-gold/10 text-parchment/40 hover:text-gold transition-colors border border-transparent hover:border-gold/20"
                    title="Edit Capsule"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(id, e);
                  }}
                  className="p-1.5 hover:bg-terracotta/10 text-parchment/40 hover:text-terracotta transition-colors border border-transparent hover:border-terracotta/20"
                  title="Delete Capsule"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            <div className={`w-8 h-8 border flex items-center justify-center ${
              status === "locked"
                ? "border-parchment/20 text-terracotta/70"
                : "border-gold/20 text-gold/70"
            }`}>
              {status === "locked"
                ? <Lock size={13} />
                : <Unlock size={13} />
              }
            </div>
          </div>
        </div>

        <h3 className={`font-serif font-light text-2xl leading-snug mb-2 line-clamp-2 ${
          status === "locked" ? "text-parchment/90" : "text-parchment"
        }`}>
          {title}
        </h3>
      </div>

      {/* Footer */}
      <div>
        <div className={`h-px mb-6 ${status === "locked" ? "bg-parchment/10" : "bg-white/10"}`} />
        <div className="flex justify-between items-end">
          <div>
            <p className={`font-sans text-[10px] uppercase tracking-[0.2em] mb-1 ${
              status === "locked" ? "text-parchment/40" : "text-parchment/30"
            }`}>
              {status === "locked" ? "Opens on" : "Opened"}
            </p>
            <p className={`font-serif text-base font-light tracking-wide ${
              status === "locked" ? "text-parchment/80" : "text-gold/80"
            }`}>
              {formattedDate}
            </p>
          </div>
          <span className={`font-sans text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 ${
            status === "locked"
              ? "text-terracotta/80 bg-terracotta/10 border border-terracotta/20"
              : "text-gold/70 bg-gold/10 border border-gold/20"
          }`}>
            {status === "locked" ? "Sealed" : "Open"}
          </span>
        </div>
      </div>
    </div>
  );
}
