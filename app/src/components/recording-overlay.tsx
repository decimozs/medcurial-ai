import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function RecordingOverlay() {
  const { isRecording } = useAppStore()

  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-1000 ease-in-out",
        isRecording ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Sharp Edge Glow */}
      <div className={cn(
        "absolute inset-0 border-[2px] border-primary/40 blur-[1px] transition-all duration-1000 ease-in-out",
        isRecording ? "scale-100 opacity-100" : "scale-[1.01] opacity-0"
      )} />
      
      {/* Outer Bleed Glow (The actual "side glow") */}
      <div className={cn(
        "absolute inset-0 border-[20px] border-primary/20 blur-[40px] transition-all duration-1000 ease-in-out",
        isRecording ? "scale-100 opacity-100" : "scale-[1.05] opacity-0"
      )} />

      {/* Subtle Corner Emphasis */}
      <div className={cn(
        "absolute inset-0 shadow-[inset_0_0_40px_rgba(var(--primary),0.1)] transition-all duration-1000 ease-in-out",
        isRecording ? "opacity-100" : "opacity-0"
      )} />
    </div>
  )
}
