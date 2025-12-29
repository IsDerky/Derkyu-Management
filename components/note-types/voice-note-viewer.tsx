"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface VoiceNoteViewerProps {
  content: string
}

export function VoiceNoteViewer({ content }: VoiceNoteViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1) // 0 a 1
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Cleanup al desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (!content) {
    return <p className="text-sm text-muted-foreground">Sin grabación</p>
  }

  const initAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(content)
      audioRef.current.volume = volume
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
        }
      }
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }
  }

  const togglePlayback = () => {
    initAudio()
    
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0]
    setVolume(volumeValue)
    if (audioRef.current) {
      audioRef.current.volume = volumeValue
    }
  }

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0)
      if (audioRef.current) {
        audioRef.current.volume = 0
      }
    } else {
      setVolume(1)
      if (audioRef.current) {
        audioRef.current.volume = 1
      }
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        className="h-8 w-8 shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex-1 flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px]" side="top">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volumen</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-full"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleMute}
                className="w-full"
              >
                {volume === 0 ? "Activar sonido" : "Silenciar"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 font-mono">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}