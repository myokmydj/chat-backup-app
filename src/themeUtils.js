// 파일: src/themeUtils.js (최종 수정본)

// --- 헬퍼 함수들 ---
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function rgbToHex([r, g, b]) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getLuminance(hex) {
    try {
        const rgb = parseInt(hex.slice(1), 16);
        const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = (rgb >> 0) & 0xff;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch(e) { return 0; }
}

// 두 색상 간의 인지적 거리(contrast)를 계산 (0-100). 높을수록 대비가 큼.
function getColorContrast(color1, color2) {
    const lum1 = getLuminance(color1.hex);
    const lum2 = getLuminance(color2.hex);
    const C = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
    const deltaL = Math.abs(color1.hsl.l - color2.hsl.l) * 100;
    const deltaS = Math.abs(color1.hsl.s - color2.hsl.s) * 100;
    // 밝기 대비와 채도 대비를 조합하여 최종 점수 계산
    return (C * 5) + deltaL + (deltaS * 0.5); 
}

// --- 최종 테마 생성기 ---
function createTheme(name, bg, allColors) {
    const remaining = allColors.filter(c => c.hex !== bg.hex);
    if (remaining.length < 2) return null;

    // 포인트 색상: 배경과 가장 대비가 크고, 채도가 높은 색
    const accent = [...remaining].sort((a, b) => {
        return getColorContrast(b, bg) * b.hsl.s - getColorContrast(a, bg) * a.hsl.s;
    })[0];

    // 보조 색상: 배경/포인트와 겹치지 않으면서, 배경과 적절한 대비를 이루는 색
    const finalRemaining = remaining.filter(c => c.hex !== accent.hex);
    if (finalRemaining.length === 0) return null;
    const secondary = [...finalRemaining].sort((a, b) => getColorContrast(b, bg) - getColorContrast(a, bg))[0];

    // 가독성 보장
    const isDarkBg = getLuminance(bg.hex) < 128;
    const textColor = isDarkBg ? '#FFFFFF' : '#1D1D1F';
    const mutedTextColor = isDarkBg ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.55)';
    const inputBg = isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const borderColor = isDarkBg ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

    // appBg는 테마가 어두우면 더 어둡게, 밝으면 더 밝게 설정하여 깊이감 부여
    const appBg = isDarkBg ? '#121212' : '#F0F2F5';

    return {
        name,
        // 신규 속성 추가
        appBg: appBg,
        headerTitleColor: textColor,
        borderColor: borderColor,

        // 기존 속성
        sidebarBg: bg.hex, headerBg: bg.hex, footerBg: bg.hex, chatBg: bg.hex,
        buttonBg: accent.hex, bubbleMeBg: accent.hex, nameMeColor: accent.hex,
        bubbleOtherBg: secondary.hex,
        textColor, nameOtherColor: mutedTextColor,
        sidebarInputBg: inputBg, inputBg: inputBg,
    };
}


/**
 * 메인 함수: 팔레트에서 3가지 스타일의 테마를 안정적으로 생성
 */
export function generateThemesFromPalette(palette) {
  if (!palette || palette.length < 3) return [];

  const colors = palette.map(rgb => ({
    hex: rgbToHex(rgb),
    hsl: rgbToHsl(rgb),
  }));

  // 1. 역할별 최고 후보 선정
  const sortedByLightness = [...colors].sort((a, b) => a.hsl.l - b.hsl.l);
  const sortedBySaturation = [...colors].sort((a, b) => b.hsl.s - a.hsl.s);

  // 2. 각 후보를 배경으로 테마 생성
  const themeCandidates = {
      dark: createTheme("다크 테마", sortedByLightness[0], colors),
      light: createTheme("라이트 테마", sortedByLightness[colors.length - 1], colors),
      vibrant: createTheme("컬러풀 테마", sortedBySaturation[0], colors),
  };

  // 3. 유효하고 중복되지 않는 테마만 필터링
  const uniqueThemes = Array.from(
      new Map(
          Object.values(themeCandidates)
              .filter(Boolean) // null 제거
              .map(theme => [theme.sidebarBg, theme])
      )
  ).map(([, theme]) => theme);

  return uniqueThemes;
}