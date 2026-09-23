import Image from 'next/image';

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export default function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <Image
      src="/satquery-logo.svg"
      alt="SatQuery AI"
      width={compact ? 138 : 260}
      height={compact ? 48 : 90}
      className={className}
      priority
    />
  );
}