const IMAGE_ENDPOINT = "https://pixabay.com/api/";
const VIDEO_ENDPOINT = "https://pixabay.com/api/videos/";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface ImageHit {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
  fullHDURL?: string;
  imageURL?: string;
  vectorURL?: string;
}

export interface VideoFile {
  url: string;
  width: number;
  height: number;
  size: number;
  thumbnail: string;
}

export interface VideoHit {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  videos: {
    large: VideoFile;
    medium: VideoFile;
    small: VideoFile;
    tiny: VideoFile;
  };
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface ImageResponse {
  total: number;
  totalHits: number;
  hits: ImageHit[];
}

export interface VideoResponse {
  total: number;
  totalHits: number;
  hits: VideoHit[];
}

export interface SearchImagesParams {
  q?: string;
  lang?: string;
  id?: number;
  image_type?: "all" | "photo" | "illustration" | "vector";
  orientation?: "all" | "horizontal" | "vertical";
  category?: string;
  min_width?: number;
  min_height?: number;
  colors?: string;
  editors_choice?: boolean;
  safesearch?: boolean;
  order?: "popular" | "latest";
  page?: number;
  per_page?: number;
}

export interface SearchVideosParams {
  q?: string;
  lang?: string;
  id?: number;
  video_type?: "all" | "film" | "animation";
  category?: string;
  min_width?: number;
  min_height?: number;
  editors_choice?: boolean;
  safesearch?: boolean;
  order?: "popular" | "latest";
  page?: number;
  per_page?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class PixabayClient {
  private readonly apiKey: string;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly fetchImpl: typeof fetch;

  constructor(apiKey: string, fetchImpl: typeof fetch = fetch) {
    if (!apiKey) {
      throw new Error(
        "Pixabay API key is required. Set PIXABAY_API_KEY environment variable. Get a free key at https://pixabay.com/api/docs/",
      );
    }
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
  }

  async searchImages(params: SearchImagesParams): Promise<ImageResponse> {
    return this.request<ImageResponse>(IMAGE_ENDPOINT, params as Record<string, unknown>);
  }

  async searchVideos(params: SearchVideosParams): Promise<VideoResponse> {
    return this.request<VideoResponse>(VIDEO_ENDPOINT, params as Record<string, unknown>);
  }

  async getImage(id: number): Promise<ImageHit | null> {
    const res = await this.searchImages({ id });
    return res.hits[0] ?? null;
  }

  async getVideo(id: number): Promise<VideoHit | null> {
    const res = await this.searchVideos({ id });
    return res.hits[0] ?? null;
  }

  private async request<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const cacheKey = url;

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const urlWithKey = url + (url.includes("?") ? "&" : "?") + `key=${encodeURIComponent(this.apiKey)}`;
    const res = await this.fetchImpl(urlWithKey, {
      headers: { Accept: "application/json", "User-Agent": "mcp-pixabay" },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Pixabay API error ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`,
      );
    }

    const value = (await res.json()) as T;
    this.cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  private buildUrl(endpoint: string, params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      search.set(k, typeof v === "boolean" ? String(v) : String(v));
    }
    const qs = search.toString();
    return qs ? `${endpoint}?${qs}` : endpoint;
  }
}
