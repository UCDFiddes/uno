import { CardAbility, CardColour } from "config/deck";
import { cn } from "../../utils";

// Hex colours for each card colour.
export const CARD_COLOURS = {
  red: "#dc242a",
  green: "#a3b86c",
  blue: "#1496bb",
  yellow: "#ebc944",
  wild: "#222222",
};

// Icons for each card ability.
export const CARD_ICONS = {
  collect2: "+2",
  collect4: "+4",
  reverse: "🔄",
  skip: "⏪",
  wild: "W",
};

interface ComponentProps {
  number?: number;
  ability?: CardAbility;
  colour?: CardColour | null;
  disabled?: boolean;
}
// A card component that is responsive to the screen size and displays the card's colour, number, and ability.
export default function Card({ colour, ability, number, disabled }: ComponentProps) {
  // The icon to display on the card, depending if the number is a 9 or 6 a underline will be added to the top and bottom of the card.
  let icon = CARD_ICONS[ability!] ?? number;
  let showOrientation = `${icon}` === "9" || `${icon}` === "6";

  return (
    <div
      className="relative aspect-[3/4] select-none rounded-lg md:rounded-xl lg:rounded-2xl border-4 sm:border-6 md:border-8 lg:border-10 border-white data-[disabled=true]:border-zinc-900/75 overflow-hidden drop-shadow-[0_0px_16px_rgb(0_0_0_/_0.15)]"
      style={{ backgroundColor: CARD_COLOURS[colour ?? "wild"], height: "clamp(64px, calc(100vw / 8), 140px)" }}
      data-disabled={disabled}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/25" />
      <div
        className="absolute aspect-[1/2] rotate-[60deg] bg-gradient-to-t from-white/50 to-white/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ height: "clamp(64px, calc(100vw / 8), 140px)" }}
      />

      <div className="*:lg:scale-110 *:sm:scale-75 *:md:scale-100 *:scale-50">
        <p className="text-5xl tracking-tighter font-black text-black/90 poppins-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {icon}
        </p>
        <p
          className={cn(
            "text-lg tracking-tighter font-black text-white poppins-black absolute -top-1 left-0.25 sm:top-0.5 sm:left-1.5",
            showOrientation && "underline underline-offset-3",
          )}
        >
          {icon}
        </p>
        <p
          className={cn(
            "text-lg tracking-tighter font-black text-white poppins-black absolute right-0.25 -bottom-1 sm:right-1.5 sm:bottom-0.5 rotate-180",
            showOrientation && "underline underline-offset-3",
          )}
        >
          {icon}
        </p>
      </div>
    </div>
  );
}
