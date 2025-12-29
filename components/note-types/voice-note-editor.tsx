"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, Pause, Trash2, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface VoiceNoteEditorProps {
  value: string
  onChange: (value: string) => void
}

export function VoiceNoteEditor({ value, onChange }: VoiceNoteEditorProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState(value || "")
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (value && !audioUrl) {
      setAudioUrl(value)
    }
  }, [value])

  useEffect(() => {
    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          onChange(base64)
        }
        reader.readAsDataURL(audioBlob)

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const initAudio = () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = volume
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration)
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

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setAudioUrl("")
    setIsPlaying(false)
    setDuration(0)
    setCurrentTime(0)
    setAudioDuration(0)
    onChange("")
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

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className="space-y-4">
      {!audioUrl ? (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
          {isRecording ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-mono">{formatTime(duration)}</span>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 mr-2" />
                Detener Grabación
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Mic className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Presiona para grabar</p>
              <Button
                type="button"
                onClick={startRecording}
              >
                <Mic className="h-4 w-4 mr-2" />
                Comenzar Grabación
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-4 border rounded-lg bg-secondary/20">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
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
            
            <div className="flex-1">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(audioDuration)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={deleteRecording}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}