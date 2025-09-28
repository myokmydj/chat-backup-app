// 파일: src/linkUtils.js (전체 코드)

const getYouTubeVideoId = (url) => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const getSpotifyEmbedUrl = (url) => {
  const regExp = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/;
  const match = url.match(regExp);
  if (match && match[1] && match[2]) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  return null;
};

const isTistoryUrl = (url) => {
  const regExp = /^(?:https?:\/\/)?([\w-]+)\.tistory\.com\/(\d+|entry\/.*)/;
  return regExp.test(url);
};

// ▼▼▼ [수정] postype.com과 posty.pe 도메인의 게시물 형태만 인식하도록 정규식 강화 ▼▼▼
const isPostypeUrl = (url) => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:postype\.com\/@[\w-]+\/post\/|posty\.pe\/)[\w-]+/;
  return regExp.test(url);
};

export const parseLink = (text) => {
  const trimmedText = text.trim();

  // 순서가 중요할 수 있으므로, 더 구체적인 링크부터 확인
  if (isTistoryUrl(trimmedText)) {
    return {
      type: 'link',
      content: { service: 'tistory', url: trimmedText },
      originalText: trimmedText,
    };
  }
  if (isPostypeUrl(trimmedText)) {
    return {
      type: 'link',
      content: { service: 'postype', url: trimmedText },
      originalText: trimmedText,
    };
  }

  const youtubeId = getYouTubeVideoId(trimmedText);
  if (youtubeId) {
    return {
      type: 'embed',
      content: { service: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtubeId}` },
      originalText: trimmedText,
    };
  }

  const spotifyEmbedUrl = getSpotifyEmbedUrl(trimmedText);
  if (spotifyEmbedUrl) {
    return {
      type: 'embed',
      content: { service: 'spotify', embedUrl: spotifyEmbedUrl },
      originalText: trimmedText,
    };
  }

  return null;
};