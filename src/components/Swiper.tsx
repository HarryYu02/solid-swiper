import { animate } from "motion";
import {
  batch,
  createEffect,
  createSignal,
  For,
  type Component,
} from "solid-js";
import { initialCards } from "../constants/cardItems";
import { cn } from "../libs/cn";
import { clamp } from "../libs/math";
import ArrowLeft from "./ArrowLeft";
import ArrowRight from "./ArrowRight";
import Card from "./Card";

const MIN_SWIPE_THRESHOLD = 3; // 3px
const SWIPE_SENSITIVITY = 1.3;

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
    setCurrentPos((pos) => clamp(pos + n, 0, cards().length - 1));

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

  const [tapped, setTapped] = createSignal(0);

  createEffect(() => {
    animate(
      cardsDiv,
      { x: `calc(-${currentPos() * 13}rem + ${delta()}px)` },
      { duration: 0.7, ease: "easeInOut", type: "spring", bounce: 0.25 },
    );
  });

  return (
    <div class="flex w-full flex-col items-center gap-4 overflow-hidden">
      <div class="flex h-96 flex-col justify-center gap-8 overflow-hidden">
        <div
          class="relative flex w-[19rem] items-center"
          onPointerDown={(e) => {
            if (!tapped()) {
              setPrevX(e.clientX);
              setDelta(0);
              setIsDragging(true);
            }
          }}
          onPointerMove={(e) => {
            if (!isDragging()) return;
            const diff = e.clientX - prevX();
            if (Math.abs(diff) > MIN_SWIPE_THRESHOLD) {
              setDelta((d) => d + diff * SWIPE_SENSITIVITY);
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
              tapped() != 0 && "hidden",
            )}
            disabled={!canGoPrev() || tapped() != 0}
            onClick={onPrevClicked}
          >
            <ArrowLeft />
          </button>
          <div
            ref={cardsDiv}
            class="flex h-48 snap-x flex-nowrap items-center gap-4 px-14"
          >
            <For each={cards()}>
              {(card, i) => {
                const isFocused = () => i() == currentPos();
                return (
                  <Card
                    back={
                      <p class="pointer-events-none text-center text-3xl font-semibold text-white select-none">
                        Back of {card.name}
                      </p>
                    }
                    canBeTapped={isFocused() && !isDragging()}
                    currentPos={currentPos()}
                    setTapped={setTapped}
                    tapped={tapped()}
                  >
                    <p class="pointer-events-none text-3xl font-semibold text-white select-none">
                      {card.name}
                    </p>
                  </Card>
                );
              }}
            </For>
          </div>
          <button
            class={cn(
              "absolute right-2 z-10 rounded-full bg-white p-2 text-xl transition-all disabled:brightness-50",
              "cursor-pointer",
              !canGoNext() && "cursor-not-allowed",
              tapped() != 0 && "hidden",
            )}
            disabled={!canGoNext() || tapped() != 0}
            onClick={onNextClicked}
          >
            <ArrowRight />
          </button>
        </div>
        {/* <div class="flex items-center justify-center">
        <p>
          {currentPos() + 1}/{cards().length}
        </p>
      </div> */}
        <div class="flex items-center justify-center gap-2">
          <For each={cards()}>
            {(card, i) => {
              const isFocused = () => i() == currentPos();
              return (
                <div
                  class={cn(
                    "transition-colors",
                    "size-2 cursor-pointer rounded-full bg-slate-700",
                    isFocused() && "bg-white",
                  )}
                  onClick={() => setCurrentPos(i())}
                ></div>
              );
            }}
          </For>
        </div>
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
