import type { ReactNode } from 'react';

export const metadata = {
  title: 'DentalOS',
  description: 'Dental practice growth and operations platform'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
