import { useWindowDimensions } from 'react-native'

export function useResponsive() {
  const { width, height } = useWindowDimensions()
  const isTablet = width >= 600
  const scale = isTablet ? 1.35 : 1

  return {
    isTablet,
    width,
    height,
    scale,
    s: (size: number) => Math.round(size * scale)
  }
}
