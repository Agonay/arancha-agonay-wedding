export interface MusicTrack {
  title: string;
  artist: string;
  spotify_url: string | null;
  deezer_url: string | null;
  youtube_url: string | null;
  album_art_url: string | null;
}

const SPOTIFY_TOKEN_CACHE: { token: string; expiresAt: number } = {
  token: "",
  expiresAt: 0,
};

export async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (SPOTIFY_TOKEN_CACHE.token && Date.now() < SPOTIFY_TOKEN_CACHE.expiresAt) {
    return SPOTIFY_TOKEN_CACHE.token;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) return null;

  const data = await res.json();
  SPOTIFY_TOKEN_CACHE.token = data.access_token;
  SPOTIFY_TOKEN_CACHE.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return data.access_token;
}

export async function searchSpotify(query: string): Promise<MusicTrack[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=8`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.tracks?.items?.map((track: any) => ({
    title: track.name,
    artist: track.artists?.map((a: any) => a.name).join(", ") || "",
    spotify_url: track.external_urls?.spotify || null,
    deezer_url: null,
    youtube_url: null,
    album_art_url: track.album?.images?.[0]?.url || null,
  })) || [];
}

export async function searchDeezer(query: string): Promise<MusicTrack[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=8`,
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data.data?.map((track: any) => ({
      title: track.title,
      artist: track.artist?.name || "",
      spotify_url: null,
      deezer_url: track.link || null,
      youtube_url: null,
      album_art_url: track.album?.cover_medium || track.album?.cover || null,
    })) || [];
  } catch {
    return [];
  }
}

export async function searchMusic(query: string): Promise<MusicTrack[]> {
  if (!query.trim()) return [];

  const spotify = await searchSpotify(query);
  if (spotify.length > 0) return spotify;

  return searchDeezer(query);
}

export function parseMusicUrl(url: string): {
  title: string;
  artist: string;
  spotify_url: string | null;
  deezer_url: string | null;
  youtube_url: string | null;
} | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.includes("open.spotify.com")) {
    return { title: "", artist: "", spotify_url: trimmed, deezer_url: null, youtube_url: null };
  }
  if (trimmed.includes("deezer.com")) {
    return { title: "", artist: "", spotify_url: null, deezer_url: trimmed, youtube_url: null };
  }
  if (trimmed.includes("youtube.com") || trimmed.includes("music.youtube.com") || trimmed.includes("youtu.be")) {
    return { title: "", artist: "", spotify_url: null, deezer_url: null, youtube_url: trimmed };
  }
  return null;
}

export const MOMENT_CATEGORIES = [
  { value: "ceremonia", label: "Ceremonia" },
  { value: "cocktail", label: "Cóctel" },
  { value: "cena", label: "Cena" },
  { value: "primer-baile", label: "Primer baile" },
  { value: "fiesta", label: "Fiesta" },
  { value: "cierre", label: "Cierre" },
  { value: "general", label: "General" },
] as const;

export function categoryLabel(value: string): string {
  return MOMENT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function isWeddingDay(): boolean {
  const weddingDate = process.env.WEDDING_DATE;
  if (!weddingDate) return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  return today === weddingDate;
}

export function getFeatureFlag(key: string): boolean {
  return false;
}
