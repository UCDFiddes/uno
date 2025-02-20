import MainDeck from "./MainDeck";
import Players from "./Players";

// Game component that contains the main deck and the players which position themselves.
export default function Game() {
  return (
    <div>
      <MainDeck />
      <Players />
    </div>
  );
}
