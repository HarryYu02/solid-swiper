import { createSignal, type Component } from "solid-js";
import {
  SwiperNext,
  SwiperPrevious,
  SwiperContent,
  SwiperProvider,
  SwiperCounter,
} from "./components/Swiper";
import { initialCards } from "./constants/cardItems";

const App: Component = () => {
  const [cards, setCards] = createSignal(initialCards);
  const onPrependClicked = () => {
    const firstCard = cards()[0];
    setCards((cards) => [
      { id: firstCard.id - 1, name: `Card ${firstCard.id - 1}` },
      ...cards,
    ]);
  };
  const onAppendClicked = () => {
    const lastCard = cards()[cards().length - 1];
    setCards((cards) => [
      ...cards,
      { id: lastCard.id + 1, name: `Card ${lastCard.id + 1}` },
    ]);
  };

  return (
    <div class="flex h-full min-h-dvh touch-none flex-col items-center justify-center gap-8 bg-slate-400">
      <h1 class="text-4xl">
        <a
          href="https://github.com/HarryYu02/solid-swiper"
          class="underline"
          aria-label="github repo of this solid swiper"
        >
          Solid Swiper
        </a>
      </h1>
      <SwiperProvider items={cards}>
        <SwiperContent class="h-96 w-[19rem] pl-14" />
        <SwiperPrevious class="top-1/2 left-2 -translate-y-1/2" />
        <SwiperNext class="top-1/2 right-2 -translate-y-1/2" />
        <SwiperCounter class="absolute bottom-10 left-1/2 z-0 -translate-x-1/2" />
      </SwiperProvider>
      <div class="flex items-center justify-center gap-4">
        <button
          class="cursor-pointer rounded-lg bg-white px-4 py-2"
          onClick={onPrependClicked}
        >
          Prepend
        </button>
        <button
          class="cursor-pointer rounded-lg bg-white px-4 py-2"
          onClick={onAppendClicked}
        >
          Append
        </button>
      </div>
    </div>
  );
};

export default App;
