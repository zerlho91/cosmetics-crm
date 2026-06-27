/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#fdfbf7', // 연한 베이지 (Light Beige)
        card: '#ffffff',       // 화이트
        text: '#333333',       // 기본 텍스트
        neon: {
          pink: '#ff007f',     // 네온 핑크
          purple: '#b000ff',   // 네온 퍼플
          blue: '#00f0ff',     // 네온 블루
        }
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'neon': '0 0 10px rgba(255, 0, 127, 0.5), 0 0 20px rgba(255, 0, 127, 0.3)',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
