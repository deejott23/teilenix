interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string
  size?: number
}

/**
 * Rendert ein Icon aus dem sharepa SVG-Sprite (/public/icons.svg).
 * Verfügbare Namen: trip, group, expense, balance, settle, share, add, paid, pending,
 * cat-food, cat-hotel, cat-transport, cat-activity, cat-shopping, cat-other,
 * user, settings, bell, calendar, location, back, chevron-right, edit, delete
 *
 * Größen-Empfehlung: 16 (Buttons), 20 (List-Items), 24 (Standard), 28 (Tabbar)
 */
export function Icon({ name, size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  )
}
