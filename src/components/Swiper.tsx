import {
  createSignal,
  createEffect,
  For,
  batch,
  type Component,
} from "solid-js";
import ArrowLeft from "./ArrowLeft";
import ArrowRight from "./ArrowRight";
import { cn } from "../libs/cn";
import { animate, AnimationPlaybackControlsWithThen, press } from "motion";

const initialCards = [
  {
    id: 1,
    name: "Card 1",
  },
  {
    id: 2,
    name: "Card 2",
  },
  {
    id: 3,
    name: "Card 3",
  },
  {
    id: 4,
    name: "Card 4",
  },
  {
    id: 5,
    name: "Card 5",
  },
];

const Swiper: Component = () => {
  let cardsDiv: HTMLDivElement | undefined;

  const [cards, setCards] = createSignal(initialCards);
  const [currentPos, setCurrentPos] = createSignal<number>(0);
  const [prevX, setPrevX] = createSignal(0);
  const [delta, setDelta] = createSignal<number>(0);
  const [isDragging, setIsDragging] = createSignal(false);
  const canGoPrev = () => currentPos() > 0;
  const canGoNext = () => currentPos() < cards().length - 1;

  const adjustCurrentPos = (n: number) =>
    setCurrentPos((pos) => {
      const newPos = pos + n;
      if (newPos < 0) return 0;
      if (newPos > cards().length - 1) return cards().length - 1;
      return newPos;
    });

  const onPrevClicked = () => {
    if (canGoPrev()) adjustCurrentPos(-1);
  };
  const onNextClicked = () => {
    if (canGoNext()) adjustCurrentPos(1);
  };
  const onPrependClicked = () => {
    batch(() => {
      const firstCard = cards()[0];
      setCards((cards) => [
        { id: firstCard.id - 1, name: `Card ${firstCard.id - 1}` },
        ...cards,
      ]);
      adjustCurrentPos(1);
    });
  };
  const onAppendClicked = () => {
    const lastCard = cards()[cards().length - 1];
    setCards((cards) => [
      ...cards,
      { id: lastCard.id + 1, name: `Card ${lastCard.id + 1}` },
    ]);
  };

  const onDragDone = () => {
    if (isDragging() && delta() != 0 && prevX() != 0) {
      const distance = Math.abs(delta());
      if (distance > 312) {
        // 1.5 card width + 1 space around = 312px
        adjustCurrentPos(-1 * Math.floor((delta() + 104) / 208));
      } else if (distance > 104) {
        // 0.5 card width + 0.5 space around = 104px
        adjustCurrentPos(delta() < 0 ? 1 : -1);
      }
    }
    setPrevX(0);
    setDelta(0);
    setIsDragging(false);
  };

  createEffect(() => {
    animate(
      cardsDiv,
      { x: `calc(-${currentPos() * 13}rem + ${delta()}px)` },
      { duration: 0.7, ease: "easeInOut", type: "spring", bounce: 0.25 },
    );
  });

  return (
    <div class="flex w-full flex-col items-center gap-4 overflow-hidden">
      <div
        class="relative flex w-[19rem] items-center overflow-hidden"
        onPointerDown={(e) => {
          setPrevX(e.clientX);
          setDelta(0);
          setIsDragging(true);
        }}
        onPointerMove={(e) => {
          if (!isDragging()) return;
          const diff = e.clientX - prevX();
          if (Math.abs(diff) > 3) {
            setDelta((d) => d + diff * 1.3);
            setPrevX(e.clientX);
          }
        }}
        onPointerLeave={onDragDone}
        onPointerUp={onDragDone}
      >
        <button
          class={cn(
            "absolute left-2 z-10 rounded-full bg-white p-2 text-xl transition-all disabled:brightness-50",
            "cursor-pointer",
            !canGoPrev() && "cursor-not-allowed",
          )}
          disabled={!canGoPrev()}
          onClick={onPrevClicked}
        >
          <ArrowLeft />
        </button>
        <div
          ref={cardsDiv}
          class="z-0 flex h-48 snap-x flex-nowrap gap-4 px-14"
        >
          <For each={cards()}>
            {(card) => {
              return (
                <div
                  class={cn(
                    "card aspect-square h-48 w-48 rounded-lg bg-slate-700 shadow-xl transition-all",
                    "flex h-full snap-center items-center justify-center",
                  )}
                >
                  <p class="pointer-events-none text-3xl font-semibold text-white">
                    {card.id}
                  </p>
                </div>
              );
            }}
          </For>
        </div>
        <button
          class={cn(
            "absolute right-2 z-10 rounded-full bg-white p-2 text-xl transition-all disabled:brightness-50",
            "cursor-pointer",
            !canGoNext() && "cursor-not-allowed",
          )}
          disabled={!canGoNext()}
          onClick={onNextClicked}
        >
          <ArrowRight />
        </button>
      </div>
      <div class="flex items-center justify-center">
        <p>
          {currentPos() + 1}/{cards().length}
        </p>
      </div>
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

export default Swiper;
