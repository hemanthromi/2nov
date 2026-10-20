/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        paper: 'var(--paper)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        field: 'var(--field)',
        teal: 'var(--teal)',
        'on-teal': 'var(--on-teal)',
        pale: 'var(--pale)',
        soft: 'var(--soft)',
        hover: 'var(--hover)',
        in: 'var(--in)',
        out: 'var(--out)',
        focus: 'var(--focus)',
        amber: { ink: 'var(--amber-ink)', bg: 'var(--amber-bg)' },
        rose: { ink: 'var(--rose-ink)', bg: 'var(--rose-bg)' },
        leaf: { ink: 'var(--leaf-ink)', bg: 'var(--leaf-bg)' },
        note: { ink: 'var(--note-ink)', bg: 'var(--note-bg)' },
      },
      fontSize: {
        base: ['13.5px', '1.45'],
      },
      borderRadius: {
        btn: '8px',
        iconbtn: '9px',
        card: '13px',
        dialog: '16px',
      },
      boxShadow: {
        card: '0 8px 30px #243c3705',
      },
    },
  },
  plugins: [],
};
