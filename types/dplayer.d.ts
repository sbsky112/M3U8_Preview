declare module 'dplayer' {
  export interface DPlayerOptions {
    container: HTMLElement | null
    video?: {
      url: string
      type?: 'auto' | 'hls' | 'flv' | 'dash' | 'webtorrent' | 'normal'
      customType?: {
        [key: string]: (video: HTMLVideoElement, player: any) => void
      }
      pic?: string
      thumbnails?: string
      defaultQuality?: number
      quality?: Array<{
        name: string
        url: string
        type?: string
      }>
    }
    autoplay?: boolean
    theme?: string
    loop?: boolean
    lang?: string | 'en' | 'zh-cn' | 'zh-tw'
    screenshot?: boolean
    hotkey?: boolean
    preload?: 'none' | 'metadata' | 'auto'
    volume?: number
    mutex?: boolean
    pluginOptions?: {
      hls?: {
        [key: string]: any
      }
    }
  }

  export default class DPlayer {
    constructor(options: DPlayerOptions)
    play(): void
    pause(): void
    seek(time: number): void
    toggle(): void
    on(event: string, handler: () => void): void
    switchVideo(video: DPlayerOptions['video']): void
    notice(text: string, time?: number, opacity?: number): void
    switchQuality(index: number): void
    destroy(): void
    video: HTMLVideoElement
    container: HTMLElement
    paused: boolean
    volume(percentage?: number): number
  }
}
