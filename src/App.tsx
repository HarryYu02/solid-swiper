import { createSignal, For, type Component } from "solid-js";
import {
  SwiperNext,
  SwiperPrevious,
  SwiperContent,
  SwiperProvider,
  SwiperCounter,
  SwiperApi,
} from "./components/Swiper";
import { initialCards } from "./constants/cardItems";
import TapCard from "./components/TapCard";

const App: Component = () => {
  const [cards, setCards] = createSignal(initialCards);
  const [swiperApi, setSwiperApi] = createSignal<SwiperApi>();
  const onPrependClicked = () => {
    const firstCard = cards()[0];
    setCards((cards) => [
      { id: firstCard.id - 1, name: `Card ${firstCard.id - 1}` },
      ...cards,
    ]);
    swiperApi().swipeBy(1);
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
      <SwiperProvider
        setApi={setSwiperApi}
        items={cards}
        opts={{
          itemWidth: 192,
        }}
      >
        <SwiperContent class="h-96 w-[19rem] pl-14">
          <For each={cards()}>
            {(card, i) => {
              const isFocused = () => i() == swiperApi().selected();
              return (
                <TapCard
                  back={
                    <p class="pointer-events-none text-center text-3xl font-semibold text-white select-none">
                      Back of {card.name}
                    </p>
                  }
                  canBeTapped={isFocused}
                  toggleLocked={swiperApi().toggleLocked}
                  width={() => 192}
                  selected={swiperApi().selected}
                  anims={[
                    {
                      anim: { scale: 1.5, rotateY: 0, zIndex: 20 },
                      opt: { type: "spring", stiffness: 500 },
                    },
                    {
                      anim: { rotateY: 180 },
                      opt: { type: "spring", duration: 1, stiffness: 100 },
                    },
                    {
                      anim: { rotateY: 360 },
                      opt: { type: "spring", duration: 1, stiffness: 100 },
                    },
                    {
                      anim: { scale: 1, rotateY: 0, zIndex: 0 },
                      opt: { type: "spring", stiffness: 200 },
                    },
                  ]}
                >
                  <p class="pointer-events-none text-3xl font-semibold text-white select-none">
                    {card.name}
                  </p>
                </TapCard>
              );
            }}
          </For>
        </SwiperContent>
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
