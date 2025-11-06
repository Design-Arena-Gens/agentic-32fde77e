import "./globals.css";

export const metadata = {
  title: "Jay Bhole Weather AI",
  description: "Mobile-friendly weather insights with seasonal advice in Hindi."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
